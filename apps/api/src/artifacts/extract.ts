/**
 * Turn a local file into plain text, and nothing else (v2 runbook P02–P04).
 *
 * The rule this module exists to enforce: **nothing here executes anything.**
 * A `.py` file is decoded, not run. A notebook's outputs are discarded, not
 * rendered. A PDF's embedded links and actions are never followed. What comes
 * out is text a person could have typed, and the original bytes are dropped on
 * the floor — the store keeps extracted text, a hash and metadata, never the
 * file.
 *
 * Every extractor reports *warnings* rather than silently doing less than it
 * said: truncation, a dropped page, an unreadable region. A researcher has to
 * be able to tell the difference between "this paper says nothing about X" and
 * "the part about X did not extract".
 */
import { createHash } from 'node:crypto';
import {
  EXTRACTION_TIMEOUT_MS,
  MAX_EXTRACTED_CHARACTERS,
  MAX_PDF_PAGES,
  MAX_UPLOAD_BYTES,
  NOTEBOOK_EXTENSION,
  PDF_EXTENSION,
  extensionOf,
  isAllowedExtension,
  mediaTypeFor,
} from './limits.js';

export type ExtractionFailure =
  | 'unsupported_type'
  | 'too_large'
  | 'empty_file'
  | 'binary_content'
  | 'no_extractable_text'
  | 'malformed'
  | 'encrypted'
  | 'timed_out';

export class ExtractionError extends Error {
  readonly code: ExtractionFailure;
  constructor(code: ExtractionFailure, message: string) {
    super(message);
    this.name = 'ExtractionError';
    this.code = code;
  }
}

export interface Extraction {
  readonly text: string;
  readonly sha256: string;
  readonly byteCount: number;
  readonly characterCount: number;
  readonly mediaType: string;
  readonly extension: string;
  readonly warnings: readonly string[];
}

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                              */
/* -------------------------------------------------------------------------- */

/** Normalise newlines and strip a byte-order mark. Nothing else is altered. */
function normalize(text: string): string {
  return text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

function cap(text: string, warnings: string[]): string {
  if (text.length <= MAX_EXTRACTED_CHARACTERS) return text;
  warnings.push(
    `Extraction stopped at ${String(MAX_EXTRACTED_CHARACTERS)} characters; the rest of this file was not read.`,
  );
  return text.slice(0, MAX_EXTRACTED_CHARACTERS);
}

/**
 * Does this look like a binary file wearing a text extension?
 *
 * A NUL byte is the decisive signal — no text format this product accepts
 * contains one — and a high proportion of C0 control bytes is the corroborating
 * one. Refusing is better than storing mojibake somebody later reads as prose.
 */
function looksBinary(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 8_192));
  let controls = 0;
  for (const byte of sample) {
    if (byte === 0) return true;
    // Tab, newline, carriage return and form feed are ordinary in text.
    if (byte < 0x09 || (byte > 0x0d && byte < 0x20)) controls += 1;
  }
  return sample.length > 0 && controls / sample.length > 0.1;
}

/** Decode UTF-8, replacing invalid sequences rather than throwing. */
function decodeUtf8(bytes: Uint8Array, warnings: string[]): string {
  const strict = new TextDecoder('utf-8', { fatal: false });
  const text = strict.decode(bytes);
  if (text.includes('\uFFFD')) {
    warnings.push(
      'Some bytes were not valid UTF-8 and were replaced. The text may be missing characters.',
    );
  }
  return text;
}

/* -------------------------------------------------------------------------- */
/* Plain text and code (P02)                                                   */
/* -------------------------------------------------------------------------- */

export function extractText(bytes: Uint8Array, warnings: string[]): string {
  if (looksBinary(bytes)) {
    throw new ExtractionError(
      'binary_content',
      'This file looks like binary data rather than text. Only text, code, notebook and PDF files are read.',
    );
  }
  return normalize(decodeUtf8(bytes, warnings));
}

/* -------------------------------------------------------------------------- */
/* Jupyter notebooks (P03)                                                     */
/* -------------------------------------------------------------------------- */

interface NotebookCell {
  cell_type?: unknown;
  source?: unknown;
}

function cellSource(cell: NotebookCell): string {
  const source = cell.source;
  if (typeof source === 'string') return source;
  if (Array.isArray(source)) return source.filter((line) => typeof line === 'string').join('');
  return '';
}

/**
 * Markdown and code-cell source, in cell order.
 *
 * Outputs, attachments, execution counts and widget state are dropped. That is
 * not a simplification: a notebook's outputs routinely contain base64 images
 * and, in real research repositories, credentials printed by accident. None of
 * it is research prose, and none of it belongs in a model prompt.
 */
export function extractNotebook(bytes: Uint8Array, warnings: string[]): string {
  const raw = extractText(bytes, warnings);
  let notebook: { cells?: unknown; metadata?: unknown };
  try {
    notebook = JSON.parse(raw) as { cells?: unknown; metadata?: unknown };
  } catch {
    throw new ExtractionError('malformed', 'This notebook is not valid JSON.');
  }

  const cells = Array.isArray(notebook.cells) ? (notebook.cells as NotebookCell[]) : undefined;
  if (cells === undefined) {
    throw new ExtractionError('malformed', 'This notebook has no cell list.');
  }

  const metadata = notebook.metadata as { language_info?: { name?: unknown } } | undefined;
  const language =
    typeof metadata?.language_info?.name === 'string' ? metadata.language_info.name : 'unknown';

  const pieces: string[] = [`[notebook: ${cells.length} cells, language ${language}]`];
  let dropped = 0;
  cells.forEach((cell, index) => {
    const type = typeof cell.cell_type === 'string' ? cell.cell_type : 'unknown';
    const source = cellSource(cell).trimEnd();
    if (type !== 'markdown' && type !== 'code') {
      dropped += 1;
      return;
    }
    if (source === '') return;
    pieces.push(`\n[cell ${String(index + 1)} · ${type}]\n${source}`);
  });

  if (dropped > 0) {
    warnings.push(`${String(dropped)} cell(s) were neither markdown nor code and were skipped.`);
  }
  warnings.push('Notebook outputs, attachments and execution counts were discarded.');

  const text = normalize(pieces.join('\n'));
  if (text.trim() === pieces[0]) {
    throw new ExtractionError('no_extractable_text', 'This notebook has no markdown or code text.');
  }
  return text;
}

/* -------------------------------------------------------------------------- */
/* Text PDFs (P04)                                                             */
/* -------------------------------------------------------------------------- */

interface PdfTextItem {
  str?: unknown;
  hasEOL?: unknown;
}

interface PdfDocument {
  readonly numPages: number;
  getPage(n: number): Promise<{ getTextContent(): Promise<{ items: PdfTextItem[] }> }>;
}

interface PdfLoadingTask {
  readonly promise: Promise<PdfDocument>;
  destroy(): Promise<void>;
}

/**
 * Text from a PDF, page by page, with explicit page markers.
 *
 * `pdfjs-dist` is used in its plain Node form with every optional capability
 * off: no worker, no eval, no fonts, no system fonts, no XFA, and no network.
 * A scanned PDF yields nothing and is reported as `no_extractable_text` rather
 * than stored as an empty artifact — this product does not pretend to have OCR.
 */
export async function extractPdf(
  bytes: Uint8Array,
  warnings: string[],
  deadline = Number.POSITIVE_INFINITY,
): Promise<string> {
  const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as {
    getDocument: (options: Record<string, unknown>) => PdfLoadingTask;
  };

  // The loading task owns the worker and the buffer; destroying it is what
  // releases them. The document proxy itself has no destroy in pdf.js 6.
  let task: PdfLoadingTask | undefined;
  let document: PdfDocument;
  try {
    task = pdfjs.getDocument({
      // A copy, because pdf.js transfers ownership of the buffer it is given.
      data: new Uint8Array(bytes),
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
      useSystemFonts: false,
      enableXfa: false,
      stopAtErrors: false,
    });
    document = await task.promise;
  } catch (error) {
    await task?.destroy().catch(() => undefined);
    const name = (error as { name?: string }).name ?? '';
    if (name === 'PasswordException') {
      throw new ExtractionError(
        'encrypted',
        'This PDF is password-protected. Decrypt it first if you want to use it as context.',
      );
    }
    throw new ExtractionError('malformed', 'This PDF could not be opened.');
  }

  try {
    const total = document.numPages;
    if (total > MAX_PDF_PAGES) {
      warnings.push(
        `This PDF has ${String(total)} pages; only the first ${String(MAX_PDF_PAGES)} were read.`,
      );
    }
    const pages = Math.min(total, MAX_PDF_PAGES);

    const pieces: string[] = [];
    let failed = 0;
    for (let number = 1; number <= pages; number += 1) {
      // The deadline is checked by the work itself, not only by a timer racing
      // it: page extraction is CPU-bound and resolves through microtasks, so a
      // `setTimeout` alone would never get a turn to fire.
      if (Date.now() > deadline) {
        throw new ExtractionError(
          'timed_out',
          `Extraction stopped after ${String(number - 1)} of ${String(pages)} pages because it was taking too long.`,
        );
      }
      try {
        const page = await document.getPage(number);
        const content = await page.getTextContent();
        const text = content.items
          .map((item) => (typeof item.str === 'string' ? item.str : ''))
          .join('')
          .trim();
        if (text !== '') pieces.push(`[page ${String(number)}]\n${text}`);
      } catch (error) {
        if (error instanceof ExtractionError) throw error;
        failed += 1;
      }
    }
    if (failed > 0) {
      warnings.push(`${String(failed)} page(s) could not be read and were skipped.`);
    }

    const text = normalize(pieces.join('\n\n'));
    if (text.trim() === '') {
      throw new ExtractionError(
        'no_extractable_text',
        'No text could be extracted. This is probably a scanned PDF; there is no OCR here, so it cannot be used as context.',
      );
    }
    return text;
  } finally {
    await task.destroy().catch(() => undefined);
  }
}

/* -------------------------------------------------------------------------- */
/* The one entry point                                                         */
/* -------------------------------------------------------------------------- */

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new ExtractionError(
          'timed_out',
          `Extraction took longer than ${String(Math.round(ms / 1000))} seconds and was stopped.`,
        ),
      );
    }, ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/** Extract one uploaded file. Throws `ExtractionError` for anything refused. */
export async function extractArtifact(
  fileName: string,
  bytes: Uint8Array,
  options: { timeoutMs?: number } = {},
): Promise<Extraction> {
  const extension = extensionOf(fileName);
  if (!isAllowedExtension(extension)) {
    throw new ExtractionError(
      'unsupported_type',
      `Files ending in "${extension === '' ? '(no extension)' : extension}" are not read. Text, code, notebooks and text PDFs are.`,
    );
  }
  if (bytes.length === 0) {
    throw new ExtractionError('empty_file', 'This file is empty.');
  }
  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new ExtractionError(
      'too_large',
      `This file is ${String(bytes.length)} bytes; the limit is ${String(MAX_UPLOAD_BYTES)}.`,
    );
  }

  const warnings: string[] = [];
  const budget = options.timeoutMs ?? EXTRACTION_TIMEOUT_MS;
  const deadline = Date.now() + budget;
  // Two guards, because one is not enough. The deadline bounds work that never
  // yields; the timer bounds work that yields and then hangs.
  const text = await withTimeout(
    (async () => {
      if (extension === PDF_EXTENSION) return extractPdf(bytes, warnings, deadline);
      if (extension === NOTEBOOK_EXTENSION) return extractNotebook(bytes, warnings);
      return extractText(bytes, warnings);
    })(),
    budget,
  );

  const capped = cap(text, warnings);
  if (capped.trim() === '') {
    throw new ExtractionError('no_extractable_text', 'No text could be extracted from this file.');
  }

  return {
    text: capped,
    // The hash is of the ORIGINAL bytes, so the same file is recognised even
    // though the bytes themselves are never kept.
    sha256: createHash('sha256').update(bytes).digest('hex'),
    byteCount: bytes.length,
    characterCount: capped.length,
    mediaType: mediaTypeFor(extension),
    extension,
    warnings,
  };
}

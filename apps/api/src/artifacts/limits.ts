/**
 * Hard limits for local artifact ingestion (v2 runbook §4.9).
 *
 * These are not tuning knobs. They are the boundary that keeps "read a local
 * paper" from becoming "run arbitrary work on arbitrary input": a bounded
 * number of bytes, a bounded number of pages, a bounded number of characters,
 * and a bounded amount of time. Every one of them is enforced, and a file that
 * exceeds one is refused with a reason rather than silently truncated.
 */

/** 10 MiB. The largest thing anyone should hand a local research tool. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** A PDF longer than this is a book, not a paper. */
export const MAX_PDF_PAGES = 300;

/** Extracted characters. Roughly 50,000 words, far beyond any model context. */
export const MAX_EXTRACTED_CHARACTERS = 200_000;

/** Extraction is bounded in time as well as in size. */
export const EXTRACTION_TIMEOUT_MS = 60_000;

/**
 * Extensions this product will read.
 *
 * Deliberately a list, not a pattern: adding a format is a decision somebody
 * makes, not something that happens because a file arrived with a new suffix.
 */
export const TEXT_EXTENSIONS = [
  '.txt',
  '.md',
  '.markdown',
  '.tex',
  '.lean',
  '.py',
  '.rs',
  '.c',
  '.h',
  '.cpp',
  '.hpp',
  '.java',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.go',
  '.jl',
  '.r',
  '.m',
  '.json',
  '.yaml',
  '.yml',
  '.csv',
] as const;

export const NOTEBOOK_EXTENSION = '.ipynb';
export const PDF_EXTENSION = '.pdf';

export const ALLOWED_EXTENSIONS = [...TEXT_EXTENSIONS, NOTEBOOK_EXTENSION, PDF_EXTENSION] as const;

export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

/** The extension of a file name, lowercased, or '' when it has none. */
export function extensionOf(name: string): string {
  const base = name.slice(name.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot <= 0 ? '' : base.slice(dot).toLowerCase();
}

export function isAllowedExtension(extension: string): extension is AllowedExtension {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(extension);
}

/**
 * The media type recorded for an extension.
 *
 * The browser's own Content-Type is not trusted: it is trivially wrong and
 * trivially forged, so the extension — which is what decides how the file is
 * read — is what gets recorded.
 */
export function mediaTypeFor(extension: string): string {
  switch (extension) {
    case '.pdf':
      return 'application/pdf';
    case '.ipynb':
      return 'application/x-ipynb+json';
    case '.json':
      return 'application/json';
    case '.csv':
      return 'text/csv';
    case '.md':
    case '.markdown':
      return 'text/markdown';
    case '.yaml':
    case '.yml':
      return 'application/yaml';
    case '.txt':
      return 'text/plain';
    default:
      return 'text/plain';
  }
}

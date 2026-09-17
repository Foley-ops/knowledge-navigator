import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { State } from '@site/src/components/Ui';
import { api } from '@site/src/lib/api';
import type { Artifact } from '@site/src/lib/api';
import { shortDate } from '@site/src/lib/workspace';

/**
 * Local research context (v2 runbook P06).
 *
 * The interface is explicit about what happens to a file, because the answer is
 * unusual: the bytes are read once, the text is kept, and the file itself is
 * not stored anywhere. A researcher deciding whether to hand over an
 * unpublished paper deserves to be told that before they do it.
 *
 * Files are chosen one at a time, by the person. Nothing scans a directory.
 */

const ACCEPT = [
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
  '.ipynb',
  '.pdf',
].join(',');

function bytes(count: number): string {
  if (count < 1024) return `${String(count)} B`;
  if (count < 1024 * 1024) return `${String(Math.round(count / 1024))} KB`;
  return `${(count / (1024 * 1024)).toFixed(1)} MB`;
}

function Preview({ projectId, artifact }: { projectId: string; artifact: Artifact }): ReactNode {
  const [text, setText] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || text !== undefined) return;
    const controller = new AbortController();
    api
      .getArtifact(projectId, artifact.id, controller.signal)
      .then((full) => {
        setText(full.extractedText);
      })
      .catch(() => {
        setText('');
      });
    return () => {
      controller.abort();
    };
  }, [open, text, projectId, artifact.id]);

  return (
    <>
      <button
        type="button"
        className="workspace-action"
        aria-expanded={open}
        onClick={() => {
          setOpen((was) => !was);
        }}
      >
        {open ? 'Hide extracted text' : 'Show extracted text'}
      </button>
      {open && (
        <pre className="artifact-preview">
          {/* Shown as text. Nothing extracted from a file is ever rendered as
              markup, however it was formatted in the original. */}
          {text === undefined ? 'Reading…' : text === '' ? 'Nothing to show.' : text}
        </pre>
      )}
    </>
  );
}

export function Artifacts({ projectId }: { projectId: string }): ReactNode {
  const [items, setItems] = useState<Artifact[] | undefined>(undefined);
  const [archived, setArchived] = useState<Artifact[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const input = useRef<HTMLInputElement | null>(null);

  const load = useCallback(() => {
    api
      .listArtifacts(projectId)
      .then((page) => {
        setItems(page.items);
      })
      .catch(() => {
        setItems([]);
      });
  }, [projectId]);

  const loadArchived = useCallback(() => {
    api
      .listArtifacts(projectId, true)
      .then((page) => {
        setArchived(page.items.filter((artifact) => artifact.archivedAt !== null));
      })
      .catch(() => {
        setArchived([]);
      });
  }, [projectId]);

  useEffect(load, [load]);
  useEffect(loadArchived, [loadArchived]);

  const upload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.currentTarget.files?.[0];
    if (file === undefined) return;
    setBusy(true);
    setFailure(undefined);
    setMessage(undefined);
    api
      .uploadArtifact(projectId, file)
      .then((result) => {
        setMessage(
          result.deduplicated
            ? `${result.artifact.label} was already here; the same file is one artifact.`
            : `${result.artifact.label}: ${String(result.artifact.characterCount)} characters extracted.`,
        );
        load();
      })
      .catch((error: unknown) => {
        setFailure(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setBusy(false);
        if (input.current !== null) input.current.value = '';
      });
  };

  return (
    <>
      <p className="workspace-explainer">
        Upload a local paper, notebook or source file to use as context for a question. The text is
        extracted and kept; <strong>the file itself is not stored</strong>. Nothing is executed, and
        nothing is sent anywhere except to the local model, and only when you select it for a
        specific question.
      </p>

      <label className="nav-field">
        <span className="nav-field__label">Choose a file</span>
        <input
          ref={input}
          className="nav-input"
          type="file"
          accept={ACCEPT}
          disabled={busy}
          onChange={upload}
        />
        <span className="nav-field__hint">
          Text, code, Markdown, LaTeX, Lean, JSON, CSV, Jupyter notebooks and text PDFs. Up to
          10&nbsp;MB. Scanned PDFs cannot be read — there is no OCR here.
        </span>
      </label>

      {busy && (
        <State tone="working" title="Reading the file…">
          Extraction runs locally.
        </State>
      )}
      {message !== undefined && (
        <p className="private-message" role="status">
          {message}
        </p>
      )}
      {failure !== undefined && (
        <State tone="problem" title="That file was not accepted">
          {failure}
        </State>
      )}

      {items !== undefined && items.length === 0 && !busy && (
        <State tone="empty" title="No uploaded context yet">
          Local papers, notebooks and code files you choose to upload appear here, as extracted
          text. The original file is never kept.
        </State>
      )}

      {items !== undefined && items.length > 0 && (
        <ul className="workspace-list">
          {items.map((artifact) => (
            <li key={artifact.id} className="workspace-item">
              <p className="workspace-item__title">{artifact.label}</p>
              <p className="workspace-item__meta">
                {artifact.originalName} · {artifact.mediaType} · {bytes(artifact.byteCount)} read ·{' '}
                {artifact.characterCount.toLocaleString()} characters extracted ·{' '}
                {shortDate(artifact.createdAt)}
              </p>
              {artifact.warnings.length > 0 && (
                <ul className="artifact-warnings">
                  {artifact.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
              <p className="workspace-item__meta">
                <Preview projectId={projectId} artifact={artifact} />
                <button
                  type="button"
                  className="workspace-action"
                  onClick={() => {
                    void api.archiveArtifact(projectId, artifact.id).then(() => {
                      load();
                      loadArchived();
                      setShowArchived(true);
                    });
                  }}
                >
                  Archive
                </button>
              </p>
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <>
          <h3 className="private-heading">
            Archived
            <button
              type="button"
              className="workspace-action"
              aria-expanded={showArchived}
              onClick={() => {
                setShowArchived((was) => !was);
              }}
            >
              {showArchived ? 'Hide' : `Show ${String(archived.length)}`}
            </button>
          </h3>
          <ul className="workspace-list" hidden={!showArchived}>
            {archived.map((artifact) => (
              <li key={artifact.id} className="workspace-item">
                <p className="workspace-item__title">{artifact.label}</p>
                <p className="workspace-item__meta">
                  <button
                    type="button"
                    className="workspace-action"
                    onClick={() => {
                      void api.restoreArtifact(projectId, artifact.id).then(() => {
                        load();
                        loadArchived();
                      });
                    }}
                  >
                    Restore
                  </button>
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

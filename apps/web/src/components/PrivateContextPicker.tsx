import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { api, isAbort } from '@site/src/lib/api';
import type { Artifact, PrivateContextView, PrivateNote } from '@site/src/lib/api';
import { useWorkspaceSelection } from '@site/src/lib/workspace';

/**
 * Choosing private material for one question (v2 runbook P07).
 *
 * Nothing is selected by default, and nothing is selected because it exists.
 * Every box is ticked by the person, the character count of each is shown
 * before they ask, and the total is shown against its own budget — so the
 * decision to hand unpublished work to a model is made with the size of that
 * decision visible.
 */

export const MAX_SELECTIONS = 5;

export interface PrivateSelectionState {
  readonly projectId: string | undefined;
  readonly artifactIds: readonly string[];
  readonly noteIds: readonly string[];
}

export const NO_SELECTION: PrivateSelectionState = {
  projectId: undefined,
  artifactIds: [],
  noteIds: [],
};

export function PrivateContextPicker({
  value,
  onChange,
}: {
  readonly value: PrivateSelectionState;
  readonly onChange: (next: PrivateSelectionState) => void;
}): ReactNode {
  const workspace = useWorkspaceSelection();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const projectId = workspace.projectId;

  useEffect(() => {
    if (projectId === null) {
      setArtifacts([]);
      setNotes([]);
      onChange(NO_SELECTION);
      return;
    }
    const controller = new AbortController();
    Promise.all([
      api.listArtifacts(projectId, false, controller.signal),
      api.listNotes(projectId, {}, controller.signal),
    ])
      .then(([artifactPage, notePage]) => {
        setArtifacts(artifactPage.items);
        setNotes(notePage.items);
      })
      .catch((error: unknown) => {
        if (isAbort(error)) return;
        setArtifacts([]);
        setNotes([]);
      });
    return () => {
      controller.abort();
    };
    // Deliberately keyed on the project alone: `onChange` is the parent's state
    // setter and is stable, and re-running this on every selection change would
    // refetch the lists on every tick of a checkbox.
  }, [projectId]);

  const total = value.artifactIds.length + value.noteIds.length;
  const characters =
    artifacts
      .filter((artifact) => value.artifactIds.includes(artifact.id))
      .reduce((sum, artifact) => sum + artifact.characterCount, 0) +
    notes
      .filter((note) => value.noteIds.includes(note.id))
      .reduce((sum, note) => sum + note.body.length, 0);

  const toggle = (kind: 'artifact' | 'note', id: string): void => {
    const list = kind === 'artifact' ? value.artifactIds : value.noteIds;
    const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
    if (next.length > MAX_SELECTIONS) return;
    onChange({
      projectId: projectId ?? undefined,
      artifactIds: kind === 'artifact' ? next : value.artifactIds,
      noteIds: kind === 'note' ? next : value.noteIds,
    });
  };

  if (projectId === null || (artifacts.length === 0 && notes.length === 0)) {
    return (
      <details className="private-picker">
        <summary>Use your own material</summary>
        <p className="private-what">
          {projectId === null
            ? 'Choose or create a project in the workspace first.'
            : 'This project has no uploaded papers or notes yet.'}{' '}
          <Link to="/workspace">Open the workspace</Link>.
        </p>
      </details>
    );
  }

  return (
    <details className="private-picker">
      <summary>
        Use your own material
        {total > 0 && <span className="nav-badge nav-badge--neutral">{total} selected</span>}
      </summary>

      <p className="private-what">
        Nothing here is sent unless you tick it. Selected material goes to the local model for this
        one question, is never treated as canonical evidence, and can never be cited.
      </p>

      {artifacts.length > 0 && (
        <fieldset className="private-picker__group">
          <legend>Uploaded papers and files</legend>
          {artifacts.map((artifact) => (
            <label key={artifact.id} className="nav-check">
              <input
                type="checkbox"
                checked={value.artifactIds.includes(artifact.id)}
                onChange={() => {
                  toggle('artifact', artifact.id);
                }}
              />{' '}
              {artifact.label}
              <span className="private-meaning">
                {' '}
                {artifact.characterCount.toLocaleString()} characters
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {notes.length > 0 && (
        <fieldset className="private-picker__group">
          <legend>Your notes</legend>
          {notes.slice(0, 20).map((note) => (
            <label key={note.id} className="nav-check">
              <input
                type="checkbox"
                checked={value.noteIds.includes(note.id)}
                onChange={() => {
                  toggle('note', note.id);
                }}
              />{' '}
              {note.body.slice(0, 70)}
              {note.body.length > 70 && '…'}
              <span className="private-meaning">
                {' '}
                {note.body.length.toLocaleString()} characters
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <p className="private-meaning">
        {total} of {MAX_SELECTIONS} selections used · {characters.toLocaleString()} characters.
        {total >= MAX_SELECTIONS && ' That is the limit for one question.'}
      </p>
    </details>
  );
}

/** What was actually used, shown beside the answer and never merged into it. */
export function PrivateContextUsed({ context }: { context: PrivateContextView }): ReactNode {
  if (context.items.length === 0 && context.unresolved.length === 0) return null;
  return (
    <div className="private-used">
      <h3 className="private-heading">Private context used</h3>
      <p className="private-what">
        Your own material, sent to the local model for this question. It is{' '}
        <strong>not canonical evidence</strong> and is not cited above — the citations there come
        only from this knowledge base.
      </p>
      <ul className="private-used__list">
        {context.items.map((item) => (
          <li key={item.id}>
            <span className="nav-badge nav-badge--neutral">{item.kind}</span> {item.label}
            <span className="private-meaning">
              {' '}
              {item.characterCount.toLocaleString()} of {item.totalCharacters.toLocaleString()}{' '}
              characters
              {item.truncated && ' — shortened to fit'}
            </span>
          </li>
        ))}
      </ul>
      {context.unresolved.length > 0 && (
        <p className="private-meaning">
          {context.unresolved.length} selected item(s) could not be read and were not sent.
        </p>
      )}
      {context.truncated && (
        <p className="private-meaning">
          Some of your material was shortened or omitted to fit the{' '}
          {context.characterBudget.toLocaleString()}-character private budget.
        </p>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { Section, State } from '@site/src/components/Ui';
import { api, isAbort } from '@site/src/lib/api';
import type { FamiliarityLevel, FamiliarityRecord, PrivateNote } from '@site/src/lib/api';
import { shortDate, useWorkspaceSelection } from '@site/src/lib/workspace';

/**
 * Your own layer on top of a canonical concept (v2 runbook O03–O05).
 *
 * Three things live here and they are all yours: what you know about this
 * concept, what you noted about it, and whether you kept it. None of them
 * changes the page above — canonical content is read-only to this product, and
 * the corpus hash is unaffected by anything on this panel.
 *
 * Familiarity in particular is set only by you. Visiting this page does not set
 * it, asking about the concept does not set it, and no model can write it.
 */

const LEVELS: {
  readonly level: FamiliarityLevel;
  readonly label: string;
  readonly meaning: string;
}[] = [
  {
    level: 'unfamiliar',
    label: 'Unfamiliar',
    meaning: 'Do not assume this concept is known.',
  },
  {
    level: 'recognize',
    label: 'Recognise',
    meaning: 'The name is familiar, but prerequisites may still be needed.',
  },
  {
    level: 'working',
    label: 'Working',
    meaning: 'Explanations may skip basic orientation unless it is asked for.',
  },
  {
    level: 'strong',
    label: 'Strong',
    meaning: 'Path construction may treat this concept as already known.',
  },
];

export interface ConceptPrivateProps {
  readonly conceptId: string;
  readonly title: string;
  readonly slug: string;
  readonly reviewState: string;
  readonly summary: string;
}

export function ConceptPrivate(props: ConceptPrivateProps): ReactNode {
  const selection = useWorkspaceSelection();
  const projectId = selection.projectId;

  const [familiarity, setFamiliarity] = useState<FamiliarityRecord | null>(null);
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [body, setBody] = useState('');
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  /* Familiarity is per concept, not per project. */
  useEffect(() => {
    const controller = new AbortController();
    api
      .getFamiliarity(props.conceptId, controller.signal)
      .then((result) => {
        setFamiliarity(result.familiarity);
      })
      .catch((error: unknown) => {
        if (!isAbort(error)) setFamiliarity(null);
      });
    return () => {
      controller.abort();
    };
  }, [props.conceptId]);

  const loadNotes = useCallback(() => {
    if (projectId === null) {
      setNotes([]);
      return;
    }
    api
      .listNotes(projectId, { conceptId: props.conceptId })
      .then((page) => {
        setNotes(page.items);
      })
      .catch(() => {
        setNotes([]);
      });
  }, [projectId, props.conceptId]);

  useEffect(loadNotes, [loadNotes]);

  /* Is this concept already saved in the current project? */
  useEffect(() => {
    if (projectId === null) {
      setSaved(false);
      return;
    }
    api
      .listSaved(projectId, { itemType: 'concept' })
      .then((page) => {
        setSaved(page.items.some((item) => item.itemKey === props.conceptId));
      })
      .catch(() => {
        setSaved(false);
      });
  }, [projectId, props.conceptId]);

  const setLevel = (level: FamiliarityLevel | null): void => {
    setFailure(undefined);
    const request =
      level === null
        ? api.clearFamiliarity(props.conceptId).then(() => null)
        : api.setFamiliarity(props.conceptId, { level });
    request
      .then((record) => {
        setFamiliarity(record);
        setMessage(level === null ? 'Familiarity cleared.' : 'Familiarity saved.');
      })
      .catch((error: unknown) => {
        setFailure(error instanceof Error ? error.message : String(error));
      });
  };

  const addNote = (event: FormEvent): void => {
    event.preventDefault();
    if (projectId === null || body.trim() === '') return;
    api
      .createNote(projectId, { body, conceptId: props.conceptId })
      .then(() => {
        setBody('');
        setMessage('Note saved to this project.');
        loadNotes();
      })
      .catch((error: unknown) => {
        setFailure(error instanceof Error ? error.message : String(error));
      });
  };

  const saveConcept = (): void => {
    if (projectId === null) return;
    api
      .save(projectId, {
        itemType: 'concept',
        label: props.title,
        payload: {
          conceptId: props.conceptId,
          title: props.title,
          slug: props.slug,
          reviewState: props.reviewState,
          summary: props.summary,
        },
      })
      .then((result) => {
        setSaved(true);
        setMessage(
          result.deduplicated ? 'Already saved to this project.' : 'Saved to this project.',
        );
      })
      .catch((error: unknown) => {
        setFailure(error instanceof Error ? error.message : String(error));
      });
  };

  return (
    <Section heading="Your work on this concept">
      <p className="answer__empty">
        Private to this machine. Nothing here changes the page above or the canonical corpus.
      </p>

      {/* Familiarity does not need a project: it is about you, not a piece of work. */}
      <div className="private-block">
        <h3 className="private-heading" id="familiarity">
          What you know
        </h3>
        <div className="private-levels" role="group" aria-label="Set your familiarity">
          <button
            type="button"
            className="nav-choice"
            aria-pressed={familiarity === null}
            onClick={() => {
              setLevel(null);
            }}
          >
            Not set
          </button>
          {LEVELS.map((entry) => (
            <button
              key={entry.level}
              type="button"
              className="nav-choice"
              aria-pressed={familiarity?.level === entry.level}
              title={entry.meaning}
              onClick={() => {
                setLevel(entry.level);
              }}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <p className="private-meaning">
          {familiarity === null
            ? 'No level recorded. Nothing infers this: only you set it.'
            : (LEVELS.find((entry) => entry.level === familiarity.level)?.meaning ?? '')}
        </p>
      </div>

      {selection.ready && projectId === null ? (
        <State tone="empty" title="No project selected">
          Notes and saved evidence belong to a project. Create one in the{' '}
          <Link to="/workspace">workspace</Link> to start keeping work.
        </State>
      ) : (
        projectId !== null && (
          <>
            <div className="private-block">
              <h3 className="private-heading">Keep it</h3>
              <p className="private-what">
                Saves the title, address and review state of this concept to{' '}
                <strong>{selection.project?.title ?? 'the current project'}</strong>. Nothing is
                saved by opening the page.
              </p>
              <button type="button" className="nav-button" onClick={saveConcept} disabled={saved}>
                {saved ? 'Saved to project' : 'Save to project'}
              </button>
            </div>

            <div className="private-block">
              <h3 className="private-heading">Your notes</h3>
              <form className="workspace-inline-form" onSubmit={addNote}>
                <label className="nav-field">
                  <span className="nav-field__label">Add a private note</span>
                  <textarea
                    className="nav-input nav-textarea"
                    value={body}
                    maxLength={65_536}
                    onChange={(event) => {
                      setBody(event.currentTarget.value);
                    }}
                    placeholder="What this means for the work in hand."
                  />
                </label>
                <button className="nav-button" type="submit">
                  Add note
                </button>
              </form>
              {notes.length === 0 ? (
                <p className="workspace-item__meta">No notes on this concept yet.</p>
              ) : (
                <ul className="workspace-list">
                  {notes.map((note) => (
                    <li key={note.id} className="workspace-item">
                      <p className="workspace-item__body workspace-note">{note.body}</p>
                      <p className="workspace-item__meta">{shortDate(note.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )
      )}

      {message !== undefined && (
        <p className="private-message" role="status">
          {message}
        </p>
      )}
      {failure !== undefined && (
        <State tone="problem" title="That did not work">
          {failure}
        </State>
      )}
    </Section>
  );
}

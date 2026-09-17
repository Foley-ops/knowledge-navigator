import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { Artifacts } from '@site/src/components/Artifacts';
import { Identifier, Page, Section, State } from '@site/src/components/Ui';
import { api, isAbort } from '@site/src/lib/api';
import type {
  PersonalStatus,
  PrivateNote,
  Project,
  ProjectContents,
  ResearchSession,
  SavedItem,
} from '@site/src/lib/api';
import { nodesById } from '@site/src/lib/graph-data';
import { shortDate, useWorkspaceSelection } from '@site/src/lib/workspace';

/**
 * The private research workspace.
 *
 * Everything on this page is the researcher's own: it lives in a separate
 * database on this machine, in a volume only the API mounts, and it is never
 * part of canonical knowledge. The page says so plainly, because a product that
 * stores private work owes the person a clear statement of where it went.
 *
 * One route, with headings rather than a router inside it. A project is chosen
 * with `?project=<id>`, which makes every view here linkable and the browser's
 * back button work the way it should.
 */

type SectionName = 'overview' | 'sessions' | 'notes' | 'saved' | 'artifacts' | 'export';

const SECTIONS: { readonly name: SectionName; readonly label: string }[] = [
  { name: 'overview', label: 'Overview' },
  { name: 'sessions', label: 'Sessions' },
  { name: 'notes', label: 'Notes' },
  { name: 'saved', label: 'Saved' },
  { name: 'artifacts', label: 'Artifacts' },
  { name: 'export', label: 'Export' },
];

/* -------------------------------------------------------------------------- */
/* Creating and choosing a project                                             */
/* -------------------------------------------------------------------------- */

function CreateProject({ onCreated }: { onCreated: (project: Project) => void }): ReactNode {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | undefined>(undefined);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (title.trim() === '') {
      setFailure('Give the project a name before creating it.');
      return;
    }
    setBusy(true);
    setFailure(undefined);
    api
      .createProject({ title: title.trim(), description: description.trim() })
      .then((project) => {
        setTitle('');
        setDescription('');
        onCreated(project);
      })
      .catch((error: unknown) => {
        setFailure(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <form className="workspace-form" onSubmit={submit}>
      <label className="nav-field">
        <span className="nav-field__label">Project name</span>
        <input
          className="nav-input"
          value={title}
          maxLength={200}
          onChange={(event) => {
            setTitle(event.currentTarget.value);
          }}
          placeholder="Small detector recall"
        />
      </label>
      <label className="nav-field">
        <span className="nav-field__label">What it is about (optional)</span>
        <textarea
          className="nav-input nav-textarea"
          value={description}
          maxLength={8_000}
          onChange={(event) => {
            setDescription(event.currentTarget.value);
          }}
          placeholder="Losing small objects after repeated downsampling on 512px crops."
        />
      </label>
      {failure !== undefined && (
        <p className="nav-state nav-state--problem" role="alert">
          {failure}
        </p>
      )}
      <button className="nav-button" type="submit" disabled={busy}>
        {busy ? 'Creating…' : 'Create project'}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Sections                                                                    */
/* -------------------------------------------------------------------------- */

function Empty({ what, children }: { what: string; children: ReactNode }): ReactNode {
  return (
    <State tone="empty" title={what}>
      {children}
    </State>
  );
}

function Sessions({ projectId }: { projectId: string }): ReactNode {
  const [items, setItems] = useState<ResearchSession[] | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [failure, setFailure] = useState<string | undefined>(undefined);

  const load = useCallback(() => {
    api
      .listSessions(projectId)
      .then((page) => {
        setItems(page.items);
      })
      .catch((error: unknown) => {
        if (!isAbort(error)) setFailure(error instanceof Error ? error.message : String(error));
      });
  }, [projectId]);

  useEffect(load, [load]);

  const create = (event: FormEvent): void => {
    event.preventDefault();
    if (title.trim() === '') return;
    api
      .createSession(projectId, { title: title.trim() })
      .then(() => {
        setTitle('');
        load();
      })
      .catch((error: unknown) => {
        setFailure(error instanceof Error ? error.message : String(error));
      });
  };

  return (
    <>
      <p className="workspace-explainer">
        A session is a research journey you decided to keep. Asking a question never creates one —
        nothing here is a history of what you typed.
      </p>
      <form className="workspace-inline-form" onSubmit={create}>
        <label className="nav-field">
          <span className="nav-field__label">New session</span>
          <input
            className="nav-input"
            value={title}
            maxLength={200}
            onChange={(event) => {
              setTitle(event.currentTarget.value);
            }}
            placeholder="Why recall drops after downsampling"
          />
        </label>
        <button className="nav-button" type="submit">
          Create session
        </button>
      </form>
      {failure !== undefined && (
        <State tone="problem" title="That did not work">
          {failure}
        </State>
      )}
      {items !== undefined && items.length === 0 && (
        <Empty what="No sessions yet">
          Create one when a line of enquiry is worth returning to.
        </Empty>
      )}
      {items !== undefined && items.length > 0 && (
        <ul className="workspace-list">
          {items.map((session) => (
            <li key={session.id} className="workspace-item">
              <p className="workspace-item__title">{session.title}</p>
              {session.startingQuestion !== null && (
                <p className="workspace-item__body">{session.startingQuestion}</p>
              )}
              <p className="workspace-item__meta">
                started {shortDate(session.createdAt)}
                <button
                  type="button"
                  className="workspace-action"
                  onClick={() => {
                    void api.archiveSession(projectId, session.id).then(load);
                  }}
                >
                  Archive
                </button>
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Notes({ projectId }: { projectId: string }): ReactNode {
  const [items, setItems] = useState<PrivateNote[] | undefined>(undefined);
  const [body, setBody] = useState('');
  const [failure, setFailure] = useState<string | undefined>(undefined);

  const load = useCallback(() => {
    api
      .listNotes(projectId)
      .then((page) => {
        setItems(page.items);
      })
      .catch((error: unknown) => {
        if (!isAbort(error)) setFailure(error instanceof Error ? error.message : String(error));
      });
  }, [projectId]);

  useEffect(load, [load]);

  const create = (event: FormEvent): void => {
    event.preventDefault();
    if (body.trim() === '') return;
    api
      .createNote(projectId, { body })
      .then(() => {
        setBody('');
        load();
      })
      .catch((error: unknown) => {
        setFailure(error instanceof Error ? error.message : String(error));
      });
  };

  return (
    <>
      <p className="workspace-explainer">
        Notes are yours. They are stored as Markdown source exactly as you type them, shown as text,
        and never become part of canonical knowledge.
      </p>
      <form className="workspace-inline-form" onSubmit={create}>
        <label className="nav-field">
          <span className="nav-field__label">New note</span>
          <textarea
            className="nav-input nav-textarea"
            value={body}
            maxLength={65_536}
            onChange={(event) => {
              setBody(event.currentTarget.value);
            }}
            placeholder="Pooling looks like the culprit — check the effective receptive field first."
          />
        </label>
        <button className="nav-button" type="submit">
          Add note
        </button>
      </form>
      {failure !== undefined && (
        <State tone="problem" title="That did not work">
          {failure}
        </State>
      )}
      {items !== undefined && items.length === 0 && (
        <Empty what="No notes yet">
          Add one here, or from any concept page with <em>Add a private note</em>.
        </Empty>
      )}
      {items !== undefined && items.length > 0 && (
        <ul className="workspace-list">
          {items.map((note) => {
            const concept = note.conceptId === null ? undefined : nodesById.get(note.conceptId);
            return (
              <li key={note.id} className="workspace-item">
                {concept !== undefined && (
                  <p className="workspace-item__where">
                    on <Link to={concept.slug}>{concept.title}</Link>
                  </p>
                )}
                {/* Rendered as text, never as HTML: what you wrote is what it says. */}
                <p className="workspace-item__body workspace-note">{note.body}</p>
                <p className="workspace-item__meta">
                  {shortDate(note.createdAt)}
                  <button
                    type="button"
                    className="workspace-action"
                    onClick={() => {
                      void api.archiveNote(projectId, note.id).then(load);
                    }}
                  >
                    Archive
                  </button>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Saved({ projectId }: { projectId: string }): ReactNode {
  const [items, setItems] = useState<SavedItem[] | undefined>(undefined);

  const load = useCallback(() => {
    api
      .listSaved(projectId)
      .then((page) => {
        setItems(page.items);
      })
      .catch(() => {
        setItems([]);
      });
  }, [projectId]);

  useEffect(load, [load]);

  return (
    <>
      <p className="workspace-explainer">
        Only what you asked to keep. Opening a concept or reading an answer saves nothing.
      </p>
      {items !== undefined && items.length === 0 && (
        <Empty what="Nothing saved yet">
          Use <em>Save to project</em> on a concept, a source or an answer.
        </Empty>
      )}
      {items !== undefined && items.length > 0 && (
        <ul className="workspace-list">
          {items.map((item) => {
            const payload = item.payload;
            const conceptId = payload['conceptId'];
            const concept = typeof conceptId === 'string' ? nodesById.get(conceptId) : undefined;
            const url = payload['url'];
            return (
              <li key={item.id} className="workspace-item">
                <p className="workspace-item__title">
                  <span className="nav-badge nav-badge--neutral">{item.itemType}</span>{' '}
                  {concept !== undefined ? (
                    <Link to={concept.slug}>{item.label}</Link>
                  ) : typeof url === 'string' ? (
                    <a href={url} rel="noreferrer noopener external" target="_blank">
                      {item.label}
                    </a>
                  ) : (
                    item.label
                  )}
                </p>
                {typeof payload['statement'] === 'string' && (
                  <p className="workspace-item__body">{payload['statement']}</p>
                )}
                {typeof payload['question'] === 'string' && (
                  <p className="workspace-item__body">{payload['question']}</p>
                )}
                <p className="workspace-item__meta">
                  saved {shortDate(item.createdAt)}
                  <button
                    type="button"
                    className="workspace-action"
                    onClick={() => {
                      void api.archiveSaved(projectId, item.id).then(load);
                    }}
                  >
                    Archive
                  </button>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */

export default function WorkspacePage(): ReactNode {
  const selection = useWorkspaceSelection();
  const [status, setStatus] = useState<PersonalStatus | undefined>(undefined);
  const [detail, setDetail] = useState<{ project: Project; contents: ProjectContents } | undefined>(
    undefined,
  );
  const [section, setSection] = useState<SectionName>('overview');
  const [renaming, setRenaming] = useState('');
  // Bumped whenever a project is archived or restored, so the archived list is
  // never stale: archiving something and not seeing it move is disconcerting.
  const [refresh, setRefresh] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    const controller = new AbortController();
    api
      .personalStatus(controller.signal)
      .then(setStatus)
      .catch((error: unknown) => {
        if (!isAbort(error)) setStatus({ available: false, message: String(error) });
      });
    return () => {
      controller.abort();
    };
  }, []);

  // `?project=` is the address of a project view, so a link to one works.
  useEffect(() => {
    if (typeof window === 'undefined' || !first.current) return;
    first.current = false;
    const requested = new URLSearchParams(window.location.search).get('project');
    if (requested !== null) selection.select(requested);
  }, [selection]);

  const projectId = selection.projectId;

  const loadDetail = useCallback(() => {
    if (projectId === null) {
      setDetail(undefined);
      return;
    }
    api
      .getProject(projectId)
      .then((next) => {
        setDetail(next);
        setRenaming(next.project.title);
      })
      .catch(() => {
        setDetail(undefined);
      });
  }, [projectId]);

  useEffect(loadDetail, [loadDetail]);

  useEffect(() => {
    if (typeof window === 'undefined' || projectId === null) return;
    const url = new URL(window.location.href);
    url.searchParams.set('project', projectId);
    window.history.replaceState(null, '', url.toString());
  }, [projectId]);

  return (
    <Layout
      title="Workspace"
      description="Your private research projects, notes and saved evidence."
    >
      <Page
        width="tool"
        title="Workspace"
        lede="Your own work: projects, sessions, notes, saved evidence and uploaded context. It lives in a private database on this machine, separate from canonical knowledge, and nothing here is ever published."
      >
        <Section heading="Where this lives">
          <p>
            Workspace data is stored locally, in its own database that only this service opens. It
            is <strong>not</strong> in Git, not in an image, and not recoverable from anywhere else
            — the canonical Markdown can always be rebuilt, and your notes cannot. Back them up with
            the export below.
          </p>
          {status !== undefined && !status.available && (
            <State tone="problem" title="The private store is unavailable">
              {status.message ?? 'It could not be opened.'} Browsing, search and the concept graph
              are unaffected.
            </State>
          )}
        </Section>

        {selection.unavailable !== undefined && (
          <State tone="problem" title="Projects could not be loaded">
            {selection.unavailable}
          </State>
        )}

        {selection.ready && selection.projects.length === 0 && (
          <Section heading="Start a project">
            <State tone="empty" title="No projects yet">
              A project groups a piece of research: its sessions, its notes, the evidence you kept
              and the local papers you uploaded. Nothing is saved anywhere until you make one.
            </State>
            <CreateProject
              onCreated={(project) => {
                selection.reload();
                selection.select(project.id);
              }}
            />
          </Section>
        )}

        {selection.projects.length > 0 && (
          <Section heading="Projects">
            <div className="workspace-projects" role="group" aria-label="Choose a project">
              {selection.projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className="nav-choice"
                  aria-pressed={project.id === projectId}
                  onClick={() => {
                    selection.select(project.id);
                    setSection('overview');
                  }}
                >
                  {project.title}
                </button>
              ))}
            </div>
            <details className="workspace-new">
              <summary>New project</summary>
              <CreateProject
                onCreated={(project) => {
                  selection.reload();
                  selection.select(project.id);
                }}
              />
            </details>
          </Section>
        )}

        {detail !== undefined && projectId !== null && (
          <>
            <Section heading={detail.project.title}>
              <div className="workspace-tabs" role="group" aria-label="Project sections">
                {SECTIONS.map((entry) => (
                  <button
                    key={entry.name}
                    type="button"
                    className="nav-choice"
                    aria-pressed={section === entry.name}
                    onClick={() => {
                      setSection(entry.name);
                    }}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </Section>

            {section === 'overview' && (
              <Section heading="Overview">
                {detail.project.description !== '' && (
                  <p className="workspace-description">{detail.project.description}</p>
                )}
                <ul className="workspace-counts">
                  <li>{detail.contents.sessions} sessions</li>
                  <li>{detail.contents.notes} notes</li>
                  <li>{detail.contents.savedItems} saved items</li>
                  <li>{detail.contents.artifacts} artifacts</li>
                </ul>
                <p className="workspace-item__meta">
                  created {shortDate(detail.project.createdAt)} ·{' '}
                  <Identifier>{projectId}</Identifier>
                </p>

                <form
                  className="workspace-inline-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void api.updateProject(projectId, { title: renaming }).then(() => {
                      selection.reload();
                      loadDetail();
                    });
                  }}
                >
                  <label className="nav-field">
                    <span className="nav-field__label">Rename</span>
                    <input
                      className="nav-input"
                      value={renaming}
                      maxLength={200}
                      onChange={(event) => {
                        setRenaming(event.currentTarget.value);
                      }}
                    />
                  </label>
                  <button className="nav-button" type="submit">
                    Save name
                  </button>
                </form>

                <p className="workspace-item__meta">
                  <button
                    type="button"
                    className="workspace-action"
                    onClick={() => {
                      if (
                        typeof window !== 'undefined' &&
                        !window.confirm(
                          'Archive this project? It disappears from the list and can be restored at any time. Nothing is deleted.',
                        )
                      ) {
                        return;
                      }
                      void api.archiveProject(projectId).then(() => {
                        selection.select(null);
                        selection.reload();
                        setRefresh((value) => value + 1);
                      });
                    }}
                  >
                    Archive this project
                  </button>
                </p>
              </Section>
            )}

            {section === 'sessions' && (
              <Section heading="Sessions">
                <Sessions projectId={projectId} />
              </Section>
            )}
            {section === 'notes' && (
              <Section heading="Notes">
                <Notes projectId={projectId} />
              </Section>
            )}
            {section === 'saved' && (
              <Section heading="Saved">
                <Saved projectId={projectId} />
              </Section>
            )}
            {section === 'artifacts' && (
              <Section heading="Artifacts">
                <Artifacts projectId={projectId} />
              </Section>
            )}
            {section === 'export' && (
              <Section heading="Export">
                <p>
                  Your workspace is the only data here that cannot be rebuilt. Export it with the
                  command line:
                </p>
                <pre className="workspace-code">
                  <code>npm run personal:export</code>
                </pre>
                <p className="workspace-item__meta">
                  The archive is written under <code>.navigator/exports/</code>, which Git ignores.
                </p>
              </Section>
            )}
          </>
        )}

        <Section heading="Archived projects">
          <ArchivedProjects
            refresh={refresh}
            onChanged={() => {
              selection.reload();
              setRefresh((value) => value + 1);
            }}
          />
        </Section>
      </Page>
    </Layout>
  );
}

function ArchivedProjects({
  refresh,
  onChanged,
}: {
  refresh: number;
  onChanged: () => void;
}): ReactNode {
  const [items, setItems] = useState<Project[] | undefined>(undefined);

  const load = useCallback(() => {
    api
      .listProjects(true)
      .then((page) => {
        setItems(page.items.filter((project) => project.archivedAt !== null));
      })
      .catch(() => {
        setItems([]);
      });
    // `refresh` is the dependency: the caller bumps it after an archive or a
    // restore so this list reloads rather than showing what it saw on mount.
  }, [refresh]);

  useEffect(load, [load]);

  if (items === undefined || items.length === 0) {
    return <p className="workspace-item__meta">Nothing archived.</p>;
  }

  return (
    <ul className="workspace-list">
      {items.map((project) => (
        <li key={project.id} className="workspace-item">
          <p className="workspace-item__title">{project.title}</p>
          <p className="workspace-item__meta">
            archived {shortDate(project.archivedAt ?? '')}
            <button
              type="button"
              className="workspace-action"
              onClick={() => {
                void api.restoreProject(project.id).then(() => {
                  load();
                  onChanged();
                });
              }}
            >
              Restore
            </button>
          </p>
        </li>
      ))}
    </ul>
  );
}

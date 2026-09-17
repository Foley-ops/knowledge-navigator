import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { State } from '@site/src/components/Ui';
import { api } from '@site/src/lib/api';
import type { AssistantResponse, ResearchSession } from '@site/src/lib/api';
import { useWorkspaceSelection } from '@site/src/lib/workspace';

/**
 * Keep an answer (v2 runbook O06).
 *
 * An answer is not saved by being read. This is the only way one enters the
 * private store, and it says exactly what it will keep before it keeps it.
 *
 * The research context is a separate, second choice. Context is the most
 * sensitive thing a researcher types here — it is about their unpublished work
 * — so keeping it is opt-in even once they have decided to keep the answer.
 */
export function SaveAnswer({
  response,
  question,
  context,
  sessions,
}: {
  readonly response: AssistantResponse;
  readonly question: string;
  readonly context: string;
  readonly sessions: readonly ResearchSession[];
}): ReactNode {
  const selection = useWorkspaceSelection();
  const [keepContext, setKeepContext] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [failure, setFailure] = useState<string | undefined>(undefined);

  const projectId = selection.projectId;
  if (response.result === null) return null;

  if (selection.ready && projectId === null) {
    return (
      <State tone="empty" title="Nowhere to save this yet">
        Answers are kept in a project. Create one in the <Link to="/workspace">workspace</Link>,
        then ask again — or copy what you need now, because an unsaved answer is gone on reload.
      </State>
    );
  }
  if (projectId === null) return null;

  const save = (): void => {
    setState('saving');
    setFailure(undefined);
    api
      .save(projectId, {
        itemType: 'assistant-answer',
        label: question.slice(0, 200),
        ...(sessionId === '' ? {} : { sessionId }),
        payload: {
          question,
          ...(keepContext && context !== '' ? { contextSummary: context } : {}),
          mode: response.mode,
          depth: response.depth,
          provider: response.provider,
          model: response.model,
          answeredAt: new Date().toISOString(),
          citations: response.result?.citations ?? [],
          result: response.result as unknown as Record<string, unknown>,
        },
      })
      .then(() => {
        setState('saved');
      })
      .catch((error: unknown) => {
        setState('idle');
        setFailure(error instanceof Error ? error.message : String(error));
      });
  };

  return (
    <div className="save-answer">
      <h3 className="private-heading">Keep this answer</h3>
      <p className="private-what">
        Saves the structured answer, its citations, the mode, the depth, the model and the time, to{' '}
        <strong>{selection.project?.title ?? 'the current project'}</strong>. Your question is kept
        with it. Your research context is not, unless you tick the box.
      </p>

      <label className="nav-check">
        <input
          type="checkbox"
          checked={keepContext}
          disabled={context === '' || state === 'saved'}
          onChange={(event) => {
            setKeepContext(event.currentTarget.checked);
          }}
        />{' '}
        Save the research context too
        {context === '' && <span className="private-meaning"> (you gave none)</span>}
      </label>

      {sessions.length > 0 && (
        <label className="nav-field">
          <span className="nav-field__label">Attach to a session (optional)</span>
          <select
            className="nav-input"
            value={sessionId}
            onChange={(event) => {
              setSessionId(event.currentTarget.value);
            }}
          >
            <option value="">No session</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title}
              </option>
            ))}
          </select>
        </label>
      )}

      <button type="button" className="nav-button" onClick={save} disabled={state !== 'idle'}>
        {state === 'saved'
          ? 'Saved to project'
          : state === 'saving'
            ? 'Saving…'
            : 'Save result to project'}
      </button>

      {state === 'saved' && (
        <p className="private-message" role="status">
          Kept. It is in <Link to={`/workspace?project=${projectId}`}>your workspace</Link>.
        </p>
      )}
      {failure !== undefined && (
        <State tone="problem" title="That did not work">
          {failure}
        </State>
      )}
    </div>
  );
}

/**
 * Which project the researcher is working in.
 *
 * One choice, remembered in `localStorage`, shared by every surface that can
 * save something: the concept page, Ask, Compare and Path all need to know
 * where a save would go, and asking again on each page would be tedious enough
 * that people would stop saving.
 *
 * The selection is a *pointer*, not data: it holds an id, never a title, a note
 * or anything else a person wrote. Losing it costs nothing.
 */
import { useCallback, useEffect, useState } from 'react';
import { api, isAbort } from './api';
import type { Project } from './api';

const KEY = 'navigator.workspace.project';

function read(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    // Private windows and blocked site data both throw here. Working without a
    // remembered project is a small inconvenience, not a failure.
    return null;
  }
}

function write(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, id);
  } catch {
    /* see read() */
  }
}

/** Broadcast so two panels on one page agree about the current project. */
const CHANGED = 'navigator:workspace-project-changed';

export interface WorkspaceSelection {
  /** Projects that are not archived, most recently touched first. */
  readonly projects: readonly Project[];
  readonly projectId: string | null;
  readonly project: Project | undefined;
  /** False until the first load finishes, so nothing flashes an empty state. */
  readonly ready: boolean;
  /** Set when the private store itself could not be reached. */
  readonly unavailable: string | undefined;
  select(id: string | null): void;
  reload(): void;
}

export function useWorkspaceSelection(): WorkspaceSelection {
  const [projects, setProjects] = useState<readonly Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState<string | undefined>(undefined);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    api
      .listProjects(false, controller.signal)
      .then((page) => {
        if (cancelled) return;
        setProjects(page.items);
        setUnavailable(undefined);
        const remembered = read();
        // A remembered project that has since been archived or removed is
        // dropped rather than silently pointing at nothing.
        const valid =
          remembered !== null && page.items.some((project) => project.id === remembered)
            ? remembered
            : (page.items[0]?.id ?? null);
        setProjectId(valid);
        if (valid !== remembered) write(valid);
      })
      .catch((error: unknown) => {
        if (cancelled || isAbort(error)) return;
        setUnavailable(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [nonce]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onChanged = (): void => {
      setProjectId(read());
    };
    window.addEventListener(CHANGED, onChanged);
    return () => {
      window.removeEventListener(CHANGED, onChanged);
    };
  }, []);

  const select = useCallback((id: string | null) => {
    write(id);
    setProjectId(id);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGED));
  }, []);

  return {
    projects,
    projectId,
    project: projects.find((project) => project.id === projectId),
    ready,
    unavailable,
    select,
    reload,
  };
}

/** A short, human date for a personal record. */
export function shortDate(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Private research context, selected deliberately (v2 runbook P07–P08).
 *
 * The rule this module exists to hold: **the model sees only what the
 * researcher selected for this one request.** There is no code path that
 * gathers "everything in the project" or "everything recently uploaded". The
 * request names ids; those ids are resolved inside that project; anything else
 * is simply absent.
 *
 * Private material has its own budget, separate from the canonical one, so a
 * long paper cannot crowd out the corpus the answer is supposed to be grounded
 * in — and truncation is reported rather than silent.
 *
 * Private material is also never citable. The canonical citable-id list is
 * built from retrieval alone, so a model that tries to cite an artifact as
 * though it were a source produces a fabricated citation and the whole
 * generation is discarded.
 */
import type { Database as DatabaseType } from 'better-sqlite3';
import { getNoteInProject, selectArtifactsForContext } from '../personal/index.js';

/** Characters of private material allowed into one prompt. */
export const PRIVATE_CONTEXT_BUDGET = 12_000;

/** The most pieces of private material one request may select. */
export const MAX_PRIVATE_SELECTIONS = 5;

export interface PrivateContextItem {
  readonly kind: 'artifact' | 'note';
  readonly id: string;
  readonly label: string;
  /** Characters this item contributed to the prompt, after truncation. */
  readonly characterCount: number;
  /** Characters the item holds in total. */
  readonly totalCharacters: number;
  readonly truncated: boolean;
}

export interface PrivateContext {
  readonly projectId: string | null;
  readonly items: readonly PrivateContextItem[];
  /** Ids the request named that could not be resolved in this project. */
  readonly unresolved: readonly string[];
  readonly characterCount: number;
  readonly characterBudget: number;
  /** True when any item was shortened, or any was dropped entirely. */
  readonly truncated: boolean;
  /** The text handed to the provider. Never returned to the browser. */
  readonly prompt: string;
}

export const EMPTY_PRIVATE_CONTEXT: PrivateContext = {
  projectId: null,
  items: [],
  unresolved: [],
  characterCount: 0,
  characterBudget: PRIVATE_CONTEXT_BUDGET,
  truncated: false,
  prompt: '',
};

export interface PrivateSelection {
  readonly projectId: string;
  readonly artifactIds: readonly string[];
  readonly noteIds: readonly string[];
}

/**
 * Resolve a selection into the text that will go in the prompt.
 *
 * Items are taken in the order the researcher listed them, so what they put
 * first is what survives a tight budget. An item that does not fit whole is
 * truncated and marked; an item with no room left is dropped and the context is
 * marked truncated, because a silently missing paper is worse than a short one.
 */
export function buildPrivateContext(
  db: DatabaseType,
  selection: PrivateSelection,
  budget = PRIVATE_CONTEXT_BUDGET,
): PrivateContext {
  const items: PrivateContextItem[] = [];
  const unresolved: string[] = [];
  const pieces: string[] = [];
  let used = 0;
  let truncated = false;

  const artifacts = selectArtifactsForContext(db, selection.projectId, selection.artifactIds);
  const byId = new Map(artifacts.map((artifact) => [artifact.id, artifact]));

  const candidates: { kind: 'artifact' | 'note'; id: string; label: string; text: string }[] = [];

  for (const id of selection.artifactIds) {
    const artifact = byId.get(id);
    if (artifact === undefined) {
      unresolved.push(id);
      continue;
    }
    candidates.push({
      kind: 'artifact',
      id: artifact.id,
      label: artifact.label,
      text: artifact.extractedText,
    });
  }

  for (const id of selection.noteIds) {
    try {
      const note = getNoteInProject(db, selection.projectId, id);
      if (note.archivedAt !== null) {
        unresolved.push(id);
        continue;
      }
      candidates.push({
        kind: 'note',
        id: note.id,
        label: `Note of ${note.createdAt.slice(0, 10)}`,
        text: note.body,
      });
    } catch {
      unresolved.push(id);
    }
  }

  for (const candidate of candidates) {
    const remaining = budget - used;
    if (remaining <= 200) {
      // Not enough room for anything useful. Record it as present-but-omitted
      // rather than pretending the selection was smaller than it was.
      items.push({
        kind: candidate.kind,
        id: candidate.id,
        label: candidate.label,
        characterCount: 0,
        totalCharacters: candidate.text.length,
        truncated: true,
      });
      truncated = true;
      continue;
    }

    const fits = candidate.text.length <= remaining;
    const text = fits ? candidate.text : candidate.text.slice(0, remaining);
    used += text.length;
    if (!fits) truncated = true;

    items.push({
      kind: candidate.kind,
      id: candidate.id,
      label: candidate.label,
      characterCount: text.length,
      totalCharacters: candidate.text.length,
      truncated: !fits,
    });

    pieces.push(
      [
        `--- ${candidate.kind.toUpperCase()}: ${candidate.label} ---`,
        text,
        fits ? '' : '[…this material was shortened to fit a size limit…]',
      ]
        .filter((line) => line !== '')
        .join('\n'),
    );
  }

  return {
    projectId: selection.projectId,
    items,
    unresolved,
    characterCount: used,
    characterBudget: budget,
    truncated,
    prompt: pieces.join('\n\n'),
  };
}

/**
 * What the browser is told about the private context.
 *
 * Ids, labels and counts — never the text. The browser already has the text if
 * it wants it; echoing it back through an answer response would put private
 * material in a place it does not need to be.
 */
export function describePrivateContext(context: PrivateContext): Record<string, unknown> {
  return {
    projectId: context.projectId,
    characterCount: context.characterCount,
    characterBudget: context.characterBudget,
    truncated: context.truncated,
    unresolved: context.unresolved,
    items: context.items.map((item) => ({
      kind: item.kind,
      id: item.id,
      label: item.label,
      characterCount: item.characterCount,
      totalCharacters: item.totalCharacters,
      truncated: item.truncated,
    })),
  };
}

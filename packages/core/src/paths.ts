/**
 * Project path resolution.
 *
 * The project root is found by walking up from this module until a directory
 * containing both `content/concepts` and `package.json` is found, so the CLI
 * behaves the same whether it is run from the repository root, from a
 * workspace directory, or from inside a container image. Nothing above the
 * project root is ever read.
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ProjectPaths {
  readonly root: string;
  readonly contentDir: string;
  /** Tier 3 graph-only YAML identities (v2 runbook §4.2). */
  readonly graphOnlyDir: string;
  /** The curated broad atlas (v2 runbook §4.1). */
  readonly atlasFile: string;
  readonly generatedDir: string;
  readonly dataDir: string;
  /** Local work area: proposals and exports. Never tracked (v2 runbook §5). */
  readonly navigatorDir: string;
  readonly exportsDir: string;
  readonly schemasDir: string;
  readonly conceptJsonSchema: string;
  readonly graphJson: string;
  readonly generatedSidebars: string;
  readonly defaultDatabase: string;
}

function findRoot(start: string): string {
  let current = start;
  for (;;) {
    if (
      existsSync(resolve(current, 'package.json')) &&
      existsSync(resolve(current, 'content', 'concepts'))
    ) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(
        'Could not locate the project root: no ancestor directory contains both package.json and content/concepts.',
      );
    }
    current = parent;
  }
}

/** Resolve every project path, optionally from an explicit root. */
export function projectPaths(explicitRoot?: string): ProjectPaths {
  const root = explicitRoot
    ? resolve(explicitRoot)
    : findRoot(dirname(fileURLToPath(import.meta.url)));
  return {
    root,
    contentDir: resolve(root, 'content', 'concepts'),
    graphOnlyDir: resolve(root, 'content', 'graph-only'),
    atlasFile: resolve(root, 'content', 'atlas.yaml'),
    generatedDir: resolve(root, 'generated'),
    dataDir: resolve(root, 'data'),
    navigatorDir: resolve(root, '.navigator'),
    exportsDir: resolve(root, '.navigator', 'exports'),
    schemasDir: resolve(root, 'schemas'),
    conceptJsonSchema: resolve(root, 'schemas', 'concept.schema.json'),
    graphJson: resolve(root, 'generated', 'graph.json'),
    generatedSidebars: resolve(root, 'apps', 'web', 'sidebars.generated.ts'),
    defaultDatabase: resolve(root, 'data', 'knowledge.db'),
  };
}

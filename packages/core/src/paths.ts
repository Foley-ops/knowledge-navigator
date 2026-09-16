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
  readonly generatedDir: string;
  readonly dataDir: string;
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
    generatedDir: resolve(root, 'generated'),
    dataDir: resolve(root, 'data'),
    schemasDir: resolve(root, 'schemas'),
    conceptJsonSchema: resolve(root, 'schemas', 'concept.schema.json'),
    graphJson: resolve(root, 'generated', 'graph.json'),
    generatedSidebars: resolve(root, 'apps', 'web', 'sidebars.generated.ts'),
    defaultDatabase: resolve(root, 'data', 'knowledge.db'),
  };
}

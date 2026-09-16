# Knowledge Navigator Build State

Resume point for any agent continuing this build.

**Build authority:** [`KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md`](./KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md).
That file — not this one — holds the product brief, the frozen decisions (§2), the
contracts all code must obey (§4), every checkpoint, and the Definition of Done (§6).
Frozen decisions are deliberately **not** copied here; read them from the runbook so
there is exactly one authority and no chance of drift.

**Project root:** `/Users/nick/Projects/knowledge-navigator` (the folder containing the
runbook). The build never reads or writes parent directories.

**How to resume:** read the runbook in full, then read this file. Start at the first
checkpoint not listed under *Completed checkpoints*, honouring its **Depends on** line.

## Current checkpoint
B03 complete — B04 next.

## Completed checkpoints
- **A00** — Inventory. Project root /Users/nick/Projects/knowledge-navigator contained only KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md and an empty .git/ (branch main, zero commits). No unrelated user files at risk; nothing outside this folder is read or written.
- **A01** — Service boundary created in place: apps/{api,web}, content/concepts, data, generated, nginx, packages/core, schemas, scripts. .gitkeep added to data/ and generated/ only. No nested knowledge-navigator/ child directory.
- **A02** — BUILD_STATE.md created with the six required sections; frozen decisions referenced by link to the runbook rather than copied.
- **A03** — .gitignore, .dockerignore and .npmrc written. Git ignores .env, node_modules, build output, coverage, all SQLite/journal/WAL files, logs and local model data, while keeping .env.example, package-lock.json, generated/graph.json and apps/web/sidebars.generated.ts trackable. The Docker context additionally excludes .git, the runbook, BUILD_STATE.md, host node_modules, data/, test artifacts and model data.
- **B00** — Root npm workspace created: package.json (private, type=module, engines >=22 <23, workspaces apps/* and packages/*, scripts validate/compile/test/typecheck/build/check/dev plus lint, format and smoke), tsconfig.base.json with strict settings, .prettierrc.json, .prettierignore and a flat eslint.config.js. 151 root dev packages installed with exact versions; package-lock.json committed.
- **B01** — @navigator/core workspace created with build (tsconfig.json) and typecheck (tsconfig.spec.json) configurations and empty exported modules schema.ts, loader.ts, validate.ts, compile.ts, query.ts, cli.ts and index.ts.
- **B02** — @navigator/api workspace created: Fastify 5 application factory buildApp() with zod-validated environment configuration for every variable in runbook §4.4, structured JSON logging that redacts question and context, a temporary GET /api/health returning {status:"ok"}, and a server entry point with SIGTERM/SIGINT shutdown. Root vitest.config.ts added.
- **B03** — @navigator/web scaffolded as a Docusaurus 3.10.2 classic TypeScript site with no tutorial blog or sample docs. Every @docusaurus/* dependency is exactly 3.10.2; blog disabled; title 'Knowledge Navigator'. remark-math 6.0.0 + rehype-katex 7.0.1 + katex 0.16.47 configured, with KaTeX CSS imported from the installed package (46 KaTeX font files emitted into the local bundle, no CDN). Docs plugin reads ../../content/concepts and uses sidebars.generated.ts. markdown.format='detect' so canonical .md is parsed as CommonMark and can never execute MDX imports.

## Last successful checks
- **A00** `pwd && /bin/ls -la && git status --short` → root confirmed; git works; only the runbook untracked
- **A01** `find . -maxdepth 3 -type d -not -path './.git*' | sort` → 17 planned directories, no nested project folder
- **A02** `read BUILD_STATE.md` → next checkpoint identifiable as A03 from this file plus the runbook
- **A03** `git check-ignore -q <path> for 12 paths` → 7/7 ignored as required, 5/5 kept trackable as required
- **B00** `npm install && npm ls --depth=0` → install succeeded; npm ls exited 0 with 11 top-level dev dependencies
- **B01** `npm run typecheck --workspace @navigator/core` → exit 0
- **B02** `npx vitest run apps/api/tests/health.test.ts` → 1 test passed — in-memory app.inject() returned HTTP 200 and {status:'ok'}
- **B03** `npm run build --workspace @navigator/web (with a temporary placeholder concept)` → build succeeded; routes /, /search, /explore, /ask, /about and /concepts/placeholder emitted; placeholder then removed

## Blockers
_none_

## Important decisions
- Host toolchain: Node v22.14.0 via nvm at /Users/nick/.nvm/versions/node/v22.14.0/bin (the host default node is v26; every build command exports that nvm bin directory first so the engines range >=22 <23 is genuinely honoured). npm 10.9.2, Docker 28.5.2 + Compose v2.40.3, sqlite3 3.51.0, GNU Make 3.81, python3 3.14.6.
- Host Ollama confirmed at http://127.0.0.1:11434 and lists qwen3.8:27b-mlx (18.2 GB, nvfp4, capabilities completion/vision/tools/thinking). No model pull is needed for the ordinary stack.
- Git identity is configured (Nicholas F), so one local commit is made per completed phase. Nothing is ever pushed or published.
- .npmrc sets save-exact=true (runbook B00 requires exact versions) and engine-strict=true so the frozen Node 22 LTS engines range is enforced rather than warned about.
- TypeScript pinned to 6.0.3, not the 7.0.2 'latest' tag: typescript-eslint 8.70.0 (the only current release line) declares peer typescript >=4.8.4 <6.1.0, so TypeScript 7 would leave the project without type-aware linting. 6.0.3 is a current stable release on the build date and is the newest version the whole toolchain supports.
- katex pinned to 0.16.47, not the 0.18.7 'latest' tag: rehype-katex 7.0.1 (latest) declares a katex ^0.16.0 dependency. 0.16.47 is the newest release inside the range the current rehype-katex supports.
- Zod 4 supplies z.toJSONSchema() natively, so no separate zod-to-json-schema dependency is used for C01. Frontmatter is parsed with the yaml package plus an explicit delimiter split rather than gray-matter, so Markdown is never handed to a templating engine.
- The docs plugin is mounted at routeBasePath '/' rather than 'concepts'. Docusaurus resolves frontmatter 'slug' relative to routeBasePath, so the frozen canonical slug '/concepts/<name>' produced '/concepts/concepts/<name>' under routeBasePath 'concepts'. Mounting at the site root reproduces the frozen slugs exactly while src/pages still owns /, /search, /explore, /ask and /about (verified: each route renders its own h1).

## Next action
Begin B04 — add the MIT LICENSE and the service README.

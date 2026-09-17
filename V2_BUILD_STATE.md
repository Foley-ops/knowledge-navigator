# Knowledge Navigator Version 2 Build State

Resume point for any agent continuing the Version 2 build.

**Build authority:**
[`KNOWLEDGE_NAVIGATOR_V2_BUILD_RUNBOOK.md`](./KNOWLEDGE_NAVIGATOR_V2_BUILD_RUNBOOK.md).
That file — not this one — holds the v2 product contracts (§4), the frozen
decisions (§3), every v2 checkpoint, and the v2 Definition of Done (§17). Frozen
decisions are deliberately **not** copied here so there is one authority and no
drift.

**Version 1 evidence lives in [`BUILD_STATE.md`](./BUILD_STATE.md) and stays
there.** It must never be copied wholesale into this file. V1 is a finished
dependency: read it to learn what already works and why a decision was taken,
and record here only what Version 2 adds, changes, or re-verifies.

**Project root:** `/Users/nick/Projects/knowledge-navigator` (the folder holding
both runbooks). The build never reads or writes parent directories.

**How to resume:** read the v2 runbook in full, then the v1 runbook,
`BUILD_STATE.md`, `README.md` and `AGENT_CONTENT_CONTRACT.md`, then this file.
Start at the first checkpoint not listed under _Completed checkpoints_,
honouring its **Depends on** line.

## Current checkpoint

J04

## Completed checkpoints

- **J00** — Inventory. Project root `/Users/nick/Projects/knowledge-navigator`, branch `main`, HEAD `0b454cf` ("Definition of Done: all 33 statements verified"). `BUILD_STATE.md` reads `COMPLETE`. Working tree held exactly one untracked file, `KNOWLEDGE_NAVIGATOR_V2_BUILD_RUNBOOK.md`, which the checkpoint permits. Toolchain: Node v22.14.0 (nvm), npm 10.9.2, Docker 28.5.2 with Compose v2.40.3, sqlite3 3.51.0, GNU Make 3.81, Python 3.14.6. The v1 Compose stack was running and healthy (api and web; only web published, on 127.0.0.1:3000). No unrelated user files are at risk and nothing outside this folder is read or written.
- **J01** — `V2_BUILD_STATE.md` created with the six required sections plus the pointer back to `BUILD_STATE.md` for v1 evidence.
- **J01** — V2_BUILD_STATE.md created with the six required sections, a pointer to the v2 runbook as authority, and an explicit statement that v1 evidence stays in BUILD_STATE.md and is never copied here.
- **J02** — V1 regression baseline captured before any v2 change. make check 9/9 stages in 12 s with 330 unit tests across 16 files; 7 browser journeys passed in 4.9 s; smoke test 16 checks passed with the stack torn down and the named volume preserved. Corpus hash bb96930aab75dd2c3741c91919f65b8ba3ea53b5a7c13cea1588c7fd1edff96e over 11 Tier 1 pages, 96 internal links, 19 distinct sources, 40 citations, 0 errors. The eleven per-file SHA-256 hashes are pinned below for K08 to compare against.
- **J03** — Version 2 local-data boundaries added to .gitignore, .dockerignore and .prettierignore. Git and the Docker context now exclude .navigator/ (proposal workspaces and private exports), data/personal.db and its WAL/SHM siblings, data/uploads|artifacts|extraction/, *.upload.tmp, *.extract.tmp, exports/ and *.navigator-export.json. The Docker context additionally excludes the v2 runbook and V2_BUILD_STATE.md, matching how the v1 pair is treated. content/atlas.yaml and content/graph-only/ are deliberately NOT ignored by either boundary, because the API image compiles them.
- **J04** — content/graph-only/ created with a .gitkeep and staged. No Tier 2 or Tier 3 content invented.

## Last successful checks

- **J00** `pwd && git rev-parse HEAD && git status --short && docker compose ps -a` → root correct; HEAD `0b454cf`; only the v2 runbook untracked; api and web both healthy.
- **J01** `read V2_BUILD_STATE.md as a fresh agent would` → Current checkpoint, Completed checkpoints and Next action together identify J02 without reference to anything but the two runbooks.
- **J02** `make check` → all 9 stages passed in 12 s; 330 tests in 16 files; graph.json and sidebars.generated.ts byte-identical across two compiles
- **J02** `npm run test:browser` → 7 journeys passed in 4.9 s
- **J02** `./scripts/smoke.sh` → 16 checks passed; containers torn down, navigator-data volume preserved
- **J02** `shasum -a 256 content/concepts/*.md` → digest of the eleven hashes: 3825f5e70952be855003b3f6d0afc8af5cf3d4c144c1955538090d12692041df (list recorded under Important decisions)
- **J03** `git check-ignore over 15 private paths and 11 canonical v2 paths` → all 15 private paths ignored (proposal manifest, private export, personal.db and -wal/-shm, uploads, artifacts, extraction temporaries, external export, .env, knowledge.db, node_modules); all 11 canonical paths trackable (content/atlas.yaml, content/graph-only/*.yaml, concept Markdown, the six new core modules, the personal API module, the new web pages, the Hermes script, .env.example, package-lock.json, generated/graph.json, sidebars.generated.ts)
- **J03** `docker build against a busybox stage that asserts on the real build context` → exit 0 — .navigator/, data/personal.db, both v2 authority documents, .git, .env, data/ and node_modules are absent from the context, while content/concepts/resnet.md, package.json and AGENT_CONTENT_CONTRACT.md are present. A real .navigator/proposals/p1/manifest.json and data/personal.db existed on disk during the test and neither reached the context.
- **J04** `npm run validate` → 11 concepts, 11 Tier 1, 11 generated-draft, 4 categories, 20 relationships, 96 internal links, 19 sources, 40 citations, corpus hash bb96930a unchanged, 0 errors

## Blockers

_none_

## Important decisions

- Host toolchain is unchanged from v1: Node v22.14.0 from `/Users/nick/.nvm/versions/node/v22.14.0/bin`, which every build command puts on `PATH` first because the host default `node` is v26 and the project pins `engines: >=22 <23`.
- J02 content baseline — SHA-256 of each canonical page, frozen so K08 can prove the richer v2 model rewrote nothing: backpropagation-through-convolution ac5e64a3, convolution b2bf2651, convolutional-layer 76156beb, cross-correlation 1429387d, lenet 76c55072, pooling bf2e934d, receptive-field 6c361e06, residual-connection e341c713, resnet e04f7a1c, translation-equivariance 2423c311, vgg 9e27b75a. Full 64-character digests are in the scratchpad file j02-content-hashes.txt and are reproducible with the command above.
- Prettier checks every tracked Markdown file, so V2_BUILD_STATE.md is kept prettier-clean (blank line after each heading, underscore emphasis). The scratchpad helper that maintains it emits that shape directly rather than relying on a later formatting pass.
- V2_BUILD_STATE.md is listed in .prettierignore alongside BUILD_STATE.md rather than kept prettier-clean by hand. The two state files are appended to by a helper on every checkpoint, and a formatter fighting that helper would fail make check for a reason unrelated to the product.
- generated/graph.json is tracked and carries a builtAt timestamp, so any local compile shows it as modified. That churn is expected and is committed at phase boundaries rather than suppressed; the corpus hash beside it is the field that actually means something, and it is unchanged.

## Next action

J05 — inspect the diff for private data, then commit Phase J: begin the living navigator.

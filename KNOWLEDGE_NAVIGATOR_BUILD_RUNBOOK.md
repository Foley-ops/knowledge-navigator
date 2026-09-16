# Knowledge Navigator Build Runbook

**Purpose:** Give this file to Claude Opus, Claude Sonnet, Hermes, or another coding agent and tell it to execute every checkpoint in order.

**Runbook status:** Ready to execute

**Last designed:** 2026-09-16

---

## Product brief

Build a private, local-first research knowledge navigator for mathematics, artificial intelligence, and programming. It is not merely a wiki. It helps a researcher understand unfamiliar ideas, discover relevant methods, expose missing prerequisites and assumptions, compare nearby approaches, and find a defensible next move when stuck.

The product has three primary experiences:

1. **Explore:** browse canonical concepts through overlapping categories, typed relationships, prerequisites, and a local graph neighborhood.
2. **Understand:** move from a short definition to intuition, a concrete example, formal treatment, applicability, limitations, variants, history, and sources.
3. **Unstick me:** submit a question plus optional research context and receive a structured interpretation, candidate routes, assumptions, disqualifiers, missing information, next checks, citations, and an explicit confidence level.

Canonical knowledge is shared Markdown. Generated SQLite, search indexes, sidebars, and graph JSON are disposable compiled artifacts. AI output never silently changes canonical knowledge. All generated content begins as `generated-draft`. The initial content slice contains exactly eleven connected pages about convolutional networks and their mathematical foundations. This slice tests the system; it is not a claim about final scope.

Version 1 is single-user, private by default, Docker-first, and usable without any cloud service. Docusaurus is the reading surface, SQLite with FTS5 is the compiled index, Fastify is the local API, Cytoscape.js renders bounded graph neighborhoods, and Ollama is the local model provider. On the primary macOS machine, Ollama runs natively on the host for Apple acceleration while the application remains containerized. A Compose-managed Ollama profile exists only as a portable fallback. A normal consumer needs Git and Docker with the Compose plugin; the build agent also needs Node.js 22.

Success means a researcher can browse the slice, find concepts by names or aliases, understand their relationships and provenance, and ask a grounded question whose answer visibly separates evidence from uncertainty.

---

## 0. The one prompt to give the builder

Copy the text below into the builder agent:

```text
Build the Knowledge Navigator by following this Markdown file. This file is the complete product brief and build runbook.

Read this entire file before changing anything. Treat the folder containing this file as the project root. If BUILD_STATE.md does not exist, begin at A00. Otherwise begin at the first checkpoint it does not mark complete.

Complete checkpoints in order. Do not skip checkpoints. Do not redesign the architecture. Do not ask me to choose libraries, names, ports, databases, models, or scope; those decisions are already made in the runbook. After every checkpoint, run its check and update BUILD_STATE.md with the result. If a check fails, fix it before moving on. Continue automatically until the Definition of Done passes or a true external blocker is reached.

Do not create a nested project folder. Do not depend on files outside this folder. Do not commit secrets. Do not publish anything. Do not push anything. Do not install Hermes. Do not stop merely to report progress.
```

---

## 1. Rules for the builder

These rules prevent drift.

1. Read this entire runbook before editing.
2. Treat this one file as the complete build authority.
3. Work on exactly one checkpoint at a time.
4. Each checkpoint depends on the checkpoint named in its **Depends on** line.
5. Do not begin a checkpoint until its dependency is recorded as complete.
6. Run the checkpoint’s **Check** before marking it complete.
7. Record the exact command and short result in `BUILD_STATE.md`.
8. If a check fails, repair the current checkpoint. Do not work around it by weakening or deleting the check.
9. Make the smallest change that satisfies the current checkpoint.
10. Do not replace the chosen stack.
11. Do not add unrelated features.
12. Do not read from or write to parent directories.
13. Do not push, publish, deploy, or upload images.
14. Make one local commit after each completed phase when Git identity is configured. If a commit fails only because identity is not configured, record that fact and continue without changing global Git configuration.
15. If the agent loses context, it must reread this runbook, `BUILD_STATE.md`, and the most recent test output. It must not reconstruct the plan from memory.

### Retry rule

When something fails:

1. Read the complete error.
2. Attempt a direct fix.
3. Run the same check again.
4. Repeat up to three times.
5. If the same external blocker remains after three real attempts, record it under `## Blockers` in `BUILD_STATE.md`, leave the checkpoint incomplete, and stop safely.

A coding error is not an external blocker. Missing Docker, unavailable internet, unavailable package registries, or a required port owned by another protected service can be external blockers.

---

## 2. Frozen decisions

The builder must not reopen these decisions.

| Decision | Answer |
| --- | --- |
| Product location | The folder containing this runbook |
| External project dependencies | None |
| Primary user | Nick; single-user and private by default |
| Canonical content | Markdown files in `content/concepts/` |
| Metadata | YAML frontmatter validated with Zod |
| Compiled index | SQLite with FTS5 |
| Graph database | No external graph database in v1 |
| Application language | TypeScript |
| JavaScript runtime | Node.js 22 LTS |
| Package manager | npm with a committed `package-lock.json` |
| Web interface | Docusaurus 3.10.2 with React and TypeScript |
| API | Fastify |
| Tests | Vitest plus shell smoke tests |
| Visualization | Cytoscape.js neighborhood graph |
| Local model API | Existing host Ollama through `http://host.docker.internal:11434` |
| Default local model on the primary machine | `qwen3.8:27b-mlx` |
| Portable container-model fallback | `qwen3:8b` |
| Agent framework | Not a runtime dependency |
| Containers | Web and API; optional fallback Ollama and one-shot model pull |
| Container entry point | `docker compose` |
| Public port | `127.0.0.1:3000` by default |
| API exposure | Proxied through the web container at `/api`; not separately public |
| Default provider setting | `ollama`; core mode uses the host API and stays healthy if it is unavailable |
| Authentication | None in v1 because the service binds to localhost |
| Vector database | None in v1 |
| Embeddings | None in v1 |
| Cloud services | None required |
| Publishing | Prepared but never performed automatically |
| License for this service | MIT |

### Deliberately excluded from v1

Do not add any of these:

- accounts or multiple users;
- cloud login;
- Neo4j, Postgres, Redis, Elasticsearch, or a vector database;
- Kubernetes;
- mobile applications;
- browser extensions;
- automatic canonical publication by an AI agent;
- public hosting;
- payment or analytics systems;
- a general-purpose agent framework;
- automatic expansion into hundreds of concept pages.

---

## 3. Target directory tree

The completed service must have this shape. Small generated Docusaurus files may add to it, but the named paths must exist.

```text
./                         # the current folder; its actual name may differ
├── .dockerignore
├── .env.example
├── AGENT_CONTENT_CONTRACT.md
├── BUILD_STATE.md
├── Dockerfile.api
├── Dockerfile.web
├── LICENSE
├── Makefile
├── README.md
├── compose.yaml
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── src/
│   │   └── tests/
│   └── web/
│       ├── package.json
│       ├── docusaurus.config.ts
│       ├── sidebars.generated.ts
│       ├── src/
│       └── static/
├── content/
│   └── concepts/
├── data/
│   └── .gitkeep
├── generated/
│   └── .gitkeep
├── nginx/
│   └── default.conf
├── packages/
│   └── core/
│       ├── package.json
│       ├── src/
│       └── tests/
├── schemas/
│   └── concept.schema.json
└── scripts/
    ├── check.sh
    └── smoke.sh
```

Generated database files, build output, model files, and dependencies must not be committed.

---

## 4. Contracts that all code must obey

### 4.1 Concept frontmatter

Every canonical concept file must use this shape:

```yaml
---
concept_id: concept.deep_learning.convolutional_layer
title: Convolutional Layer
slug: /concepts/convolutional-layer
aliases:
  - convolution layer
  - conv layer
kind: method
tier: 1
review_state: generated-draft
summary: A neural-network layer that applies learned local filters with shared parameters.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.analysis.cross_correlation
    note: Most deep-learning libraries implement cross-correlation despite using convolution terminology.
sources:
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - uses-and-applicability
    checked_on: 2026-09-16
---
```

Allowed `kind` values:

```text
concept, method, algorithm, theorem, mathematical-object, assumption,
property, problem, failure-mode, example, implementation, tool
```

Allowed `tier` values: `1`, `2`, `3`.

Allowed `review_state` values:

```text
generated-draft, source-checked, expert-reviewed, formally-verified,
disputed-or-conditional
```

Allowed relationship types:

```text
requires, prerequisite_of, generalizes, specializes, variant_of,
equivalent_under, contrasts_with, approximates, implements, used_to_solve,
useful_when, unreliable_when, assumes, guarantees, mitigates, contributes_to,
introduced_by, supported_by, challenged_by, refined_by, belongs_to_category
```

Every Tier 1 page must contain these Markdown headings in this order:

```text
## Definition
## Why it matters
## Intuition
## Concrete example
## Formal treatment
## Assumptions and requirements
## Uses and applicability
## Limitations and common mistakes
## Variants and alternatives
## History and attribution
## Sources
## Prerequisites and next connections
```

Tier 2 requires a definition paragraph, sources, and relationships. Tier 3 requires valid frontmatter and a one-sentence summary but is omitted from reader navigation.

When a concept in the eleven-page slice is first mentioned in a section, link it as `[Display Name](./filename.md)`. Later mentions in the same section may be plain text. The validator must reject relative concept links whose target file does not exist. Concepts outside the slice remain plain text in v1; do not create extra stubs merely to make them links.

### 4.2 SQLite schema

The compiler must recreate the database atomically and create these tables:

```text
concepts
aliases
categories
concept_categories
relationships
sources
concept_sources
build_meta
concepts_fts
```

Required behavior:

- `concepts.id` is the stable `concept_id` primary key.
- `concepts.slug` is unique.
- aliases are normalized for case-insensitive lookup.
- every relationship target must exist.
- `primary_category` must be present in `categories` for that concept.
- FTS contains title, aliases, summary, and plain-text body.
- compilation writes a temporary database and renames it only after success.
- compilation also writes `generated/graph.json` and `apps/web/sidebars.generated.ts`.
- identical input must produce identical graph JSON and sidebar output.

### 4.3 HTTP API

All responses are JSON. Version 1 uses one ordinary request and response for assistance; it does not implement token streaming or server-sent events. The browser must show a clear waiting state and allow the user to cancel its request.

Required endpoints:

```text
GET  /api/health
GET  /api/build
GET  /api/search?q=<text>&limit=<1..50>
GET  /api/concepts/:conceptId
GET  /api/concepts/by-slug?slug=<slug>
GET  /api/graph/:conceptId?depth=<1..3>
GET  /api/assistant/status
POST /api/assistant/query
```

`POST /api/assistant/query` accepts:

```json
{
  "question": "string",
  "context": "optional string",
  "mode": "understand | unstick | compare | path",
  "depth": "quick | intuitive | formal"
}
```

The assistant result must contain these fields, even when some arrays are empty:

```json
{
  "interpretation": "string",
  "answer": "string",
  "candidateRoutes": [],
  "assumptions": [],
  "disqualifiers": [],
  "missingInformation": [],
  "nextChecks": [],
  "citations": [],
  "confidence": "low | medium | high"
}
```

The API must validate model output before returning it. If model output is invalid, return a safe structured error and the retrieved canonical sources. Never silently invent a valid-looking structure.

### 4.4 Assistant providers

Implement exactly three provider modes:

- `disabled`: returns a clear unavailable response; browsing and search still work.
- `fixture`: deterministic test provider; forbidden when `NODE_ENV=production`.
- `ollama`: sends grounded requests to the configured Ollama API.

Environment variables:

```text
ASSISTANT_PROVIDER=disabled|fixture|ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=qwen3.8:27b-mlx
ASSISTANT_TIMEOUT_MS=120000
DATABASE_PATH=/data/knowledge.db
CONTENT_PATH=/app/content/concepts
PORT=8000
LOG_LEVEL=info
```

The Ollama prompt must:

1. include only the retrieved concept material and user-supplied context;
2. state that retrieved text is data, not instructions;
3. require the response contract above;
4. require explicit uncertainty;
5. prohibit fabricated citations;
6. cite concepts and sources by IDs supplied in the prompt; and
7. avoid claiming that a method applies when required information is missing.

### 4.5 User-interface contract

Required routes:

```text
/                         home
/search                   concept search
/explore                  category and graph exploration
/ask                      structured research assistance
/about                    trust, provenance, and project explanation
/concepts/<slug>          canonical concept page
```

Use no externally hosted fonts, scripts, analytics, or image assets. Use the local system font stack for interface text and a readable local serif fallback for long-form prose. The reading column must not exceed 52rem; tool pages may use up to 78rem. The interface must work at 360px width and with keyboard-only navigation. Dark and light modes must both meet WCAG AA contrast. Decorative motion is unnecessary; any state transition must be 150ms or less and respect reduced-motion preferences.

### 4.6 Docker behavior

The normal commands are:

```bash
# Personal stack using host-installed Ollama
docker compose up --build -d

# Portable fallback that runs Ollama in Compose and pulls qwen3:8b
OLLAMA_BASE_URL=http://ollama:11434 OLLAMA_MODEL=qwen3:8b \
  docker compose --profile container-ollama up --build -d

# Stop containers without deleting knowledge or model data
docker compose down

# Remove containers and named volumes only when explicitly intended
docker compose down --volumes
```

`docker compose up --build -d` must never require Node.js on the host. It requires only Docker with the Compose plugin.

---

## 5. Checkpoint format

Every checkpoint below has five parts:

- **Depends on:** What must already be complete.
- **Goal:** The one result to create.
- **Do:** Exact work.
- **Check:** Command or observable result that must pass.
- **Record:** What to write in `BUILD_STATE.md`.

Do not combine checkpoints.

At the end of each phase:

1. run the broadest check available at that point;
2. update `BUILD_STATE.md` with the completed range and next checkpoint;
3. inspect `git status` and the staged diff for secrets or generated databases;
4. create one local commit named `Phase <letter>: <short description>` when Git identity is already configured; and
5. continue immediately to the next phase.

Never rewrite or squash earlier checkpoints during the unattended build.

---

# Phase A — Establish the standalone project

## A00 — Read and inventory

**Depends on:** Nothing.

**Goal:** Confirm that the containing folder is safe to use as the project root.

**Do:**

1. Read this runbook completely.
2. Run `pwd` and list the folder, including hidden files.
3. The expected starting state is this runbook and optionally an empty `.git/` directory. If unrelated user files exist, do not delete or overwrite them; record a blocker and stop.
4. If Git is not initialized, run `git init` in this folder.
5. Run `git status --short` and record the result.

**Check:** The current folder is the project root, Git works, no nested project folder was created, and no unrelated user files are at risk.

**Record:** Absolute project path, initial file list, Git status, and confirmation that the builder will not access parent directories.

## A01 — Create the service boundary

**Depends on:** A00.

**Goal:** Create the empty directories from the target tree directly in the current folder.

**Do:** Create the required subdirectories from the target tree. Do not create a `knowledge-navigator/` child directory. Add `.gitkeep` only to otherwise-empty `data/` and `generated/` directories.

**Check:** `find . -maxdepth 3 -type d | sort` shows the planned directories beneath the current folder and no duplicate nested project.

**Record:** Directory list and confirmation that no nested project folder exists.

## A02 — Create build state

**Depends on:** A01.

**Goal:** Give future short-context agents one resume point.

**Do:** Create `BUILD_STATE.md` with these sections:

```text
# Knowledge Navigator Build State
## Current checkpoint
## Completed checkpoints
## Last successful checks
## Blockers
## Important decisions
## Next action
```

Set the current checkpoint to `A02`. Record frozen decisions by linking back to this runbook rather than copying them.

**Check:** A new agent can identify the next checkpoint as A03 by reading only `BUILD_STATE.md` and this runbook.

**Record:** Mark A00–A02 complete and A03 next.

## A03 — Add ignore and secret boundaries

**Depends on:** A02.

**Goal:** Prevent generated data and secrets from entering Git or container images.

**Do:** Add `.gitignore` and `.dockerignore` in the project root. Ignore `.env`, `node_modules`, build output, coverage, generated SQLite files, temporary database files, logs, and Ollama data. Do not ignore `.env.example`, graph JSON, generated sidebar TypeScript, or lockfiles.

The Docker build context is the current project root. `.dockerignore` must exclude `.git`, the runbook, local environment files, test artifacts, databases, model data, and dependencies that images do not require.

**Check:** Create temporary filenames mentally or with a safe dry check and confirm `git check-ignore` recognizes `.env`, `data/knowledge.db`, and `node_modules/`, but not `.env.example` or `package-lock.json`.

**Record:** The ignore check results.

---

# Phase B — Scaffold the monorepo

## B00 — Create root package metadata

**Depends on:** A03.

**Goal:** Create one npm workspace.

**Do:** Create the service `package.json` with workspaces for `apps/*` and `packages/*`. Set `private: true`, Node engine `>=22 <23`, and scripts named `validate`, `compile`, `test`, `typecheck`, `build`, `check`, and `dev`. Add `tsconfig.base.json` with strict TypeScript settings.

Use current stable dependency releases available on the build date, except Docusaurus packages, which must all be exactly `3.10.2`. Install with exact versions and commit the resulting `package-lock.json`.

**Check:** `npm install` succeeds and `npm ls --depth=0` exits zero.

**Record:** Node version, npm version, and lockfile creation.

## B01 — Create the core package

**Depends on:** B00.

**Goal:** Create `@navigator/core`.

**Do:** Add the core workspace package and empty exported modules for schema, loading, validation, compilation, query, and CLI behavior. Add a TypeScript build configuration.

**Check:** `npm run typecheck --workspace @navigator/core` succeeds.

**Record:** Package name and successful typecheck.

## B02 — Create the API package

**Depends on:** B01.

**Goal:** Create `@navigator/api`.

**Do:** Add a Fastify TypeScript application with one temporary `/api/health` route returning `{ "status": "ok" }`. Add configuration loading and structured logging. Do not add business behavior yet.

**Check:** An API unit test starts the app in memory and receives HTTP 200 from `/api/health`.

**Record:** Test command and result.

## B03 — Scaffold Docusaurus

**Depends on:** B02.

**Goal:** Create the web workspace.

**Do:** Scaffold the Docusaurus classic TypeScript template inside `apps/web`, remove the tutorial blog and sample documentation, set every `@docusaurus/*` dependency to exactly `3.10.2`, and set the product title to `Knowledge Navigator`. Install `remark-math`, `rehype-katex`, and `katex` with exact versions. Configure mathematical Markdown and import KaTeX CSS from the installed package; do not use a CDN.

Configure the docs plugin to read canonical Markdown from `../../content/concepts` and use `sidebars.generated.ts`.

**Check:** `npm run build --workspace @navigator/web` succeeds with a temporary placeholder concept.

**Record:** Docusaurus version and build result.

## B04 — Add the service README and license

**Depends on:** B03.

**Goal:** Explain what this directory is without promising unfinished features.

**Do:** Add the MIT `LICENSE`. Add a short `README.md` containing the purpose summarized from this file’s Product brief, current status, the two Docker Compose start commands, local URL, data locations, privacy warning, and a link to this runbook. Clearly say the service is personal and experimental.

**Check:** Every command named in the README exists in this runbook or package scripts.

**Record:** README and license complete.

---

# Phase C — Define canonical content

## C00 — Implement the Zod schema

**Depends on:** B04.

**Goal:** Make the frontmatter contract executable.

**Do:** Implement the exact enums and required fields from §4.1 in `packages/core/src/schema.ts`. Reject unknown top-level keys. Validate IDs with lowercase dotted identifiers, slugs with `/concepts/`, URLs as HTTP(S), and ISO dates.

**Check:** Unit tests cover one valid object and at least one invalid example for every enum or format rule.

**Record:** Number of passing schema tests.

## C01 — Export JSON Schema

**Depends on:** C00.

**Goal:** Make the content contract usable outside TypeScript.

**Do:** Add a deterministic command that writes `schemas/concept.schema.json` from the same schema used at runtime. Do not maintain a second handwritten schema.

**Check:** Run the generator twice and confirm the second run produces no diff.

**Record:** Generator command and deterministic result.

## C02 — Implement Markdown loading

**Depends on:** C01.

**Goal:** Load one concept file safely.

**Do:** Parse YAML frontmatter and Markdown body. Return source path, validated metadata, raw body, plain-text body, heading list, and SHA-256 content hash. Treat Markdown and HTML as untrusted data. Do not execute MDX imports or embedded code.

**Check:** Tests cover valid Markdown, missing frontmatter, invalid YAML, invalid metadata, and a fenced code block that remains data.

**Record:** Loader test result.

## C03 — Validate required headings

**Depends on:** C02.

**Goal:** Enforce the content template by tier.

**Do:** For Tier 1, require all headings in §4.1 exactly once and in order. For Tier 2, require a non-empty body, at least one source, and at least one relationship or category. For Tier 3, require valid metadata and summary only.

**Check:** Tests demonstrate one passing and one failing page for each tier.

**Record:** Tier-validation test result.

## C04 — Validate the complete corpus

**Depends on:** C03.

**Goal:** Detect errors spanning multiple files.

**Do:** Load every `.md` file under `content/concepts`. Reject duplicate IDs, slugs, normalized aliases, missing relationship targets, missing primary categories, duplicate source IDs with conflicting metadata, and self-relationships unless explicitly allowed. Sort all diagnostics by file and field.

**Check:** Corpus tests cover every rejection case and return all errors in one run rather than stopping at the first.

**Record:** Corpus-validation test result.

## C05 — Add the eleven-page vertical slice

**Depends on:** C04.

**Goal:** Supply enough connected real content to test explanation, provenance, search, graph traversal, and multi-category navigation without beginning broad expansion.

**Do:** Create exactly these eleven Tier 1 concepts, in this order. Validate each page before beginning the next. All begin as `generated-draft`.

1. `convolution` — mathematical continuous and discrete convolution.
2. `cross-correlation` — contrast it with convolution and explain deep-learning terminology.
3. `receptive-field` — local and effective receptive fields.
4. `translation-equivariance` — distinguish equivariance from invariance formally.
5. `convolutional-layer` — kernels, channels, stride, padding, parameter sharing, and output-shape arithmetic.
6. `pooling` — max and average pooling, invariance, information loss, and strided alternatives.
7. `backpropagation-through-convolution` — gradients with respect to inputs and kernels, with convention-dependent convolution/correlation language stated carefully.
8. `lenet` — historical architecture and its relationship to earlier concepts.
9. `residual-connection` — identity shortcuts, degradation, and gradient flow without overstating the explanation.
10. `vgg` — repeated small filters, architecture pattern, costs, and historical role.
11. `resnet` — residual blocks and the relationship among VGG-era depth, residual connections, and trainability.

Use this identity and navigation table exactly. Category order sets the primary category.

| File | `concept_id` | Slug | Aliases | Categories | Prerequisites |
| --- | --- | --- | --- | --- | --- |
| `convolution.md` | `concept.analysis.convolution` | `/concepts/convolution` | `convolution operator` | `Mathematics/Analysis` | none |
| `cross-correlation.md` | `concept.analysis.cross_correlation` | `/concepts/cross-correlation` | `cross correlation` | `Mathematics/Analysis` | `concept.analysis.convolution` |
| `receptive-field.md` | `concept.deep_learning.receptive_field` | `/concepts/receptive-field` | `RF` | `Artificial Intelligence/Deep Learning — Architectures`; `Artificial Intelligence/Computer Vision` | `concept.analysis.convolution` |
| `translation-equivariance.md` | `concept.analysis.translation_equivariance` | `/concepts/translation-equivariance` | `shift equivariance` | `Mathematics/Analysis`; `Artificial Intelligence/Deep Learning — Architectures` | `concept.analysis.convolution` |
| `convolutional-layer.md` | `concept.deep_learning.convolutional_layer` | `/concepts/convolutional-layer` | `convolution layer`; `conv layer` | `Artificial Intelligence/Deep Learning — Architectures` | convolution, cross-correlation, receptive field, translation equivariance IDs above |
| `pooling.md` | `concept.deep_learning.pooling` | `/concepts/pooling` | `spatial pooling` | `Artificial Intelligence/Deep Learning — Architectures` | convolutional layer ID above |
| `backpropagation-through-convolution.md` | `concept.deep_learning.backpropagation_through_convolution` | `/concepts/backpropagation-through-convolution` | `convolution backward pass`; `conv backprop` | `Artificial Intelligence/Deep Learning — Training` | convolutional layer ID above |
| `lenet.md` | `concept.deep_learning.lenet` | `/concepts/lenet` | `LeNet-5` | `Artificial Intelligence/Deep Learning — Architectures`; `Artificial Intelligence/Computer Vision` | convolutional layer and pooling IDs above |
| `residual-connection.md` | `concept.deep_learning.residual_connection` | `/concepts/residual-connection` | `skip connection`; `shortcut connection` | `Artificial Intelligence/Deep Learning — Architectures` | backpropagation-through-convolution ID above |
| `vgg.md` | `concept.deep_learning.vgg` | `/concepts/vgg` | `VGGNet`; `VGG network` | `Artificial Intelligence/Computer Vision`; `Artificial Intelligence/Deep Learning — Architectures` | convolutional layer and pooling IDs above |
| `resnet.md` | `concept.deep_learning.resnet` | `/concepts/resnet` | `Residual Network` | `Artificial Intelligence/Computer Vision`; `Artificial Intelligence/Deep Learning — Architectures` | residual connection and VGG IDs above |

Add these typed relations in addition to prerequisites:

- cross-correlation `contrasts_with` convolution;
- convolutional layer `implements` cross-correlation;
- describe pooling versus strided behavior only in prose because no separate strided-convolution concept exists yet;
- express LeNet’s composition through prerequisites and prose because `uses` is not a v1 relationship;
- describe how residual connections mitigate degradation or training difficulty in prose without inventing a missing target node;
- ResNet `implements` residual connection;
- ResNet `contrasts_with` VGG.

Do not create person nodes, paper nodes, or extra concept stubs merely to satisfy prose. Put people and papers in history and source metadata for this slice.

Use stable dotted IDs, aliases, typed relationships, and overlapping categories. Every page follows the complete Tier 1 heading contract. Aim for 400–800 useful words, but correctness is more important than length. Define notation. Link the first relevant occurrence of every concept that already exists in the slice.

Required anchor sources:

- Deep Learning, Chapter 9: `https://www.deeplearningbook.org/contents/convnets.html`
- LeNet-5 paper: `https://ieeexplore.ieee.org/document/726791`
- VGG paper: `https://arxiv.org/abs/1409.1556`
- ResNet paper: `https://arxiv.org/abs/1512.03385`
- Effective receptive field paper: `https://arxiv.org/abs/1701.04128`

Use additional primary or authoritative sources where the anchor sources do not support a claim. Check each external URL with a bounded request, but do not make normal builds depend on the network. A reachable URL is not proof that it supports a claim; record only the sections it materially supports.

**Check:** After every page, `npm run validate` succeeds. At the end it reports eleven concepts, eleven Tier 1 pages, eleven `generated-draft` states, and zero errors. No concept outside this list exists.

**Record:** Concept count, tier counts, review-state counts, link count, source count, and any source URL that could not be checked.

## C06 — Write the agent content contract

**Depends on:** C05.

**Goal:** Give future content-writing agents strict behavior.

**Do:** Create `AGENT_CONTENT_CONTRACT.md`. Require agents to propose diffs, preserve stable IDs, use the schema, cite claims, distinguish uncertainty, run validation, and never promote their own work above `generated-draft`. Include the page template and a short pre-publication checklist.

**Check:** The contract contains no instructions that contradict §4.1 or the product vision.

**Record:** Contract complete.

---

# Phase D — Compile the knowledge index

## D00 — Create the SQLite schema

**Depends on:** C06.

**Goal:** Create the tables in §4.2.

**Do:** Implement a compiler that creates a new SQLite database at a temporary path, enables foreign keys, creates every required table and index, and records schema version `1` in `build_meta`.

**Check:** A test compiles an empty valid corpus and queries `sqlite_master` for every required table.

**Record:** Database schema test result.

## D01 — Insert concepts and aliases

**Depends on:** D00.

**Goal:** Compile canonical identity data.

**Do:** Insert concept metadata, body, content hash, and source path. Insert title and aliases in normalized form. Make collisions fail compilation.

**Check:** Compile the acceptance corpus and query all eleven concepts plus the aliases `conv layer` and `ResNet` or their normalized equivalents.

**Record:** Concept and alias row counts.

## D02 — Insert categories and relationships

**Depends on:** D01.

**Goal:** Compile the graph edges.

**Do:** Insert categories, primary-category flags, and typed relationships with foreign keys. Preserve relationship notes and conditions.

**Check:** Every relationship source and target joins to a concept. A graph query from ResNet reaches residual connection and at least one earlier architecture within two hops.

**Record:** Category and relationship row counts.

## D03 — Insert sources

**Depends on:** D02.

**Goal:** Compile evidence metadata.

**Do:** Deduplicate sources by `source_id`, reject conflicting duplicates, and create concept-source links including supported section names.

**Check:** The ResNet concept resolves to the ResNet paper and its supported sections; VGG and LeNet resolve to their primary papers.

**Record:** Source and concept-source row counts.

## D04 — Build FTS search

**Depends on:** D03.

**Goal:** Search titles, aliases, summaries, and body text.

**Do:** Create and populate `concepts_fts`. Implement a query function that prioritizes exact title, exact alias, title prefix, and then FTS rank. Escape or reject malformed FTS syntax rather than exposing SQL errors.

**Check:** Searches for `ResNet`, `conv layer`, `translation invariance`, and one body phrase return sensible ordered results. SQL injection-shaped input returns safely.

**Record:** Search test result.

## D05 — Export graph JSON

**Depends on:** D04.

**Goal:** Supply the browser graph without exposing SQLite.

**Do:** Write sorted nodes, edges, categories, build timestamp, schema version, and corpus hash to `generated/graph.json`. Sort semantically before serialization.

**Check:** Two builds from identical input produce byte-identical graph JSON except that the timestamp must be derived from `SOURCE_DATE_EPOCH` when set. Tests set that variable.

**Record:** Node count, edge count, and deterministic-build result.

## D06 — Generate Docusaurus sidebars

**Depends on:** D05.

**Goal:** Show one page in multiple useful categories without duplication.

**Do:** Generate `apps/web/sidebars.generated.ts`. Use the primary category for the canonical `doc` entry and `ref` entries for additional categories. Omit Tier 3 concepts. Sort categories and pages deterministically by explicit title.

**Check:** Gradient descent appears as one canonical doc and at least one additional reference. The Docusaurus build succeeds.

**Record:** Sidebar generation and web build result.

## D07 — Make compilation atomic

**Depends on:** D06.

**Goal:** Never leave a half-written database.

**Do:** Complete compilation at a temporary path, close it, validate row counts and foreign keys, then rename it to `DATABASE_PATH`. On failure, preserve the prior valid database and remove the temporary file.

**Check:** A test introduces a broken relationship after a successful build; compilation fails and the original database hash remains unchanged.

**Record:** Atomic-failure test result.

## D08 — Add the CLI

**Depends on:** D07.

**Goal:** Provide simple commands for humans and containers.

**Do:** Implement:

```text
navigator validate
navigator compile
navigator inspect <concept-id>
navigator search <query>
```

Wire root npm scripts to these commands.

**Check:** Run all four commands against the acceptance corpus.

**Record:** Command outputs in summarized form.

---

# Phase E — Build the API

## E00 — Load the database read-only

**Depends on:** D08.

**Goal:** Prevent API requests from changing canonical knowledge.

**Do:** Open the compiled SQLite database read-only after startup. Fail startup with a clear message if it is missing, invalid, or uses a newer schema version.

**Check:** API tests confirm read queries work and write statements fail.

**Record:** Read-only test result.

## E01 — Implement health and build endpoints

**Depends on:** E00.

**Goal:** Make operations observable.

**Do:** `/api/health` reports API health, database availability, and assistant-provider availability without leaking configuration secrets. `/api/build` reports schema version, corpus hash, concept counts, and build time.

**Check:** Endpoint tests pass for healthy and missing-database states.

**Record:** Endpoint test result.

## E02 — Implement concept endpoints

**Depends on:** E01.

**Goal:** Retrieve canonical concepts by ID or slug.

**Do:** Return metadata, rendered-safe Markdown source, relationships, categories, and sources. Return 404 for unknown values. Never render raw HTML server-side.

**Check:** Tests retrieve convolutional layer by ID and slug and receive 404 for an unknown concept.

**Record:** Endpoint test result.

## E03 — Implement search endpoint

**Depends on:** E02.

**Goal:** Expose safe ranked search.

**Do:** Validate query length and limit. Return concept ID, title, slug, summary, matched alias, review state, and rank explanation.

**Check:** Endpoint tests cover title, alias, body, empty, too-long, malformed, and injection-shaped queries.

**Record:** Search endpoint test result.

## E04 — Implement graph endpoint

**Depends on:** E03.

**Goal:** Retrieve a bounded neighborhood.

**Do:** Traverse typed edges to depth 1–3, deduplicate nodes and edges, cap the result at 200 nodes, and report truncation. Never allow an unbounded whole-corpus query through this endpoint.

**Check:** Tests verify depth behavior, unknown IDs, the cap, and stable ordering.

**Record:** Graph endpoint test result.

## E05 — Implement assistant provider interface

**Depends on:** E04.

**Goal:** Keep model choice outside business logic.

**Do:** Define provider interface, request type, structured response type, and provider-status type. Implement `disabled` and deterministic `fixture` providers. Reject `fixture` in production.

**Check:** Unit tests cover both modes and the production rejection.

**Record:** Provider test result.

## E06 — Implement grounded retrieval

**Depends on:** E05.

**Goal:** Select canonical context before calling a model.

**Do:** Search the question and optional context, select at most eight concepts, include their one-hop relationships and sources, and enforce a configurable character budget. Prefer exact aliases and titles. Return retrieval details for debugging tests but not private context in logs.

**Check:** Tests show deterministic selection, the eight-concept limit, and budget enforcement.

**Record:** Retrieval test result.

## E07 — Implement Ollama provider

**Depends on:** E06.

**Goal:** Generate structured grounded assistance locally.

**Do:** Call Ollama’s HTTP API using the configured base URL and model. Use the prompt requirements in §4.4. Set request timeout, handle unavailable model/server, validate returned JSON, and map failures to safe errors.

**Check:** Mock-server tests cover success, timeout, connection refusal, malformed JSON, fabricated citation IDs, and schema-invalid output.

**Record:** Ollama-provider test result.

## E08 — Implement assistant endpoints

**Depends on:** E07.

**Goal:** Expose provider status and questions.

**Do:** Implement `/api/assistant/status` and `/api/assistant/query`. Validate input lengths and enums. Return retrieval citations even when generation fails. Add request IDs. Do not log the full user context by default.

**Check:** API tests use the fixture provider to verify every mode and depth plus error cases.

**Record:** Assistant endpoint test result.

## E09 — Add API safety limits

**Depends on:** E08.

**Goal:** Keep a local service from being accidentally abused.

**Do:** Set body-size limits, request timeouts, basic per-process rate limiting, secure response headers, and explicit allowed origins for localhost. Ensure errors omit stack traces in production.

**Check:** Tests cover oversized input, rate limit, disallowed origin, and production error shape.

**Record:** Safety test result.

---

# Phase F — Build the researcher interface

## F00 — Create the visual shell

**Depends on:** E09.

**Goal:** Make the site feel like a research instrument, not generated documentation.

**Do:** Create a restrained responsive theme with readable typography, dark mode, a compact header, and navigation for `Explore`, `Search`, `Ask`, and `About`. Remove template branding and sample content. Keep accessibility contrast and keyboard focus visible.

**Check:** Docusaurus production build succeeds. Inspect desktop and narrow layouts with screenshots or browser automation.

**Record:** Build result and inspected viewport sizes.

## F01 — Build the home page

**Depends on:** F00.

**Goal:** Let a researcher choose a job immediately.

**Do:** Show four actions: `Understand a concept`, `Help me get unstuck`, `Compare approaches`, and `Explore the map`. Add one search box and a small trust note explaining review states.

**Check:** Every action leads to a working route and can be reached with the keyboard.

**Record:** Route and keyboard check.

## F02 — Render concept metadata

**Depends on:** F01.

**Goal:** Make canonical pages useful beyond ordinary Markdown.

**Do:** Customize the Docusaurus document layout to show aliases, kind, tier, review state, categories, sources, and typed relationship cards around the Markdown body. Link relationship targets to their canonical pages.

**Check:** The convolutional-layer page displays every metadata group and has no broken internal links.

**Record:** Concept-page check.

## F03 — Build search

**Depends on:** F02.

**Goal:** Find concepts without knowing exact terminology.

**Do:** Build a search page that calls `/api/search`, debounces input, supports aliases, shows why a result matched, and handles loading, empty, unavailable, and error states.

**Check:** `conv layer` finds convolutional layer and clicking the result opens its canonical page.

**Record:** Search acceptance result.

## F04 — Build category exploration

**Depends on:** F03.

**Goal:** Browse the atlas without treating it as the ontology.

**Do:** Build an Explore page from graph JSON. Show the three top-level atlas categories, nested category paths, and concept cards. Make clear that concepts may occur in multiple categories.

**Check:** Gradient descent is reachable through each assigned category but resolves to one URL.

**Record:** Multiple-category acceptance result.

## F05 — Build the concept neighborhood graph

**Depends on:** F04.

**Goal:** Visualize useful local relationships.

**Do:** Use Cytoscape.js inside a client-only component. Show one bounded neighborhood, label edge types, provide a text-list fallback, and allow clicking a node to open or recenter it. Do not render the entire graph by default.

**Check:** The graph loads without server-side rendering errors, is keyboard-accessible through the fallback, and handles API failure.

**Record:** Graph acceptance result.

## F06 — Build the Ask form

**Depends on:** F05.

**Goal:** Accept real research context simply.

**Do:** Create fields for question and optional context, plus mode and depth controls. Default to `unstick` and `intuitive`. Show a privacy note that context is sent only to the configured local provider in the default stack.

**Check:** Validation prevents an empty question and preserves entered text after a recoverable API error.

**Record:** Ask-form result.

## F07 — Render structured assistance

**Depends on:** F06.

**Goal:** Present useful reasoning instead of a wall of chat text.

**Do:** Render separate sections for interpretation, answer, candidate routes, assumptions, disqualifiers, missing information, next checks, citations, and confidence. Link concept citations internally and source citations externally. Make uncertainty visually explicit.

**Check:** Fixture-provider output renders every field and an unavailable provider produces a helpful setup message.

**Record:** Assistant-rendering result.

## F08 — Add progressive explanation controls

**Depends on:** F07.

**Goal:** Move among quick, intuitive, and formal depth without losing context.

**Do:** Allow a user to rerun the same request at another depth. Keep the original question and context. Do not silently claim that generated explanation changes canonical content.

**Check:** Switching depth produces a new request with only the depth changed.

**Record:** Depth-control test.

## F09 — Add trust and failure states

**Depends on:** F08.

**Goal:** Keep the interface honest.

**Do:** Add consistent badges and explanations for review state, model unavailable, generation failure, source unavailable, truncated graph, and low confidence. Never replace a failure with invented content.

**Check:** Component tests or deterministic browser states cover every failure state.

**Record:** Trust-state test result.

---

# Phase G — Containerize it

## G00 — Build the API image

**Depends on:** F09.

**Goal:** Run validation, compilation, and API without host Node.js.

**Do:** Create `Dockerfile.api` using Node 22 on a Debian slim base. Use a multi-stage build, install from the lockfile, compile TypeScript, copy only required runtime files and content, run as a non-root user, compile the database during container startup, and then start the API.

**Check:** Build the image using the current project root as context. Start it with a temporary data volume and receive healthy status.

**Record:** Image size and health result.

## G01 — Build the web image

**Depends on:** G00.

**Goal:** Serve static Docusaurus output and proxy the API.

**Do:** Create `Dockerfile.web` with a Node build stage and an unprivileged Nginx runtime stage. Run validation and sidebar generation before the Docusaurus build. Add `nginx/default.conf` to serve the site, proxy `/api/` to `api:8000`, and set safe headers.

**Check:** Build the image. Confirm its filesystem does not contain `.git`, `.env`, this runbook, local test output, source maps containing secrets, or the SQLite database.

**Record:** Image size and boundary check.

## G02 — Write Compose core services

**Depends on:** G01.

**Goal:** Start web and API with one command.

**Do:** Create `compose.yaml` with `web` and `api`. Bind web to `${BIND_ADDRESS:-127.0.0.1}:${WEB_PORT:-3000}:8080`. Do not publish the API port. Add health checks, restart policy `unless-stopped`, a named `navigator-data` volume, and service dependencies based on health. Add `host.docker.internal:host-gateway` to the API service so the same host-Ollama configuration also works on Linux engines that require the explicit mapping.

**Check:** `docker compose config` succeeds and shows only the web port published.

**Record:** Compose config result.

## G03 — Add the container-Ollama fallback profile

**Depends on:** G02.

**Goal:** Preserve a portable option for machines without native host Ollama.

**Do:** Add `ollama` and one-shot `ollama-pull` services under profile `container-ollama`. Persist fallback models in a named `ollama-data` volume. The portable fallback command explicitly sets `OLLAMA_BASE_URL=http://ollama:11434` and `OLLAMA_MODEL=qwen3:8b`. Configure API access on the internal Compose network. The ordinary stack uses the host values from §4.4 and must not start or pull a duplicate Ollama model. An unavailable provider must leave browsing healthy while `/api/assistant/status` reports the failure honestly. Never expose port 11434 publicly.

**Check:** Ordinary `docker compose config` contains no Ollama container. `OLLAMA_BASE_URL=http://ollama:11434 OLLAMA_MODEL=qwen3:8b docker compose --profile container-ollama config` shows the two fallback services and no additional published ports.

**Record:** Profile config result.

## G04 — Add environment template

**Depends on:** G03.

**Goal:** Make personal configuration obvious and safe.

**Do:** Add `.env.example` with every variable from §4.4 plus bind address and web port. Use `ASSISTANT_PROVIDER=ollama`, `OLLAMA_BASE_URL=http://host.docker.internal:11434`, and `OLLAMA_MODEL=qwen3.8:27b-mlx` as the personal defaults. Document the portable fallback command and explain that `disabled` intentionally removes generation. Do not put credentials in the file.

**Check:** Copying `.env.example` to a temporary `.env` makes `docker compose config` succeed; `.env` remains ignored.

**Record:** Environment-template check.

## G05 — Add container health and shutdown behavior

**Depends on:** G04.

**Goal:** Start in order and stop cleanly.

**Do:** Ensure API becomes healthy only after successful corpus compilation and database opening. Ensure web becomes healthy only when it can serve a page. Handle SIGTERM and close SQLite cleanly.

**Check:** Start the core stack, inspect health, stop it, and confirm no container remains running.

**Record:** Health and shutdown result.

## G06 — Run the core smoke test

**Depends on:** G05.

**Goal:** Prove a clean user can run the product.

**Do:** From the project root, run `docker compose down --volumes`, then `docker compose up --build -d`. Wait for health. Test home, concept page, search API, graph API, assistant status, and a 404. Stop without deleting volumes.

**Check:** Every request passes and the web UI is available at `http://127.0.0.1:3000`.

**Record:** Exact smoke-test command and results.

## G07 — Test host Ollama and the portable fallback configuration

**Depends on:** G06.

**Goal:** Prove the application containers can use native host Ollama without duplicating it.

**Do:** Before starting the application, confirm the host responds at `http://127.0.0.1:11434/api/tags` and lists `qwen3.8:27b-mlx`. From a temporary container, confirm `http://host.docker.internal:11434/api/tags` is reachable. Run ordinary `docker compose up --build -d`; do not enable the fallback profile and do not pull another model. Confirm `ASSISTANT_PROVIDER=ollama`. Submit this acceptance question: `My image model keeps losing small spatial details after repeated downsampling. What ideas in this knowledge base should I inspect, what assumptions matter, and what should I check next?` Confirm the response follows the structured contract and cites only supplied concept or source IDs. Finally, validate the `container-ollama` Compose configuration without starting it.

**Check:** The assistant returns a valid structured response from `qwen3.8:27b-mlx`, the ordinary stack contains no Ollama container, and the portable fallback Compose configuration is valid. If the host model later becomes unavailable, fixture-provider tests must still pass and the limitation must be recorded; do not weaken product behavior.

**Record:** Model, pull result, latency, and contract result.

---

# Phase H — Automate verification

## H00 — Create one check script

**Depends on:** G07.

**Goal:** Give every agent one command before declaring success.

**Do:** Create `scripts/check.sh` and a `make check` target. It must run formatting checks, lint, typecheck, content validation, deterministic compilation tests, unit tests, and the Docusaurus production build. It must stop on the first failing command and print the failing stage clearly.

**Check:** `make check` succeeds from a clean checkout after dependency installation.

**Record:** Duration and summary.

## H01 — Create the Docker smoke script

**Depends on:** H00.

**Goal:** Make the Compose acceptance test repeatable.

**Do:** Create `scripts/smoke.sh`. It must start the core stack, wait with a finite timeout, run the G06 requests, print container logs on failure, and always clean up containers while preserving named volumes.

**Check:** Run the script twice. Both runs pass.

**Record:** Both results.

## H02 — Add browser acceptance tests

**Depends on:** H01.

**Goal:** Verify the main human journeys.

**Do:** Add Playwright tests for:

1. search by alias and open a concept;
2. browse two categories to the same canonical concept;
3. inspect a concept neighborhood;
4. submit a fixture-provider question and see all structured sections;
5. see a useful message when the provider is disabled.

Use deterministic test data and no real model.

**Check:** All five journeys pass headlessly.

**Record:** Browser-test result and trace location on failure.

## H03 — Add continuous integration

**Depends on:** H02.

**Goal:** Make future changes prove themselves.

**Do:** Add a GitHub Actions workflow for this repository. It runs lockfile installation, `make check`, browser tests, and both Docker image builds. It does not publish images and does not read repository secrets.

**Check:** Validate workflow syntax locally if tooling exists; otherwise inspect it and record that remote execution remains unverified.

**Record:** Workflow path and validation status.

## H04 — Add manual image publication workflow

**Depends on:** H03.

**Goal:** Prepare for later sharing without publishing now.

**Do:** Add a separate workflow triggered only by `workflow_dispatch` or a `navigator-v*` tag. Build from the project root, add OCI labels, target GitHub Container Registry, and prepare `linux/amd64` and `linux/arm64` images. Require the normal checks first. Do not run it. Document that public distribution requires a final privacy and license review.

**Check:** Workflow build contexts use this repository only, respect `.dockerignore`, and cannot include local secrets or generated private data.

**Record:** Privacy boundary and workflow path.

---

# Phase I — Documentation and handoff

## I00 — Finish operational README

**Depends on:** H04.

**Goal:** Let a new person operate the service without this runbook.

**Do:** Expand the service README with prerequisites, host-Ollama quick start, portable container-Ollama fallback, stop, update, backup, restore, content editing, validation, troubleshooting, privacy, and image-building instructions. Explain that Markdown remains canonical, the compiled index is disposable, and host Ollama data is managed outside this project.

**Check:** Follow the README from a clean shell and confirm every command works or is explicitly marked optional.

**Record:** README walkthrough result.

## I01 — Document backup and recovery

**Depends on:** I00.

**Goal:** Make data loss boring.

**Do:** Document that canonical Markdown is the only irreplaceable project data. Explain how to back it up, rebuild SQLite from it, optionally preserve fallback-container model volumes, and recover after deleting all project Docker volumes. State that native host Ollama models are outside this project’s backup boundary. Do not describe the compiled database as authoritative.

**Check:** Delete a disposable test volume, rebuild, and confirm the corpus hash and search results match.

**Record:** Recovery test result.

## I02 — Document content contribution

**Depends on:** I01.

**Goal:** Make future agent-assisted growth safe.

**Do:** Document the smallest content change: copy a valid page, assign a stable ID and slug, fill required metadata, add sources, run validation, compile, inspect, and review the diff. Link `AGENT_CONTENT_CONTRACT.md`.

**Check:** Perform the workflow with a temporary test concept, then remove it and confirm the acceptance corpus returns to exactly eleven concepts.

**Record:** Contribution-workflow result.

## I03 — Verify the standalone README

**Depends on:** I02.

**Goal:** Make the entire standalone project understandable from its README.

**Do:** Verify the root `README.md` contains the product purpose, current status, architecture summary, quick start, local URL, content workflow, testing commands, privacy defaults, backup instructions, and publishing warning. Link this runbook as the build history and authority.

**Check:** Every local README link resolves and every command is defined by the project.

**Record:** README link and command check.

## I04 — Perform a security and privacy review

**Depends on:** I03.

**Goal:** Ensure the personal build is actually private by default.

**Do:** Confirm localhost binding, no public API ports, no secrets or private notes in images, no full user-context logging, no fixture provider in production, no writes to canonical Markdown from the API, and no root containers where avoidable.

Search tracked and image files for common credential patterns. Inspect image layers and Compose configuration.

**Check:** All review items pass. Any false positive is documented, not silently ignored.

**Record:** Security review summary.

## I05 — Run the final acceptance suite

**Depends on:** I04.

**Goal:** Prove the Definition of Done.

**Do:** Run, in order:

```bash
make check
./scripts/smoke.sh
# Run the Playwright command documented by the project.
docker compose config
OLLAMA_BASE_URL=http://ollama:11434 OLLAMA_MODEL=qwen3:8b \
  docker compose --profile container-ollama config
```

Then inspect Git diff for accidental files, secrets, generated databases, and changes outside the planned tree.

**Check:** Every command succeeds and every Definition of Done item below is true.

**Record:** Full final summary, remaining non-blocking limitations, and `COMPLETE` as the next action.

---

## 6. Definition of Done

The build is complete only when every statement is true.

### Repository safety

- [ ] The project is self-contained in the folder containing this runbook.
- [ ] No nested project folder was created.
- [ ] The build depends on no parent-directory files.
- [ ] No secrets, private notes, or research attachments enter an image.

### Canonical knowledge

- [ ] Markdown is authoritative.
- [ ] The schema validates every concept.
- [ ] Broken IDs, aliases, links, sources, categories, and relationships fail validation.
- [ ] The acceptance corpus contains exactly eleven Tier 1 concepts.
- [ ] AI-authored acceptance content is visibly marked `generated-draft`.

### Compiled index

- [ ] SQLite is built atomically from Markdown.
- [ ] FTS search handles titles, aliases, summaries, and body text.
- [ ] Graph JSON and sidebars are deterministic.
- [ ] The API opens SQLite read-only.

### Researcher experience

- [ ] A user can browse categories.
- [ ] One concept can appear in multiple categories without duplicate pages.
- [ ] A user can find `convolutional layer` by searching `conv layer`.
- [ ] A concept page shows progressive explanation, provenance, review state, sources, and typed relationships.
- [ ] A user can inspect a bounded graph neighborhood.
- [ ] A user can submit an `unstick` question with optional context.
- [ ] Assistance separates interpretation, candidates, assumptions, disqualifiers, missing information, next checks, citations, and confidence.
- [ ] Model and retrieval failures are honest and useful.

### Containers

- [ ] Core mode starts with `docker compose up --build -d`.
- [ ] Ordinary mode reaches host Ollama through `host.docker.internal` and uses `qwen3.8:27b-mlx`.
- [ ] The portable `container-ollama` fallback configuration is valid and publishes no Ollama port.
- [ ] Only the web port is published.
- [ ] The default binding is localhost.
- [ ] Health checks and clean shutdown work.
- [ ] Canonical Markdown can rebuild all derived knowledge data.

### Quality

- [ ] `make check` passes.
- [ ] Docker smoke test passes twice.
- [ ] Five browser journeys pass.
- [ ] Both Docker images build from the project root.
- [ ] The security and privacy review passes.
- [ ] `BUILD_STATE.md` contains enough evidence for a new agent to verify completion.

---

## 7. What happens after v1

Do not implement these during this runbook. Record them only as possible future work:

1. Evaluate the product using real research obstacles.
2. Improve retrieval only when observed failures justify it.
3. Add embeddings only if lexical search plus graph traversal is insufficient.
4. Connect Hermes to the content proposal and review workflow after Hermes is installed and its actual interface is known.
5. Expand canonical content through reviewed research journeys, not raw page count.
6. Consider public packaging only after removing any repository coupling and completing a license and privacy review.

---

## 8. Stable official references

- Docusaurus installation and Node requirements: <https://docusaurus.io/docs/installation>
- Docusaurus deployment model: <https://docusaurus.io/docs/deployment>
- Docker Compose documentation: <https://docs.docker.com/compose/>
- Ollama API introduction: <https://docs.ollama.com/api/introduction>

The runbook is authoritative when a tutorial or blog disagrees with its product decisions. Official documentation is authoritative for tool syntax that has changed since this file was written.

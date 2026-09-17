# KNOWLEDGE NAVIGATOR — VERSION 2 CONTINUATION RUNBOOK

**Purpose:** Give this one file to a capable coding agent inside the already-completed Knowledge Navigator repository.

**Starting point:** Version 1 is complete at commit `0b454cf` or a descendant containing the same completed system.

**Version 2 outcome:** Turn the excellent eleven-page vertical slice into a living personal research instrument without weakening the trusted v1 foundation. Version 2 adds the broad atlas and coverage backlog, private research workspaces, local artifact context, deterministic comparisons and learning paths, a reviewable content-proposal workflow, and a real Hermes handoff. It does **not** silently publish AI output or fill the wiki with unreviewed full articles.

---

## 0. Prompt to give the builder

Copy the block below as the builder's entire initial prompt:

```text
Read KNOWLEDGE_NAVIGATOR_V2_BUILD_RUNBOOK.md completely, then read KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md, BUILD_STATE.md, README.md, and AGENT_CONTENT_CONTRACT.md completely.

Treat this folder as the complete project root. Version 1 is a finished dependency, not something to rebuild. If V2_BUILD_STATE.md does not exist, begin at J00. Otherwise begin at the first V2 checkpoint not recorded as complete.

Complete V2 checkpoints in order. Run every CHECK. Update V2_BUILD_STATE.md after every checkpoint. Preserve every passing v1 behavior and keep the working product usable at each phase boundary.

Continue automatically until the V2 Definition of Done passes or the retry rule identifies a genuine external blocker. Do not stop merely to report progress. Do not ask me to choose libraries, architecture, schemas, names, ports, models, or scope; those decisions are frozen here.

Do not access parent directories. Do not publish, push, deploy, install or update Hermes, alter global Hermes configuration, enable cloud services, or weaken tests to make them pass. Do not add broad Tier 1 content merely to make the atlas look full. AI-generated canonical changes must remain generated-draft and reviewable.
```

---

## 1. Why this runbook exists

Version 1 deliberately proved the engine with eleven connected pages. It succeeded. It did **not** implement the complete product vision.

Version 2 closes the most important product gaps:

1. The atlas acknowledges the larger universe of mathematics, AI, and programming even when full pages do not exist.
2. Missing concepts and unresolved references become a visible editorial backlog.
3. A researcher can keep private projects, sessions, notes, familiarity, saved evidence, and selected assistant results.
4. Local papers and text/code artifacts can be supplied as private context without becoming canonical knowledge.
5. Compare and Path become real deterministic product capabilities rather than only prompt modes.
6. Hermes can receive a bounded content task in an isolated worktree and return it for human review.
7. The researcher can export useful results back to active work.

Version 2 remains personal, local-first, single-user, Docker-first, and private by default.

---

## 2. Execution rules

1. Read this file completely before editing anything.
2. Read the completed v1 runbook, `BUILD_STATE.md`, `README.md`, and `AGENT_CONTENT_CONTRACT.md` before J00.
3. Work in the existing repository. Never create a nested project folder.
4. Do not rewrite working v1 subsystems when an additive change is sufficient.
5. Each checkpoint depends on the checkpoint named in its **Depends on** line.
6. Do not begin a checkpoint until its dependency is recorded complete in `V2_BUILD_STATE.md`.
7. Run the checkpoint's **CHECK** before marking it complete.
8. Record the exact command and a short result in `V2_BUILD_STATE.md`.
9. If a check fails, repair the current checkpoint. Do not delete, skip, loosen, or rewrite the check to make it green.
10. Make the smallest change that satisfies the current checkpoint.
11. Keep the repository clean at every phase boundary.
12. Make one local commit after each completed phase when Git identity is configured.
13. Never push, publish, deploy, tag a release, or upload an image.
14. Never read from or write to a parent directory.
15. Never modify `~/.hermes`, start a Hermes gateway, create a Hermes project or board, or dispatch a Hermes task during automated checks.
16. Never execute code contained in an uploaded artifact.
17. Never make candidate atlas entries or private research material part of assistant grounding unless the researcher explicitly selects private material for that request.
18. Never let an agent promote its own canonical work above `generated-draft`.
19. Never automatically apply a proposal to canonical content.
20. If context is lost, reread this file, `V2_BUILD_STATE.md`, and the latest test output. Do not reconstruct the plan from memory.

### Retry rule

When something fails:

1. Read the complete error.
2. Attempt one direct fix.
3. Run the same check again.
4. Repeat for at most three real attempts.
5. If the same external blocker remains, record it in `V2_BUILD_STATE.md`, leave the checkpoint incomplete, and stop safely.

A coding error, failing test, schema mistake, missing migration, or misunderstood existing code is **not** an external blocker. An unavailable package registry, missing Docker daemon, corrupt external binary, or protected port owned by another service can be an external blocker.

---

## 3. Frozen decisions

| Decision                          | Version 2 choice                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Existing stack                    | Preserve TypeScript, npm workspaces, Docusaurus, Fastify, SQLite, Cytoscape.js, Docker Compose, nginx, Ollama               |
| Public address                    | Continue using `http://127.0.0.1:3000`                                                                                      |
| Canonical full/stub pages         | Markdown in `content/concepts/`                                                                                             |
| Graph-only canonical identities   | YAML files in `content/graph-only/`                                                                                         |
| Curated broad atlas               | `content/atlas.yaml`                                                                                                        |
| Candidate status                  | Atlas candidates are editorial leads, not canonical knowledge and not assistant evidence                                    |
| Canonical compiled database       | `data/knowledge.db`, opened read-only by the API exactly as in v1                                                           |
| Private personal database         | `/private/personal.db` in containers and `data/personal.db` locally, writable only through explicit personal-data endpoints |
| Canonical DB schema version       | Increment from 1 to 2                                                                                                       |
| Personal DB schema version        | Begin at 1 and migrate with `PRAGMA user_version`                                                                           |
| Personal identifiers              | UUIDs from `crypto.randomUUID()`                                                                                            |
| Personal timestamps               | UTC ISO 8601 strings                                                                                                        |
| Private data persistence          | Dedicated Docker volume mounted only into the API container                                                                 |
| Private data in Git               | Never; database, exports, artifacts, and proposal workspaces remain ignored                                                 |
| Assistant question storage        | Never automatic; save only after an explicit user action                                                                    |
| Uploaded artifact storage         | Store extracted text, hash, metadata, and user label; do not retain original binary bytes                                   |
| Artifact formats                  | Plain-text/code formats, Markdown, LaTeX, Lean, JSON, CSV, Jupyter notebooks, and text-based PDFs                           |
| PDF extraction                    | `pdfjs-dist@6.3.289`; no OCR and no image extraction in v2                                                                  |
| Multipart handling                | `@fastify/multipart@10.1.1`                                                                                                 |
| Artifact limits                   | 10 MiB upload, 300 PDF pages, 200,000 extracted characters, 60-second extraction timeout                                    |
| Retrieval                         | Preserve lexical FTS plus graph traversal; no embeddings in v2 without a measured failure gate                              |
| Comparison                        | Deterministic evidence table first; optional grounded assistant synthesis second                                            |
| Learning path                     | Deterministic shortest path over prerequisite relationships, adjusted by explicit familiarity                               |
| Hermes                            | Use the installed `hermes` CLI contract; do not install, update, configure, or execute it during normal builds/tests        |
| Hermes execution                  | Human-triggered only, isolated worktree, local-only completion contract, review required                                    |
| Proposal storage                  | `.navigator/proposals/`, ignored by Git and excluded from Docker contexts                                                   |
| Proposal acceptance               | Human-only CLI action with explicit proposal id and a clean-tree requirement                                                |
| Authentication                    | None; localhost-only personal product remains the security boundary                                                         |
| Public hosting                    | Still out of scope                                                                                                          |
| Multiple users                    | Still out of scope                                                                                                          |
| Automatic canonical publication   | Forbidden                                                                                                                   |
| Automatic broad Tier 1 generation | Forbidden                                                                                                                   |
| Mobile app/browser extension      | Out of scope                                                                                                                |

### Meaning of coverage tiers

These are content depths, not product versions:

- **Tier 1:** complete reader-facing page using the full required template.
- **Tier 2:** concise reader-facing stub with definition, relationships, categories, and sources.
- **Tier 3:** graph-only canonical identity with stable id, title, aliases, kind, summary, categories, and relationships. It has no reader-facing article.
- **Candidate:** an atlas or backlog item that has not yet been accepted as a canonical identity. A candidate is not Tier 3 and cannot ground an answer.

---

## 4. Version 2 product contracts

### 4.1 Atlas contract

`content/atlas.yaml` is shared, version-controlled editorial structure. It contains:

```yaml
schema_version: 1
areas:
  - area_id: atlas.mathematics
    title: Mathematics
    categories:
      - category_id: atlas.mathematics.analysis
        title: Analysis
        parent_id: atlas.mathematics
candidates:
  - candidate_id: candidate.mathematics.analysis.fourier_analysis
    title: Fourier Analysis
    aliases: []
    categories:
      - atlas.mathematics.analysis
    status: candidate
    canonical_concept_id: null
    note: null
```

Rules:

- `schema_version` is exactly `1`.
- IDs are lowercase dotted identifiers.
- Exactly three root areas exist: Mathematics, Artificial Intelligence, Programming.
- Every category has one parent except a root area.
- Category graphs are acyclic and connected to exactly one root.
- Candidate titles and aliases are unique after the same normalization used for canonical concepts.
- A candidate may belong to several categories and appears exactly once in the candidate list.
- Candidate status is one of `candidate`, `proposed-tier-3`, `covered`, or `deferred`.
- A `covered` candidate must resolve to exactly one canonical concept id.
- Candidates carry labels and editorial notes only. They do not carry factual summaries and are never treated as evidence.
- Empty categories remain visible in Coverage so unknown intellectual neighborhoods do not disappear merely because no page exists.

### 4.2 Graph-only identity contract

Tier 3 lives in `content/graph-only/<slug>.yaml`:

```yaml
concept_id: concept.example.stable_id
title: Stable Display Name
slug: /concepts/stable-display-name
aliases: []
kind: concept
tier: 3
review_state: generated-draft
summary: One cautious sentence saying what this identity denotes.
categories:
  - Mathematics/Example
primary_category: Mathematics/Example
relationships: []
sources: []
unresolved_references: []
claims: []
```

Rules:

- File name is the slug's final segment plus `.yaml`.
- A Tier 3 identity has no Markdown body and no Docusaurus route.
- Its title, aliases, id, and slug must not collide with a Tier 1 or Tier 2 page.
- It may participate in relationships and paths.
- It appears in Coverage and graph views with a clear `graph only` label.
- Clicking it opens an identity panel, not a fake article.
- Promoting Tier 3 to Tier 2 replaces the YAML file with a Markdown file in one reviewed change while preserving `concept_id` and `slug`.

### 4.3 Unresolved-reference contract

Tier 1 and Tier 2 frontmatter may include:

```yaml
unresolved_references:
  - label: Strided convolution
    reason: Needed to explain the alternative to pooling without inventing a link.
    sections:
      - variants-and-alternatives
    blocking: false
    proposed_kind: method
    proposed_categories:
      - Artificial Intelligence/Deep Learning — Architectures
```

Each item receives a deterministic compiled backlog id from the source concept id plus normalized label. It remains attached to its source page until resolved or deliberately deferred.

### 4.4 Claim and evidence contract

Claims are optional for existing generated drafts and required for any page promoted to `source-checked` after v2:

```yaml
claims:
  - claim_id: claim.resnet.degradation_problem
    section: history-and-attribution
    statement: Plain residual networks became harder to optimize as depth increased even when training error was measured.
    status: supported
    evidence:
      - source_id: paper.resnet.2015
        locator: Section 4.1, Figure 4
        note: Training-error comparison for plain networks.
```

Claim status is `supported`, `conditional`, `disputed`, or `unsupported`. Evidence locators are human-readable; the system does not pretend to parse or verify them automatically.

### 4.5 Personal-data contract

The private database contains these logical records:

- projects;
- research sessions;
- notes;
- concept familiarity;
- saved concepts, sources, comparisons, paths, checks, and assistant answers;
- artifacts containing extracted local text;
- export history containing metadata only.

Private data never changes canonical content and never enters `generated/graph.json`, sidebars, image layers, Git, or public packaging.

### 4.6 Familiarity levels

- `unfamiliar` — do not assume the concept is known.
- `recognize` — the name is familiar, but prerequisites may still be needed.
- `working` — explanations may skip basic orientation unless requested.
- `strong` — path construction may treat the concept as already known.

Only the researcher sets familiarity. The model may suggest a change but may not write it.

### 4.7 Compare contract

A comparison contains two to four canonical concepts and deterministic rows for:

- identity and review state;
- definition and summary;
- assumptions and requirements;
- uses and applicability;
- limitations and common mistakes;
- variants and alternatives;
- incoming and outgoing typed relationships;
- cited sources and evidence coverage.

Missing information is displayed as missing. It is never filled from model memory. Optional model synthesis receives exactly the table and selected private context and uses the existing citation-containment rules.

### 4.8 Path contract

Paths use only canonical nodes and these prerequisite semantics:

- outgoing `requires` means the target comes before the source;
- outgoing `prerequisite_of` means the source comes before the target;
- incoming edges are interpreted as the exact inverse;
- no other relationship type creates a prerequisite step.

The shortest path is deterministic. Ties sort by concept id. `strong` familiarity nodes may be treated as starting points; `working` nodes remain visible but are marked likely known. If no supported route exists, the product says so and lists the missing graph information instead of inventing a path.

### 4.9 Artifact contract

- Upload requires an explicit researcher action.
- Accepted text extensions: `.txt`, `.md`, `.markdown`, `.tex`, `.lean`, `.py`, `.rs`, `.c`, `.h`, `.cpp`, `.hpp`, `.java`, `.js`, `.jsx`, `.ts`, `.tsx`, `.go`, `.jl`, `.r`, `.m`, `.json`, `.yaml`, `.yml`, `.csv`, `.ipynb`, and `.pdf`.
- Jupyter notebooks contribute Markdown and code-cell source only; outputs and attachments are discarded.
- PDFs contribute text only. Scanned/image-only PDFs return `no_extractable_text`.
- No artifact content is rendered as HTML.
- No code is executed.
- Extraction stores SHA-256, original filename, media type, byte count, extracted character count, extraction warnings, and plain text.
- Duplicate hashes inside one project reuse the existing artifact.
- Artifact text enters an assistant request only when explicitly selected.

### 4.10 Hermes contract

Version 2 integrates with the installed CLI surface confirmed by `hermes --help`, `hermes project --help`, and `hermes kanban --help`.

The repository may generate a task bundle and may print or, with an explicit `--execute`, invoke a Hermes Kanban command. Automated checks use dry-run mode only.

A Hermes content task must:

- use a project-scoped isolated worktree;
- carry `completion-contract local-only`;
- name one candidate, unresolved reference, or revision target;
- load `AGENT_CONTENT_CONTRACT.md`;
- preserve stable identities;
- create only `generated-draft` content;
- run validation and focused tests;
- never merge, publish, push, or promote review state;
- end in Hermes review state with a concise verification summary.

---

## 5. Required Version 2 directory additions

```text
content/
├── atlas.yaml
├── concepts/                    existing Tier 1 and future Tier 2 Markdown
└── graph-only/                  Tier 3 YAML identities

.navigator/                      ignored local work area
├── proposals/
└── exports/

apps/api/src/personal/
apps/api/src/artifacts/
apps/api/src/routes/personal.ts
apps/api/src/routes/coverage.ts
apps/api/src/routes/compare.ts
apps/api/src/routes/paths.ts

apps/web/src/pages/coverage.tsx
apps/web/src/pages/backlog.tsx
apps/web/src/pages/workspace.tsx
apps/web/src/pages/compare.tsx
apps/web/src/pages/path.tsx

packages/core/src/atlas.ts
packages/core/src/coverage.ts
packages/core/src/evidence.ts
packages/core/src/compare.ts
packages/core/src/paths.ts
packages/core/src/proposals.ts

scripts/hermes-content-task.mjs
V2_BUILD_STATE.md
```

Small supporting files are allowed. Do not rename existing paths merely to match this diagram.

---

## 6. Phase J — Resume safely from completed v1

### J00 — Inventory the finished repository

**Depends on:** Completed v1.

**Goal:** Prove this is the intended completed repository before modifying it.

**Do:** Read the five authority documents named in the builder prompt. Record the current branch, HEAD, working-tree state, Node/npm/Docker versions, running Compose status, and whether `BUILD_STATE.md` says `COMPLETE`.

**CHECK:** The project root is the folder containing both runbooks; v1 is complete; no unrelated user files are at risk. A dirty working tree is a blocker unless every change is only this v2 runbook.

**Record:** HEAD, status, tool versions, and running-stack state.

### J01 — Create the v2 resume point

**Depends on:** J00.

**Goal:** Give every future agent one authoritative continuation state.

**Do:** Create `V2_BUILD_STATE.md` with exactly:

```markdown
# Knowledge Navigator Version 2 Build State

## Current checkpoint

## Completed checkpoints

## Last successful checks

## Blockers

## Important decisions

## Next action
```

State that v1 evidence remains in `BUILD_STATE.md` and must never be copied wholesale into this file.

**CHECK:** A new agent can identify J02 using only both runbooks and `V2_BUILD_STATE.md`.

**Record:** State file created.

### J02 — Capture the v1 regression baseline

**Depends on:** J01.

**Goal:** Make regression visible before adding v2.

**Do:** Run `make check`, `npm run test:browser`, and `./scripts/smoke.sh`. Save only command names and summaries in the state file; do not commit bulky output.

**CHECK:** Every existing v1 check passes without source changes.

**Record:** Test counts, browser journey count, and smoke count.

### J03 — Add v2 local-data boundaries

**Depends on:** J02.

**Goal:** Prevent private data and agent proposals from entering Git or Docker images.

**Do:** Add `.navigator/`, `data/personal.db*`, private exports, uploaded originals, and extraction temporaries to `.gitignore` and `.dockerignore`. Keep version-controlled `content/atlas.yaml` and `content/graph-only/` included.

**CHECK:** `git check-ignore` proves every private path is ignored and every canonical v2 path is trackable.

**Record:** Ignore-boundary results.

### J04 — Add empty canonical v2 directories

**Depends on:** J03.

**Goal:** Establish locations without inventing content.

**Do:** Add `content/graph-only/.gitkeep`. Do not create Tier 2 or Tier 3 concepts yet.

**CHECK:** Directory exists, is trackable, and v1 validation still reports exactly eleven Tier 1 pages.

**Record:** Corpus counts.

### J05 — Commit Phase J

**Depends on:** J04.

**Goal:** Preserve the verified starting point.

**Do:** Inspect the diff, confirm no private data or generated database is staged, and commit `Phase J: begin the living navigator`.

**CHECK:** Working tree is clean and all J checkpoints are recorded.

**Record:** Commit hash.

---

## 7. Phase K — Represent the atlas, graph-only identities, and evidence

### K00 — Define the atlas schema

**Depends on:** J05.

**Goal:** Validate the broad map independently from canonical articles.

**Do:** Implement the exact §4.1 contract in `packages/core/src/atlas.ts` with Zod. Reject unknown keys, duplicate normalized names, missing parents, cycles, candidates without categories, invalid status transitions, and a covered candidate without one canonical concept id.

**CHECK:** Tests include one valid atlas and one failing case for every rule; all errors are returned in one deterministic run.

**Record:** Atlas test count.

### K01 — Add the three-area atlas seed

**Depends on:** K00.

**Goal:** Make the intended intellectual universe visible without pretending it is already explained.

**Do:** Create `content/atlas.yaml` from Appendix A. Preserve every named area, category, and candidate label. Do not write summaries or factual claims. Existing canonical concepts may mark matching candidates `covered`; all other entries begin `candidate`.

**CHECK:** All three root areas exist, Programming is visible even with zero canonical pages, every Appendix A label is represented once after normalization, and exactly the existing eleven concepts are covered.

**Record:** Area, category, candidate, covered, and uncovered counts.

### K02 — Define graph-only identity files

**Depends on:** K01.

**Goal:** Give Tier 3 a true non-page representation.

**Do:** Implement the §4.2 YAML loader and schema. Share identity and relationship validation with Markdown concepts rather than duplicating rules.

**CHECK:** Tests prove a valid Tier 3 file loads, a body or wrong tier is rejected, file/slug mismatch is rejected, and a collision with Markdown fails corpus validation.

**Record:** Tier 3 test result.

### K03 — Extend kinds without changing existing pages

**Depends on:** K02.

**Goal:** Represent the non-concept objects promised by the product vision.

**Do:** Add `paper`, `person`, `historical-event`, `dataset`, and `benchmark` to `conceptKinds`. Keep all existing kinds and ids unchanged. Do not create instances merely to exercise the enum.

**CHECK:** Schema tests cover every added kind; existing corpus hash remains unchanged before any canonical content change.

**Record:** Kind enumeration and compatibility result.

### K04 — Add unresolved-reference metadata

**Depends on:** K03.

**Goal:** Turn dangling intellectual dependencies into an explicit backlog.

**Do:** Add the §4.3 field to Tier 1, Tier 2, and Tier 3 schemas. Normalize labels, reject duplicates within one identity, validate section names, and require proposed categories to exist in the atlas.

**CHECK:** Tests prove valid references compile and malformed, duplicate, or unknown-category entries fail with file and field paths.

**Record:** Unresolved-reference tests.

### K05 — Add claims and evidence locators

**Depends on:** K04.

**Goal:** Support claim-level evidence without forcing a migration of generated drafts.

**Do:** Implement §4.4. Claims default to an empty array. Require claim ids to be globally unique, evidence source ids to exist on that identity, and `source-checked`, `expert-reviewed`, or `formally-verified` pages created or modified after v2 to have at least one claim for every nonempty substantive section. Existing generated drafts remain valid.

**CHECK:** Tests cover supported, conditional, disputed, unsupported, missing-source, duplicate-id, and review-promotion cases.

**Record:** Evidence test result.

### K06 — Load one mixed corpus

**Depends on:** K05.

**Goal:** Validate Markdown pages and graph-only identities together.

**Do:** Extend `loadCorpus()` and `validateCorpus()` to load both directories, keep deterministic file ordering, detect every cross-format collision, validate relationship targets across both formats, and return atlas coverage metadata separately from canonical identities.

**CHECK:** A fixture with Tier 1, Tier 2, and Tier 3 succeeds; cross-format duplicate ids, slugs, aliases, and broken relationships fail in one run.

**Record:** Mixed-corpus test counts.

### K07 — Update generated schemas and the content contract

**Depends on:** K06.

**Goal:** Keep machine and human contracts aligned.

**Do:** Regenerate JSON schemas for Markdown metadata, graph-only identities, and the atlas. Update `AGENT_CONTENT_CONTRACT.md` with candidate versus canonical status, unresolved references, claims, Tier 3 promotion, and the prohibition on using atlas labels as evidence.

**CHECK:** Two schema generations are byte-identical; a scripted audit confirms the written contract matches executable enums and required fields.

**Record:** Schema sizes and contract audit.

### K08 — Prove v1 compatibility

**Depends on:** K07.

**Goal:** Ensure the richer model does not rewrite the original corpus.

**Do:** Run validation against the untouched eleven pages and compare their file hashes with the J02 baseline.

**CHECK:** Eleven Tier 1, zero Tier 2, zero Tier 3, zero validation errors, and no original content file changed.

**Record:** Counts and hash comparison.

### K09 — Commit Phase K

**Depends on:** K08.

**Goal:** Preserve the canonical model upgrade.

**Do:** Run format, lint, typecheck, and focused tests. Commit `Phase K: model coverage and evidence`.

**CHECK:** Working tree clean; no private data staged.

**Record:** Commit hash and test summary.

---

## 8. Phase L — Compile coverage and evidence deterministically

### L00 — Migrate the compiled schema to version 2

**Depends on:** K09.

**Goal:** Store new shared knowledge without changing the read-only runtime rule.

**Do:** Increment `SCHEMA_VERSION` to 2. Add tables for atlas categories, atlas candidates, unresolved references, claims, claim evidence, and canonical identity format. Preserve existing tables and queries.

**CHECK:** A fresh compile creates schema version 2 with all required tables and empty foreign-key/integrity checks.

**Record:** Table and index list.

### L01 — Compile the complete atlas

**Depends on:** L00.

**Goal:** Preserve empty areas and categories in the compiled product.

**Do:** Insert every atlas area, category, parent edge, candidate, candidate-category membership, status, and optional canonical mapping. Sort by stable id.

**CHECK:** Programming and its categories exist even with zero canonical pages; every covered candidate resolves to exactly one concept.

**Record:** Atlas row counts.

### L02 — Compile graph-only identities

**Depends on:** L01.

**Goal:** Make Tier 3 traversable without creating fake articles.

**Do:** Insert Tier 3 identities into concepts, aliases, categories, and relationships with `content_format = graph-only`; do not insert an FTS body or Docusaurus page.

**CHECK:** A temporary Tier 3 fixture appears in graph queries, never in sidebars, and has no reader URL response. Remove it after the test.

**Record:** Tier 3 acceptance result.

### L03 — Compile the editorial backlog

**Depends on:** L02.

**Goal:** Combine atlas gaps and unresolved references without conflating them.

**Do:** Build deterministic queries returning candidate items, unresolved-reference items, covered status, incoming-reference count, blocking count, source concepts, and suggested categories.

**CHECK:** A fixture with the same unresolved label from two source pages produces one normalized backlog group with two source records; an atlas candidate remains distinguishable from it.

**Record:** Backlog query result.

### L04 — Compile claims and evidence

**Depends on:** L03.

**Goal:** Make evidential support inspectable.

**Do:** Insert claim rows and evidence locators with foreign keys to concepts and sources. Preserve status and section.

**CHECK:** Unsupported claims can exist only when visibly marked unsupported; evidence cannot point at an absent source; a source can support several claims.

**Record:** Evidence row counts.

### L05 — Extend graph JSON safely

**Depends on:** L04.

**Goal:** Give the browser coverage metadata without leaking private data.

**Do:** Add identity format, coverage tier, article availability, atlas status, and aggregate coverage counts to generated graph JSON. Do not include personal records, artifact text, proposal content, or evidence notes longer than needed for display.

**CHECK:** JSON schema/type tests pass and a search for private-table field names returns nothing.

**Record:** Graph counts and privacy audit.

### L06 — Add coverage CLI commands

**Depends on:** L05.

**Goal:** Inspect coverage without opening the site.

**Do:** Add:

```text
navigator coverage summary
navigator coverage candidates [--area <id>] [--status <status>]
navigator coverage unresolved [--blocking]
navigator evidence <concept-id-or-slug>
```

Return stable JSON with `--json`; default output is readable text.

**CHECK:** CLI process tests cover valid filters, empty results, bad ids, and deterministic ordering.

**Record:** CLI acceptance result.

### L07 — Preserve atomic and deterministic compilation

**Depends on:** L06.

**Goal:** Keep v1's strongest data guarantee.

**Do:** Include new tables and files in all pre-rename validation. Keep the previous valid database, graph JSON, and sidebars byte-identical after any atlas, Tier 3, backlog, claim, or evidence failure.

**CHECK:** Two builds with identical input and `SOURCE_DATE_EPOCH` are byte-identical. Five deliberately broken v2 fixtures leave prior outputs untouched.

**Record:** Determinism and atomic-failure result.

### L08 — Commit Phase L

**Depends on:** L07.

**Goal:** Preserve the compiled shared-knowledge upgrade.

**Do:** Run all core tests and `make check`. Commit `Phase L: compile coverage and evidence`.

**CHECK:** Working tree clean and v1 journeys still pass.

**Record:** Commit hash and total test count.

---

## 9. Phase M — Expose Coverage and Backlog

### M00 — Add read-only coverage endpoints

**Depends on:** L08.

**Goal:** Serve the atlas without making it writable through HTTP.

**Do:** Add:

```text
GET /api/coverage/summary
GET /api/coverage/atlas
GET /api/coverage/candidates
GET /api/coverage/unresolved
GET /api/evidence/:conceptId
```

Validate filters and cap list responses at 500 items with pagination.

**CHECK:** API tests cover healthy, empty, filtered, invalid, paginated, and unavailable-index states. No endpoint writes the canonical database.

**Record:** Endpoint test result.

### M01 — Build the Coverage page shell

**Depends on:** M00.

**Goal:** Show the difference between the universe, mapped identities, and full explanations.

**Do:** Add `/coverage`. Show all three areas and counts for candidates, Tier 3, Tier 2, Tier 1, and review states. Explain candidate versus canonical status in plain language.

**CHECK:** Programming renders even with zero canonical pages; screen readers receive the same counts; narrow layout has no horizontal overflow.

**Record:** Browser acceptance result.

### M02 — Build the complete atlas outline

**Depends on:** M01.

**Goal:** Let the researcher browse empty and covered neighborhoods.

**Do:** Render the atlas hierarchy with filters for coverage state and review state. Candidate entries open an editorial detail panel, not a concept article. Canonical entries link to their canonical destination or identity panel.

**CHECK:** Every atlas category and candidate is reachable by keyboard. No candidate URL pretends to be an article.

**Record:** Atlas journey result.

### M03 — Build the Backlog page

**Depends on:** M02.

**Goal:** Make missing knowledge actionable.

**Do:** Add `/backlog` with separate views for atlas candidates and unresolved references. Sort unresolved items by blocking first, then incoming source count, then title. Provide filters only; do not add HTTP mutation.

**CHECK:** A seeded test fixture shows two source pages behind one normalized unresolved item and preserves links to both sources.

**Record:** Backlog journey result.

### M04 — Add graph-only identity panels

**Depends on:** M03.

**Goal:** Make Tier 3 useful without displaying an empty article.

**Do:** Provide a panel or page route under `/identity/<concept-id>` showing summary, aliases, categories, relationships, review state, and a clear `No article yet` message.

**CHECK:** Tier 3 identity is searchable as graph metadata only, opens the identity view, and never appears in the Docusaurus sidebar.

**Record:** Tier 3 browser result.

### M05 — Display claim-level evidence

**Depends on:** M04.

**Goal:** Let researchers inspect why a claim is supported.

**Do:** On concept pages with claims, show claim status, statement, evidence source, locator, and note. Pages without claim metadata keep the existing source display and state that claim-level mapping is not yet present.

**CHECK:** Supported, disputed, conditional, unsupported, and absent-claim states are visually and textually distinct.

**Record:** Evidence UI result.

### M06 — Update navigation without crowding it

**Depends on:** M05.

**Goal:** Make new capabilities findable.

**Do:** Add `Coverage` to the main navigation. Link Backlog from Coverage rather than adding another top-level item. Keep existing Home, Explore, Search, Ask, and About behavior.

**CHECK:** All routes are reachable by keyboard from Home and the mobile header remains usable.

**Record:** Navigation journey.

### M07 — Commit Phase M

**Depends on:** M06.

**Goal:** Preserve the broad-map experience.

**Do:** Run web build, browser journeys at 1280×900 and 360×780 in light and dark modes, lint, format, types, and API tests. Commit `Phase M: expose the coverage map`.

**CHECK:** No console errors, broken links, missing labels, or overflow.

**Record:** Commit and browser results.

---

## 10. Phase N — Add the private personal-data layer

### N00 — Create the separate personal database

**Depends on:** M07.

**Goal:** Add private writable state without weakening canonical read-only guarantees.

**Do:** Create `apps/api/src/personal/` with an opener for `PERSONAL_DATABASE_PATH`, default `/private/personal.db` in containers and `data/personal.db` locally. Enable WAL, foreign keys, busy timeout, and `PRAGMA user_version = 1`.

**CHECK:** Canonical `knowledge.db` still rejects writes; personal DB accepts a transaction; paths and contents never appear in health responses or logs.

**Record:** Dual-database test result.

### N01 — Add the personal schema and migrations

**Depends on:** N00.

**Goal:** Make private state recoverable and forward-migratable.

**Do:** Create normalized tables for projects, sessions, notes, familiarity, saved items, artifacts, and export history. Add created/updated timestamps, archive timestamps where applicable, foreign keys, and useful indexes. Run migrations transactionally.

**CHECK:** Fresh creation, idempotent reopen, upgrade fixture, failed-migration rollback, and foreign-key tests pass.

**Record:** Personal schema version and tables.

### N02 — Implement project storage

**Depends on:** N01.

**Goal:** Group private research activity.

**Do:** Add repository functions to create, list, inspect, rename, describe, archive, and restore projects. Title max 200; description max 8,000. Archive instead of hard delete.

**CHECK:** CRUD-with-archive tests pass and archived projects are excluded by default but recoverable.

**Record:** Project tests.

### N03 — Implement research sessions

**Depends on:** N02.

**Goal:** Preserve selected research journeys without logging every question automatically.

**Do:** A session belongs to one project and contains a title, optional starting question, optional context summary, and timestamps. Creation is explicit. Assistant requests do not create sessions automatically.

**CHECK:** Tests prove an ordinary Ask request leaves session count unchanged; explicit save creates exactly one session.

**Record:** Session privacy result.

### N04 — Implement notes

**Depends on:** N03.

**Goal:** Keep private annotations linked to work and knowledge.

**Do:** Notes may link to a project, session, canonical concept, saved item, or artifact. Store plain Markdown source, never rendered HTML. Maximum 64 KiB. Support edit, archive, and restore.

**CHECK:** Validation, ownership, archive, and HTML-escaping tests pass.

**Record:** Note tests.

### N05 — Implement familiarity

**Depends on:** N04.

**Goal:** Let the researcher explicitly describe what they know.

**Do:** Store at most one familiarity record per canonical concept with the four §4.6 levels and an optional 1,000-character note.

**CHECK:** Upsert, clear, invalid-level, unknown-concept, and list-by-level tests pass.

**Record:** Familiarity tests.

### N06 — Implement saved items

**Depends on:** N05.

**Goal:** Save useful evidence and results deliberately.

**Do:** Support `concept`, `source`, `assistant-answer`, `comparison`, `path`, and `next-check` item types. Store a versioned JSON payload validated separately for each type. An assistant answer includes model, mode, depth, timestamp, resolved citations, and the exact structured result the API returned.

**CHECK:** Round-trip tests cover each type and reject unknown fields or fabricated canonical ids.

**Record:** Saved-item tests.

### N07 — Add personal API endpoints

**Depends on:** N06.

**Goal:** Expose only explicit private-data actions.

**Do:** Add versioned JSON endpoints under `/api/personal/` for projects, sessions, notes, familiarity, and saved items. Use POST/PATCH for changes and archive/restore actions instead of DELETE.

**CHECK:** Route tests cover validation, not-found, cross-project ownership, archive visibility, rate limiting, and structured errors.

**Record:** Personal API tests.

### N08 — Remove personal content from logs

**Depends on:** N07.

**Goal:** Extend v1 privacy to every new field.

**Do:** Redact project titles/descriptions, note bodies, artifact names/text, session questions/context, export contents, and saved answer text. Log request id, route, status, latency, byte counts, and record counts only.

**CHECK:** Capture logs from every personal endpoint and assert that unique sentinel strings never appear.

**Record:** Redaction audit.

### N09 — Commit Phase N

**Depends on:** N08.

**Goal:** Preserve the private-data foundation.

**Do:** Run API tests, security checks, v1 regression suite, and inspect staged files for personal data. Commit `Phase N: add private research storage`.

**CHECK:** `data/personal.db` is ignored and absent from the commit.

**Record:** Commit hash and security result.

---

## 11. Phase O — Build the research workspace

### O00 — Add Workspace navigation and empty state

**Depends on:** N09.

**Goal:** Give private work one obvious home.

**Do:** Add `/workspace` and a `Workspace` main-nav link. Explain that workspace data is local, private, replaceable only from backups, and separate from canonical knowledge.

**CHECK:** Empty state is clear, keyboard accessible, and does not expose a database path.

**Record:** Empty-state journey.

### O01 — Build project creation and listing

**Depends on:** O00.

**Goal:** Start and revisit research contexts.

**Do:** Add project create, rename, archive, restore, and list UI. Require confirmation only for archive; restoration remains available.

**CHECK:** Browser journey creates, renames, archives, reveals archived, restores, and reloads a project.

**Record:** Project journey.

### O02 — Build the project detail view

**Depends on:** O01.

**Goal:** Gather sessions, notes, saved evidence, and artifacts in one place.

**Do:** A project view contains Overview, Sessions, Notes, Saved, Artifacts, and Export sections. Use one route with accessible tabs or headings; do not build a SPA router inside it.

**CHECK:** Every section works without JavaScript-only focus traps and has a meaningful empty state.

**Record:** Project detail inspection.

### O03 — Add private concept notes

**Depends on:** O02.

**Goal:** Annotate canonical knowledge without modifying it.

**Do:** Add `Add private note` to concept pages. Require a project selection. Render saved Markdown as escaped text with safe Markdown rules; never allow raw HTML.

**CHECK:** A note survives reload, appears in its project and on the concept for that project, and does not change the corpus hash.

**Record:** Note journey and unchanged corpus hash.

### O04 — Add familiarity controls

**Depends on:** O03.

**Goal:** Make knowledge state explicit and correctable.

**Do:** Add the four familiarity levels to concept and graph-only identity views. Include `Not set`; changing or clearing is one action.

**CHECK:** The state survives reload and is never inferred from page visits.

**Record:** Familiarity journey.

### O05 — Save concepts and sources

**Depends on:** O04.

**Goal:** Carry evidence into active work.

**Do:** Add explicit `Save to project` actions for concepts and source citations. Show what will be saved before the action. Do not save merely because an item was opened.

**CHECK:** Opening leaves counts unchanged; clicking save adds exactly one deduplicated item.

**Record:** Save journey.

### O06 — Save assistant results explicitly

**Depends on:** O05.

**Goal:** Preserve useful guidance without building surveillance history.

**Do:** After an answer, allow `Save result to project`. Save the structured result, citations, mode, depth, model, timestamp, and selected artifact ids. Do not save raw context unless the researcher also chooses `Save context summary`.

**CHECK:** An unsaved answer disappears after reload; a saved answer reappears in the project with citations intact.

**Record:** Assistant-save journey.

### O07 — Create and reopen sessions

**Depends on:** O06.

**Goal:** Continue a selected research journey.

**Do:** A project may create a named session. Ask can attach a new saved result to that session. Reopening shows notes, saved results, paths, comparisons, and selected artifacts; it does not reconstruct an unbounded chat transcript.

**CHECK:** Two sessions in one project remain isolated and reopen deterministically.

**Record:** Session journey.

### O08 — Commit Phase O

**Depends on:** O07.

**Goal:** Preserve the usable private workspace.

**Do:** Run browser journeys, API tests, accessibility checks, and v1 regression tests. Commit `Phase O: build the research workspace`.

**CHECK:** No console errors or private strings in logs.

**Record:** Commit hash and journey counts.

---

## 12. Phase P — Ingest local research context safely

### P00 — Pin ingestion dependencies

**Depends on:** O08.

**Goal:** Add only the libraries needed for bounded local extraction.

**Do:** Add exact versions `@fastify/multipart@10.1.1` and `pdfjs-dist@6.3.289` to the API workspace. Do not add OCR, image, office-document, or arbitrary parser frameworks.

**CHECK:** `npm install`, `npm ls`, typecheck, and existing tests pass under Node 22.

**Record:** Installed versions.

### P01 — Add artifact records

**Depends on:** P00.

**Goal:** Store extracted context separately from canonical knowledge.

**Do:** Implement artifact repository functions using the §4.9 metadata. Artifact belongs to one project; duplicate SHA-256 in the same project reuses the record. Archive/restore instead of hard delete.

**CHECK:** Create, deduplicate, archive, restore, and ownership tests pass.

**Record:** Artifact storage tests.

### P02 — Extract plain-text and code files

**Depends on:** P01.

**Goal:** Accept useful local context without executing it.

**Do:** Decode UTF-8 with invalid-byte replacement and normalize newlines. Reject binary-looking content, null bytes, unsupported extensions, over-limit files, and empty extraction. Store plain text only.

**CHECK:** Fixtures cover every allowed extension group plus binary, oversized, empty, and invalid-UTF-8 cases. No fixture is executed.

**Record:** Text extraction tests.

### P03 — Extract Jupyter notebooks

**Depends on:** P02.

**Goal:** Use notebook source without retaining output blobs.

**Do:** Parse JSON. Preserve Markdown and code-cell source in cell order with headings identifying cell type and index. Drop outputs, attachments, execution counts, widget state, and metadata except language name.

**CHECK:** A fixture with embedded base64 output yields no output bytes or secret sentinel in extracted text.

**Record:** Notebook extraction result.

### P04 — Extract text PDFs

**Depends on:** P03.

**Goal:** Accept papers locally without pretending OCR exists.

**Do:** Use `pdfjs-dist` in the API process. Enforce byte, page, character, and timeout limits. Join page text with explicit page markers. Never follow embedded links or execute actions. Return extraction warnings and `no_extractable_text` for scanned PDFs.

**CHECK:** Tests cover a small text PDF, encrypted PDF, malformed PDF, image-only PDF, page limit, character limit, and timeout.

**Record:** PDF extraction tests.

### P05 — Add bounded upload endpoints

**Depends on:** P04.

**Goal:** Send selected local context to the local service safely.

**Do:** Add multipart upload and artifact list/detail/archive/restore endpoints under one project. Stream with a 10 MiB hard limit. Do not log filename or contents. Reject MIME/extension disagreement when unsafe.

**CHECK:** API tests cover success, limits, unsupported type, duplicate, cross-project access, and sentinel-log redaction.

**Record:** Upload API tests.

### P06 — Build artifact UI

**Depends on:** P05.

**Goal:** Let the researcher inspect what the system extracted.

**Do:** Add upload, progress, warnings, metadata, safe plain-text preview, archive, and restore to the project Artifacts section. Require explicit file selection; never scan directories.

**CHECK:** Browser journey uploads text and PDF fixtures, previews extraction, reloads, archives, and restores them.

**Record:** Artifact journey.

### P07 — Add selected artifact context to Ask

**Depends on:** P06.

**Goal:** Ground a question in private work without silently sending everything.

**Do:** Ask may select a project, session, and up to five artifacts or notes. Show selected names and extracted character counts. Apply a separate private-context budget, report truncation, and pass only selected extracted text to the local provider.

**CHECK:** Unselected material never appears in the provider prompt; selected material does; no private material appears in retrieved canonical evidence or citations.

**Record:** Prompt containment tests.

### P08 — Add private-context provenance

**Depends on:** P07.

**Goal:** Separate canonical evidence from researcher-supplied context.

**Do:** Assistant results show a `Private context used` section listing selected artifact/note ids and labels, kept visually separate from canonical citations. The model may refer to private context but may not cite it as canonical evidence.

**CHECK:** Browser and contract tests prove the layers remain distinct.

**Record:** Provenance result.

### P09 — Commit Phase P

**Depends on:** P08.

**Goal:** Preserve safe local context ingestion.

**Do:** Run dependency audit, extraction tests, API tests, browser tests, security review, and v1 regression. Commit `Phase P: ingest private research context`.

**CHECK:** Docker images contain no uploaded artifact and logs contain no sentinel content.

**Record:** Commit hash and audit summary.

---

## 13. Phase Q — Make Compare and Path real product capabilities

### Q00 — Parse deterministic comparison fields

**Depends on:** P09.

**Goal:** Compare evidence rather than model recollection.

**Do:** Extract the exact Tier 1 sections named in §4.7 from stored canonical Markdown. Tier 2 and Tier 3 return missing fields honestly. Preserve Markdown as source text; do not render HTML in the API.

**CHECK:** Parser tests cover headings, missing sections, math, code fences, and Tier 2/3 behavior.

**Record:** Comparison parser tests.

### Q01 — Build the comparison query and API

**Depends on:** Q00.

**Goal:** Produce a stable evidence table for two to four concepts.

**Do:** Implement `compareConcepts()` and `POST /api/compare`. Validate ids, deduplicate, require two to four, preserve user order, and include review states, relationships, sources, and claim coverage.

**CHECK:** API tests cover 2/3/4 concepts, duplicates, unknown ids, Tier 3, missing fields, and index unavailable.

**Record:** Compare API result.

### Q02 — Build the Compare page

**Depends on:** Q01.

**Goal:** Make differences scannable without hiding uncertainty.

**Do:** Add `/compare` with concept search, two-to-four selection, responsive stacked/table layouts, source links, missing markers, and review-state rails. Add optional project save.

**CHECK:** Keyboard-only journey compares two and four concepts at desktop and narrow widths without horizontal information loss.

**Record:** Compare journey.

### Q03 — Add optional grounded comparison synthesis

**Depends on:** Q02.

**Goal:** Let the model explain the table without becoming its source.

**Do:** Add an explicit `Explain this comparison` action. The prompt receives only the deterministic table and selected private context. Reuse citation containment. Preserve the table if generation fails.

**CHECK:** Fabricated citations discard only the synthesis; the deterministic comparison remains visible.

**Record:** Synthesis failure/success tests.

### Q04 — Implement prerequisite path traversal

**Depends on:** Q03.

**Goal:** Compute supported learning routes.

**Do:** Implement §4.8 with deterministic breadth-first search, cycle protection, stable tie-breaking, and an explanation of every edge. Accept a target plus zero or more known concept ids.

**CHECK:** Unit tests cover direct, multi-hop, tied, cyclic, unreachable, Tier 3, and empty-known-set cases.

**Record:** Path-engine tests.

### Q05 — Apply familiarity without hiding it

**Depends on:** Q04.

**Goal:** Personalize paths transparently.

**Do:** For a selected project, treat `strong` concepts as known starts and mark `working` concepts likely known. Return which familiarity records affected the result. Allow the user to include an omitted node manually.

**CHECK:** Changing familiarity predictably changes the route and is reported in the result.

**Record:** Familiarity-path tests.

### Q06 — Build the Path API and page

**Depends on:** Q05.

**Goal:** Create a real Build-a-Path experience.

**Do:** Add `POST /api/paths` and `/path`. Search for a target, optionally select a project, show ordered steps, edge meanings, familiarity effects, missing graph information, and canonical links. Never invent an edge.

**CHECK:** Browser journeys cover reachable, unreachable, personalized, and graph-only routes.

**Record:** Path journey.

### Q07 — Save and export comparisons and paths

**Depends on:** Q06.

**Goal:** Return useful work to the researcher.

**Do:** Save structured comparison/path payloads to a project and export either as readable Markdown with canonical URLs and source URLs. Export is a download or `.navigator/exports/` file created by an explicit CLI command; it never alters canonical content.

**CHECK:** Saved and exported forms round-trip all ids, evidence, missing markers, and review states.

**Record:** Save/export tests.

### Q08 — Commit Phase Q

**Depends on:** Q07.

**Goal:** Preserve deterministic decision support.

**Do:** Run all compare/path unit, API, browser, accessibility, privacy, and regression tests. Commit `Phase Q: add comparison and learning paths`.

**CHECK:** Working tree clean.

**Record:** Commit hash and test summary.

---

## 14. Phase R — Build the editorial proposal and Hermes handoff

### R00 — Define the proposal bundle

**Depends on:** Q08.

**Goal:** Make agent work reviewable before it touches canonical knowledge.

**Do:** Define `.navigator/proposals/<proposal-id>/` containing:

```text
manifest.json
REQUEST.md
RESULT.md
changes.patch
validation.json
```

Manifest records proposal id, target backlog id, requested tier, allowed paths, base commit, created time, status, and agent name/model when known. Status is `prepared`, `running`, `review`, `accepted`, `rejected`, or `superseded`.

**CHECK:** JSON schema and tests reject unknown fields, path traversal, absolute paths, invalid transitions, and a base commit not present locally.

**Record:** Proposal schema tests.

### R01 — Generate a bounded proposal request

**Depends on:** R00.

**Goal:** Turn one backlog item into a complete agent brief.

**Do:** Add `navigator proposal prepare <backlog-id> --tier 2|3`. Generate REQUEST.md containing the relevant atlas/backlog entry, incoming references, allowed files, exact content contract, checks, and instruction to stop at review. Do not invoke any model.

**CHECK:** The same input and base commit produce byte-identical request content except proposal id/time, which tests freeze.

**Record:** Proposal generation result.

### R02 — Validate proposed changes

**Depends on:** R01.

**Goal:** Reject agent drift before human review.

**Do:** Add `navigator proposal validate <proposal-dir>`. Verify patch applies to the recorded base, touches only allowed paths, adds no secret or ignored artifact, preserves stable ids, never raises review state, passes content validation, and includes a reviewer summary.

**CHECK:** Fixtures reject unrelated files, parent paths, review promotion, invalid content, secret patterns, missing summary, and an unappliable patch.

**Record:** Proposal validator tests.

### R03 — Add human-only acceptance

**Depends on:** R02.

**Goal:** Apply a reviewed proposal deliberately and recoverably.

**Do:** Add `navigator proposal accept <proposal-id> --confirm <proposal-id>`. Require a clean working tree, exact base commit, valid proposal, and explicit matching confirmation. Create a new local branch `content/<proposal-id>`, apply the patch, run validation and focused tests, and leave changes uncommitted for final human inspection. `reject` records a reason without applying anything.

**CHECK:** Dry-run tests cover every guard. Integration test operates only in a temporary Git repository.

**Record:** Acceptance-guard result.

### R04 — Write the Hermes content profile

**Depends on:** R03.

**Goal:** Give Hermes the same non-drifting contract as the builder.

**Do:** Add `HERMES_CONTENT_PROFILE.md`. Require one proposal, one target, allowed paths only, isolated worktree, generated-draft, sources and uncertainty, no merge/push/publish, exact checks, RESULT.md, patch, and review handoff.

**CHECK:** A scripted audit finds every required prohibition, output, and check and finds no permission to accept its own work.

**Record:** Profile audit.

### R05 — Detect the installed Hermes interface

**Depends on:** R04.

**Goal:** Fail clearly rather than inventing commands.

**Do:** `scripts/hermes-content-task.mjs --check` locates `hermes`, confirms top-level help contains `project` and `kanban`, and confirms `hermes kanban create --help` contains `--workspace`, `--project`, `--max-runtime`, `--max-retries`, and `--completion-contract`. It reports the installed version. It never updates Hermes.

**CHECK:** Tests use a fake executable for success and each missing capability; the real local check may run read-only.

**Record:** Detected version/capabilities.

### R06 — Generate the Hermes task command

**Depends on:** R05.

**Goal:** Connect the proposal bundle to Hermes without hidden side effects.

**Do:** Default command is dry-run and prints a shell-escaped `hermes kanban create` invocation using board/project slug `knowledge-navigator`, project-scoped worktree, `local-only`, two-hour max runtime, three retries, and the request body. Model and reasoning remain controlled by the selected Hermes profile because `hermes kanban create` does not expose a reasoning flag. It also prints exact one-time manual setup commands if the project or board is absent.

**CHECK:** Snapshot tests prove hostile proposal text cannot inject shell arguments. No real board or task is created.

**Record:** Dry-run output audit.

### R07 — Add explicit Hermes execution

**Depends on:** R06.

**Goal:** Allow the researcher to dispatch after inspecting the task.

**Do:** `--execute --confirm <proposal-id>` uses `spawn` with an argument array, never a shell. Require the proposal status `prepared`, a clean repository, matching confirmation, and existing Hermes project and board. Record returned task id and change status to `running`. Do not create global Hermes configuration automatically.

**CHECK:** Tests use a fake Hermes executable and prove missing confirmation, missing setup, nonzero exit, malformed JSON, and duplicate dispatch are safe.

**Record:** Execution-adapter tests.

### R08 — Import the completed Hermes result

**Depends on:** R07.

**Goal:** Bring isolated agent work into the proposal review boundary.

**Do:** Add `navigator proposal import-hermes <proposal-id> --worktree <path>`. Verify the worktree belongs to the repository, compute a patch against the recorded base, copy RESULT.md, run proposal validation, and set status to `review`. Do not merge or accept.

**CHECK:** Temporary-repository tests cover valid result, foreign worktree, dirty unrelated path, wrong base, missing result, and invalid patch.

**Record:** Import tests.

### R09 — Document the human workflow

**Depends on:** R08.

**Goal:** Make the process usable without knowing Hermes internals.

**Do:** Add README instructions for prepare → inspect → optional Hermes setup → dry run → execute → inspect task → import → validate → review → accept/reject. State that Hermes currently warns if its gateway has not restarted after an update; do not tell the product or tests to restart it automatically.

**CHECK:** Every documented command exists and all links resolve.

**Record:** Documentation audit.

### R10 — Commit Phase R

**Depends on:** R09.

**Goal:** Preserve the safe agent-growth loop.

**Do:** Run proposal tests, Hermes fake-executable tests, security review, and regression suite. Commit `Phase R: add reviewable Hermes proposals`.

**CHECK:** No `.navigator/` file, Hermes global state, worktree, or task id is committed.

**Record:** Commit hash and audit summary.

---

## 15. Phase S — Backup, Docker, privacy, and recovery

### S00 — Mount personal data separately

**Depends on:** R10.

**Goal:** Persist private work without mixing it into the canonical build.

**Do:** Add a dedicated `personal-data` volume mounted only by the API at the directory containing `personal.db`. Keep canonical compiled data replaceable. No personal volume in the web or Ollama service.

**CHECK:** `docker compose config` shows only API mounting personal-data; only web publishes a loopback port.

**Record:** Compose audit.

### S01 — Add private export

**Depends on:** S00.

**Goal:** Make personal work recoverable.

**Do:** Add `navigator personal export --output <path>` producing a versioned JSON archive plus Markdown summaries. Require output under `.navigator/exports/` unless `--allow-external-output` is explicitly supplied. Never include original binary uploads because none are retained.

**CHECK:** Export contains every personal record and no canonical body duplication beyond stable ids and cited labels.

**Record:** Export tests.

### S02 — Add private import

**Depends on:** S01.

**Goal:** Restore personal work safely.

**Do:** Add `navigator personal import <archive> --dry-run` and explicit `--confirm-import`. Validate version and all foreign keys before a transaction. Conflict policy is deterministic: same UUID and same content is skipped; same UUID with different content aborts the entire import.

**CHECK:** Round-trip, duplicate, conflict, malformed, future-version, and rollback tests pass.

**Record:** Import tests.

### S03 — Recover after volume deletion

**Depends on:** S02.

**Goal:** Prove the researcher owns their data.

**Do:** In a test project, create private records and export them, stop Compose, remove the personal volume, restart, import, and compare normalized exports. Never use the user's real personal database for the destructive portion.

**CHECK:** Restored normalized export is byte-identical and canonical corpus hash never changes.

**Record:** Recovery result.

### S04 — Extend the security review

**Depends on:** S03.

**Goal:** Audit the new write surface.

**Do:** Check that canonical DB remains read-only; personal writes are route-limited and validated; uploads are bounded; no artifact executes; no private data enters logs, graph JSON, web build, Docker layers, Git, or assistant prompts unless selected; exports require explicit action; proposal acceptance requires explicit confirmation.

**CHECK:** Security script reports zero failures. Document false positives rather than suppressing them silently.

**Record:** Security review.

### S05 — Update smoke and browser journeys

**Depends on:** S04.

**Goal:** Test the product as a researcher uses it.

**Do:** Add journeys for Coverage, private workspace persistence, text/PDF ingestion, selected context in Ask, Compare, Path, personal export, and proposal dry-run. Keep every v1 journey.

**CHECK:** All journeys pass twice from fresh containers, once before and once after restart.

**Record:** Journey counts and timings.

### S06 — Commit Phase S

**Depends on:** S05.

**Goal:** Preserve deployment and recovery.

**Do:** Run full checks and commit `Phase S: secure and recover private research data`.

**CHECK:** Working tree clean and both images build.

**Record:** Commit hash and image sizes.

---

## 16. Phase T — Evaluate, document, and finish Version 2

### T00 — Add a v2 evaluation harness

**Depends on:** S06.

**Goal:** Measure usefulness instead of only page count.

**Do:** Add local fixtures for three workflows: discover an unfamiliar neighborhood from Coverage, compare two known concepts with evidence, and build a prerequisite path adjusted by familiarity. Record expected deterministic outputs and separate optional model observations.

**CHECK:** Deterministic portions pass without Ollama; model portions are clearly optional and never silently converted to fixtures.

**Record:** Evaluation results.

### T01 — Test one end-to-end coverage promotion

**Depends on:** T00.

**Goal:** Prove the living-content loop without adding random permanent content.

**Do:** In a temporary fixture repository, promote one candidate to Tier 3, resolve one unresolved reference, prepare a Tier 2 proposal, validate it, accept it with confirmation, compile, inspect, search, compare, and build a path. Remove the fixture repository afterward.

**CHECK:** Stable id and slug survive both promotions; review state remains generated-draft; canonical production corpus remains unchanged.

**Record:** Promotion journey.

### T02 — Evaluate retrieval before adding embeddings

**Depends on:** T01.

**Goal:** Honor the evidence gate.

**Do:** Run at least 25 frozen questions across title, alias, paraphrase, symptom, comparison, and path intents using the current eleven-page corpus plus private selected context fixtures. Record retrieval recall separately from answer quality.

**CHECK:** Publish the local result in `docs/v2-retrieval-evaluation.md`. Do not add embeddings. If failures exist, record them as v3 evidence.

**Record:** Recall by query class and failure examples.

### T03 — Rewrite README around the complete product

**Depends on:** T02.

**Goal:** Prevent the scope surprise that followed v1.

**Do:** Explain clearly:

- what Version 2 now includes;
- the exact canonical/personal/candidate boundaries;
- coverage tiers versus product versions;
- how to back up private work;
- how artifacts are handled;
- how Compare and Path work;
- how Hermes proposals work;
- what remains out of scope;
- that the original eleven pages are still generated drafts.

**CHECK:** Every command exists, links resolve, and a scripted content audit covers each item.

**Record:** README audit.

### T04 — Update About and in-product explanations

**Depends on:** T03.

**Goal:** Make limitations visible inside the product.

**Do:** About must show canonical concept counts by tier, candidate count, unresolved count, review-state counts, private-data boundary, artifact limitations, and the fact that no candidate or private material is canonical evidence.

**CHECK:** Live About values match API values and contain no private record contents.

**Record:** About acceptance result.

### T05 — Run the full Version 2 Definition of Done audit

**Depends on:** T04.

**Goal:** Verify every statement in §17 against live code and containers.

**Do:** Check each item individually. Record the command or observation. A grouped “looks good” is not evidence.

**CHECK:** Every item passes.

**Record:** 100% itemized Definition of Done evidence.

### T06 — Final clean-state verification

**Depends on:** T05.

**Goal:** Finish with a reproducible repository.

**Do:** From a clean working tree run lockfile install, full checks, browser journeys, smoke twice, security review, both Docker builds, ordinary Compose, and fallback Compose configuration validation. Inspect staged and untracked files for secrets/private data.

**CHECK:** All commands pass; no private data or generated personal database is tracked.

**Record:** Final commands, counts, image sizes, and container health.

### T07 — Commit Version 2 completion

**Depends on:** T06.

**Goal:** Leave one unambiguous handoff.

**Do:** Update `V2_BUILD_STATE.md` to `COMPLETE`, record remaining limitations, and commit `Version 2: complete the living navigator`.

**CHECK:** Clean tree; v1 and v2 state files both complete; no checkpoint remains.

**Record:** Final commit hash.

---

## 17. Version 2 Definition of Done

### Repository and regression safety

- [ ] Version 1's entire test, browser, smoke, and security suites still pass.
- [ ] Original eleven concept files retain stable ids, slugs, and review states.
- [ ] No parent directory is read or written.
- [ ] No secret, private database, artifact, export, proposal workspace, or model data is tracked.
- [ ] Every v2 phase has one local commit and the final working tree is clean.

### Atlas and coverage

- [ ] Mathematics, Artificial Intelligence, and Programming always appear in Coverage.
- [ ] Appendix A is represented in the atlas without fabricated factual summaries.
- [ ] Candidates are visibly noncanonical and never ground assistant answers.
- [ ] Tier 1, Tier 2, Tier 3, candidate, and review state are distinct.
- [ ] Tier 3 has a stable identity and graph presence but no fake article.
- [ ] Unresolved references compile into a grouped, traceable backlog.
- [ ] Empty categories remain discoverable.

### Canonical trust

- [ ] Claims and evidence locators validate and render when present.
- [ ] A newly promoted source-checked page cannot omit claim evidence.
- [ ] The canonical database still opens read-only in the API.
- [ ] Compilation remains atomic and deterministic.
- [ ] Failed atlas, Tier 3, backlog, claim, or evidence builds preserve prior valid output.

### Private research workspace

- [ ] Personal data lives in a separate writable SQLite database.
- [ ] Projects, sessions, notes, familiarity, saved items, and artifacts persist across restarts.
- [ ] Ordinary browsing and Ask requests store nothing automatically.
- [ ] Archival is reversible.
- [ ] Export and import round-trip private state.
- [ ] Deleting and restoring the personal volume does not affect canonical knowledge.

### Artifacts and privacy

- [ ] Allowed text/code/notebook/PDF artifacts extract within hard limits.
- [ ] Binary, malformed, oversized, encrypted, and image-only inputs fail safely.
- [ ] Notebook outputs and attachments are discarded.
- [ ] Uploaded code is never executed.
- [ ] Original binary bytes are never retained.
- [ ] Artifact text reaches Ollama only when explicitly selected.
- [ ] Private context is visually distinct from canonical evidence.
- [ ] Sentinel private strings never appear in logs, images, graph JSON, or web assets.

### Research assistance

- [ ] Comparison tables are deterministic and evidence-backed.
- [ ] Missing comparison information remains visibly missing.
- [ ] Optional comparison synthesis cannot erase or corrupt the deterministic table.
- [ ] Paths use only prerequisite semantics defined in §4.8.
- [ ] Familiarity effects are explicit and user-controlled.
- [ ] Unreachable paths report missing graph information rather than inventing steps.
- [ ] Comparisons, paths, concepts, sources, and assistant results can be saved explicitly.
- [ ] Saved results can be exported as useful Markdown.

### Editorial and Hermes workflow

- [ ] One backlog item produces one bounded proposal bundle.
- [ ] Proposal validation catches drift, secrets, invalid content, review promotion, and unrelated paths.
- [ ] Acceptance requires a clean tree and exact explicit confirmation.
- [ ] The Hermes adapter is dry-run by default.
- [ ] Automated tests never modify global Hermes state or dispatch a real task.
- [ ] Explicit execution uses an argument array, isolated worktree, local-only completion, and review handoff.
- [ ] Importing a Hermes result never merges or accepts it automatically.

### Containers and quality

- [ ] Only the web service publishes a port and only on loopback.
- [ ] Only the API mounts personal-data.
- [ ] All containers run as non-root.
- [ ] Full checks and browser journeys pass twice around a restart.
- [ ] Both images build for the local architecture.
- [ ] Ordinary host-Ollama and fallback Compose configurations validate.
- [ ] Security review reports zero failures.
- [ ] `V2_BUILD_STATE.md` contains enough evidence for a fresh agent to verify completion.

---

## 18. Explicitly deferred after Version 2

These items are preserved so they are not accidentally forgotten again:

1. Multi-user accounts, authentication, permissions, and collaborative editing.
2. Public canonical hosting and governance.
3. Expert reputation, contributor moderation, and dispute resolution workflows.
4. Semantic embeddings or a vector database, unless T02 demonstrates a measured need.
5. OCR, image understanding, audio/video, Office documents, and web-page capture.
6. Native editor, notebook, browser, Zotero, Lean, and terminal integrations.
7. Automatic stale-claim detection and correction propagation across dependent pages.
8. Machine-checkable mathematical claims connected to Lean or another prover.
9. Real-time token streaming.
10. Mobile and desktop-native applications.
11. Autonomous canonical publication.
12. Large-scale Tier 1 expansion without a reviewed research journey.

These are Version 3 candidates, not promises to implement without evidence.

---

## Appendix A — Frozen Version 2 atlas seed

The atlas seed is an editorial map, not a set of factual articles. Preserve these labels and hierarchy. Split labels separated by `·` or `→` into separate candidates while preserving their shared category. Parenthetical lists are candidate children unless the parentheses merely expand an abbreviation. Do not create Tier 1 pages from this appendix.

### Mathematics

```text
Foundations
  Logic & Proof: Propositional Logic · First-Order Logic · Proof Theory
  Set Theory
  Category Theory
  Model Theory
  Computability Theory
  Formal Verification: Lean · Coq
Number Theory
  Elementary Number Theory · Analytic Number Theory · Algebraic Number Theory
Algebra
  Group Theory · Ring Theory · Field Theory · Galois Theory
  Complex Numbers · Quaternions · Octonions
  Clifford Algebra · Geometric Algebra
  Representation Theory · Lie Algebras
  Homological Algebra · Lattice Theory · Order Theory
Linear & Multilinear Algebra
  Vector Spaces · Matrix Theory · Matrix Decompositions
  Tensors · Tensor Decomposition
  Spectral Theory
Analysis
  Single-Variable Calculus · Multivariable Calculus · Vector Calculus
  Real Analysis · Complex Analysis · Measure Theory
  Functional Analysis · Hilbert Spaces · Banach Spaces · Operators
  Harmonic Analysis · Fourier Analysis · Wavelets · Convolution · Cross-Correlation · Translation Equivariance
  Ordinary Differential Equations · Partial Differential Equations · Calculus of Variations
  Dynamical Systems · Chaos
Probability & Statistics
  Probability Theory · Stochastic Processes · Martingales
  Concentration Inequalities · Probability and Computing
  Frequentist Inference · Bayesian Inference
  High-Dimensional Statistics · Random Matrix Theory
Combinatorics
Graph Theory
Spectral Graph Theory
Geometry & Topology
  Euclidean Geometry · Non-Euclidean Geometry · Spherical Geometry · Hyperbolic Geometry
  Differential Geometry · Manifolds · Lie Groups · Curvature
  Algebraic Geometry · Convex Geometry
  Point-Set Topology · Algebraic Topology · Differential Topology
  Fractal Geometry · Renormalization
Optimization
  Convex Optimization · Nonconvex Optimization · Stochastic Optimization
  Combinatorial Optimization · Integer Programming
  Variational Methods · Optimal Transport
Discrete Mathematics
Numerical Analysis
Information Theory
Game Theory
Operations Research
Theory of Computation
  Automata · Computational Complexity
Mathematical Physics
  Hamiltonian Mechanics · Statistical Mechanics
```

### Artificial Intelligence

```text
Symbolic AI
  Search: Uninformed Search · A* · Adversarial Search · Minimax · Monte Carlo Tree Search
  Planning: STRIPS · PDDL · Hierarchical Planning
  Knowledge Representation · Ontologies
  Logic Programming · Expert Systems
  Constraint Satisfaction
Classical Machine Learning
  Linear Regression · Logistic Regression · Generalized Linear Models
  Support Vector Machines · Kernel Methods
  Decision Trees · Random Forests · Gradient Boosting
  k-Nearest Neighbors · Naive Bayes
  k-Means · Hierarchical Clustering · DBSCAN · Spectral Clustering
  Principal Component Analysis · Independent Component Analysis · t-SNE · UMAP
  Gaussian Processes · Hidden Markov Models · Bayesian Networks · Conditional Random Fields
  PAC Learning · VC Dimension · Bias-Variance · Generalization
Deep Learning — Architectures
  Perceptron · Hopfield Networks · Boltzmann Machines · Radial Basis Function Networks · Self-Organizing Maps
  Multilayer Perceptrons · Convolutional Networks · Convolutional Layer · Pooling · Receptive Field · Residual Connection · LeNet · VGG · ResNet · ConvNeXt · Capsule Networks
  Recurrent Neural Networks · LSTM · GRU · xLSTM · RWKV
  Transformers · Attention · Positional Encoding · Mixture of Experts · Vision Transformer
  State Space Models · S4 · Mamba
  Autoencoders · Variational Autoencoders
  Generative Adversarial Networks · Diffusion Models · Normalizing Flows · Flow Matching
  Energy-Based Models · Neural ODEs
  Graph Neural Networks · Graph Convolutional Networks · Graph Attention Networks · Message Passing
  Geometric Deep Learning · Equivariance · Spherical CNNs
  Quaternion Neural Networks · Clifford Neural Networks
  Kolmogorov-Arnold Networks
  Spiking Neural Networks · Neuromorphic Computing
Deep Learning — Training
  Backpropagation · Backpropagation Through Convolution · Stochastic Gradient Descent · Adam · Learning-Rate Schedules
  Loss Functions · Regularization · Batch Normalization · Layer Normalization
  Initialization · Distillation · Pruning · Quantization
Reinforcement Learning
  Multi-Armed Bandits · Markov Decision Processes · Dynamic Programming
  Monte Carlo Methods · Temporal-Difference Learning · Q-Learning · DQN
  Policy Gradients · REINFORCE · PPO · SAC · Actor-Critic
  Model-Based Reinforcement Learning · Offline Reinforcement Learning · Inverse Reinforcement Learning · Imitation Learning
  Multi-Agent Reinforcement Learning · RLHF · RLAIF
Learning Paradigms
  Supervised Learning · Unsupervised Learning · Self-Supervised Learning · Contrastive Learning
  Meta-Learning · Continual Learning · Transfer Learning
  Federated Learning · Curriculum Learning
Domains
  Computer Vision: Classification · Detection · Segmentation · Visual Place Recognition
  Natural Language Processing: Tokenization · Embeddings · BERT · GPT · Agents
  Speech · Audio · Time Series · Forecasting
  Robotics · Control · Recommender Systems
Other Traditions & Frontiers
  Evolutionary Computation · Genetic Algorithms · Neuroevolution
  Swarm Intelligence · Fuzzy Logic
  Neuro-Symbolic AI · Causal Inference
  Interpretability · Mechanistic Interpretability
  Alignment · AI Safety
```

### Programming

```text
Languages
  Paradigms: Imperative Programming · Object-Oriented Programming · Functional Programming · Logic Programming · Array Programming
  Python · C · C++ · Rust · Julia · R · MATLAB
  Lean
  Haskell · Lisp · JavaScript · TypeScript · Go
  CUDA · GPU Kernels · Assembly
Data Structures & Algorithms
  Core Data Structures · Sorting · Searching · Graph Algorithms
  Complexity Analysis
Systems
  Operating Systems · Networking · Distributed Systems
  Relational Databases · Graph Databases
  Parallel Computing · High-Performance Computing
ML Engineering
  PyTorch · JAX · Ollama
  Training Infrastructure · Experiment Tracking
  Deployment · Edge Inference
Software Practice
  Version Control · Testing · Continuous Integration · Continuous Delivery · Containers
  Design Patterns · APIs · Protocols · Model Context Protocol
```

---

## Appendix B — One-time manual Hermes setup after Version 2

The builder must document and dry-run these commands but must not execute them automatically:

```bash
cd /Users/nick/Projects/knowledge-navigator

hermes kanban boards create knowledge-navigator \
  --name "Knowledge Navigator" \
  --description "Reviewable canonical content proposals" \
  --default-workdir "$PWD"

hermes project create "Knowledge Navigator" "$PWD" \
  --slug knowledge-navigator \
  --board knowledge-navigator
```

After setup, the human workflow is:

```bash
npm run proposal:prepare -- <backlog-id> --tier 2
npm run hermes:content -- <proposal-id> --dry-run
npm run hermes:content -- <proposal-id> --execute --confirm <proposal-id>
```

Never place `--yolo` in a documented command. Never let a web request dispatch Hermes.

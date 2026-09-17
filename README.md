# Knowledge Navigator

A private, local-first research knowledge navigator for mathematics, artificial
intelligence, and programming.

It is not merely a wiki. It is built to help a researcher understand unfamiliar
ideas, discover relevant methods, expose missing prerequisites and assumptions,
compare nearby approaches, and find a defensible next move when stuck. Three
experiences carry that work:

- **Explore** — browse canonical concepts through overlapping categories, typed
  relationships, prerequisites, and a bounded local graph neighborhood.
- **Understand** — move from a short definition to intuition, a concrete
  example, formal treatment, applicability, limitations, variants, history, and
  sources.
- **Unstick me** — submit a question plus optional research context and receive
  a structured interpretation, candidate routes, assumptions, disqualifiers,
  missing information, next checks, citations, and an explicit confidence level.
- **Compare** — put two to four concepts side by side, field by field, quoted
  from the pages themselves, with every gap marked as a gap.
- **Build a path** — get the order to read things in, built only from
  prerequisites a page actually declares, shortened by what you already know.

> **This is a personal, experimental, single-user project.** It is private by
> default, binds to localhost, has no authentication of any kind, and is not
> hardened for shared or public hosting. Do not expose it to a network you do
> not control.

## Contents

- [Status](#status)
- [What is canonical and what is disposable](#what-is-canonical-and-what-is-disposable)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Stopping, updating and rebuilding](#stopping-updating-and-rebuilding)
- [Where data lives](#where-data-lives)
- [Backup and recovery](#backup-and-recovery)
- [Editing content](#editing-content)
- [Comparing concepts and building paths](#comparing-concepts-and-building-paths)
- [Uploading your own material](#uploading-your-own-material)
- [What this does not do](#what-this-does-not-do)
- [Proposing content with an agent](#proposing-content-with-an-agent)
- [Architecture](#architecture)
- [Working on the source](#working-on-the-source)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Privacy](#privacy)
- [Building and publishing images](#building-and-publishing-images)
- [Build authority](#build-authority)
- [License](#license)

## Status

Versions 1 and 2 are complete and run. Each was executed checkpoint by
checkpoint from its runbook —
[`KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md`](./KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md)
and
[`KNOWLEDGE_NAVIGATOR_V2_BUILD_RUNBOOK.md`](./KNOWLEDGE_NAVIGATOR_V2_BUILD_RUNBOOK.md)
— and each records what was actually run in
[`BUILD_STATE.md`](./BUILD_STATE.md) and
[`V2_BUILD_STATE.md`](./V2_BUILD_STATE.md): every checkpoint, the exact check,
its result, and every decision taken where the runbook left a choice open. Read
them before assuming a feature exists or works differently from how it is
described here.

### What Version 2 added

- **A map of the whole subject**, not just what is written. The curated atlas
  names three areas and their categories, and Coverage shows how little of it
  exists: eleven pages against hundreds of candidate labels.
- **Coverage tiers.** A concept can be a full page, a short stub, or a
  graph-only identity with a stable address and no article at all.
- **An editorial backlog.** When a page needs an idea this corpus does not have,
  it records an unresolved reference instead of inventing a stub, and those
  group into a traceable list of what to write next.
- **Claim-level evidence.** A page may attach claims to sources with locators,
  and a page above `generated-draft` must.
- **A private research workspace.** Projects, sessions, notes, familiarity,
  saved results and uploaded material, in a separate database that is yours.
- **Compare and Path**, both deterministic and both honest about what the corpus
  does not record.
- **Reviewable agent proposals**, including a Hermes adapter that is dry-run by
  default and can never accept its own work.

### What has not changed

The content is still a deliberately small slice: eleven connected concepts about
convolutional networks and their mathematical foundations. It exists to exercise
the system end to end, and it is not a claim about final scope.

**All eleven pages are still `generated-draft`** — written by an AI agent and not
yet checked against their sources by a person. Version 2 did not promote a
single one, because promoting a page is a person reading it against its sources,
and that has not happened. The interface says so on every page, and the left
edge of every knowledge block carries a dashed rule that means exactly that.

## What is canonical and what is disposable

Four kinds of thing live here, and the product never blurs them.

**Canonical knowledge** is the Markdown in
[`content/concepts/`](./content/concepts) and the YAML identities in
[`content/graph-only/`](./content/graph-only). It is tracked in Git, it is what
answers are grounded in, and it is the only thing an assistant may cite.

**Your private research** — projects, sessions, notes, familiarity, saved
comparisons and paths, and the text extracted from files you uploaded — lives in
a separate SQLite database in its own Docker volume. It is never tracked, never
compiled, never published, and never reaches a model unless you tick a box for
that one request. It is the other irreplaceable thing here: see
[Back up your own research](#back-up-your-own-research).

**Atlas candidates** are labels on the map: names somebody thought worth
recording, with nothing behind them. A candidate is not knowledge. It is never
cited, never retrieved, never used to ground an answer, and the Coverage page
says so in those words. An unresolved reference is the same idea from the other
direction — a gap a page ran into while being written.

**Everything else is disposable**: the SQLite index, the full-text search
tables, [`generated/graph.json`](./generated), and
[`apps/web/sidebars.generated.ts`](./apps/web) are compiled artifacts. Deleting
them costs the time to run `npm run compile`, and the containers rebuild the
index on every start.

AI-generated output never silently changes canonical knowledge. An agent
proposes a change; a person reviews it; only a person may raise a page's review
state. See [`AGENT_CONTENT_CONTRACT.md`](./AGENT_CONTENT_CONTRACT.md).

### Coverage tiers are depths, not versions

A tier says how much has been written about a concept. It has nothing to do with
the version of this product, and it is not a quality score.

| Tier | What it is            | What it has                                                                                   |
| ---- | --------------------- | --------------------------------------------------------------------------------------------- |
| 1    | A full page           | The complete template: definition, intuition, example, formal treatment, limitations, sources |
| 2    | A stub                | A definition paragraph, sources, and at least one relationship                                |
| 3    | A graph-only identity | A stable id, slug and summary. No article, and no pretence of one                             |

Promotion — Tier 3 to Tier 2 to Tier 1 — **keeps the concept id and the slug
exactly as they were**. Those are permanent addresses: every relationship,
citation and link points at them, and a promotion that changed one would break
all of it silently. The review state is a separate axis entirely: a Tier 1 page
can be a generated draft, and a Tier 3 identity could in principle be
source-checked.

## Requirements

To **run** the product:

- Git
- Docker with the Compose plugin
- Optionally, [Ollama](https://ollama.com) installed natively on the host, with
  a model pulled. Without it the product still browses, searches and draws
  graphs; only generation is unavailable, and it says so.

To **work on the source** outside containers, additionally:

- Node.js 22 LTS (the project pins `engines: >=22 <23`, and `make check`
  refuses to run on anything else)

## Quick start

Personal stack — uses Ollama installed natively on the host, so the model gets
Apple acceleration while the application stays containerized:

```bash
git clone <this repository> knowledge-navigator
cd knowledge-navigator
docker compose up --build -d
```

Then open <http://127.0.0.1:3000>.

The first build takes a few minutes. The API compiles canonical Markdown into a
fresh index before it reports healthy, and the web container waits for that, so
the site is usable the moment it answers.

### Using the host's Ollama

This is the default. Confirm the host is serving and has the configured model:

```bash
curl -s http://127.0.0.1:11434/api/tags
```

The stack expects `qwen3.8:27b-mlx`. To use a different one, copy the
environment template and edit it:

```bash
cp .env.example .env
```

Nothing about the host's Ollama is managed by this project: its models, its
storage and its updates are yours, and they are outside this project's backup
boundary.

### Portable fallback: Ollama inside Compose

For a machine with no native Ollama. This starts a second Ollama in a container
and pulls a smaller model into a named volume:

```bash
OLLAMA_BASE_URL=http://ollama:11434 OLLAMA_MODEL=qwen3:8b \
  docker compose --profile container-ollama up --build -d
```

The fallback publishes no port; the model API is reachable only from inside the
Compose network. The ordinary stack never starts it and never pulls a second
copy of a model.

### Running without a model at all

```bash
ASSISTANT_PROVIDER=disabled docker compose up --build -d
```

Browsing, search and the graph work exactly as before. The Ask page says
generation is switched off and explains how to turn it on.

## Stopping, updating and rebuilding

```bash
# Stop, keeping the compiled index and any fallback model data
docker compose down

# Stop and delete the named volumes. Canonical Markdown is untouched.
docker compose down --volumes

# Rebuild after changing content or code
docker compose up --build -d

# Watch what the stack is doing
docker compose logs -f
```

There is no separate "update" step for content. The images carry canonical
Markdown, and the API recompiles the index on every start, so
`docker compose up --build -d` is the whole update procedure.

## Where data lives

| Data                             | Location                                                      | Replaceable                               |
| -------------------------------- | ------------------------------------------------------------- | ----------------------------------------- |
| Canonical concept Markdown       | `content/concepts/` (tracked in Git)                          | **No — back this up**                     |
| Compiled SQLite index            | `navigator-data` Docker volume, mounted at `/data`            | Yes, rebuilt from Markdown on every start |
| Graph JSON and generated sidebar | `generated/graph.json`, `apps/web/sidebars.generated.ts`      | Yes, regenerated by `npm run compile`     |
| Local compiled index (host)      | `data/knowledge.db`                                           | Yes, and it is Git-ignored                |
| Host Ollama models               | Managed by Ollama on the host                                 | Outside this project's backup boundary    |
| Fallback container models        | `ollama-data` Docker volume (`container-ollama` profile only) | Yes, re-pulled on demand                  |

## Backup and recovery

**Two things here are irreplaceable, and only two.** The Markdown in
`content/concepts/` is canonical knowledge, and the private store is your own
research. Everything else — the compiled database, the graph, the site — is
derived, and the compiled database is never the authority for anything.

### Back up

Committing and pushing the repository is a complete backup of canonical
knowledge. For a copy outside Git:

```bash
tar czf knowledge-backup-$(date +%Y-%m-%d).tar.gz content/concepts
```

Backing up `data/knowledge.db` or the `navigator-data` volume is pointless. They
are rebuilt from the Markdown on every container start.

### Recover after deleting every project volume

```bash
docker compose down --volumes     # everything derived is now gone
docker compose up --build -d      # and it is all back
```

To confirm the recovery is exact rather than merely plausible, compare the
corpus hash before and after. It is a SHA-256 over every canonical file name and
content hash, so it changes if and only if canonical content changes:

```bash
curl -s http://127.0.0.1:3000/api/build | grep -o '"corpusHash":"[^"]*"'
```

### Back up your own research

Your projects, sessions, notes, familiarity, saved comparisons and paths, and
the text extracted from files you uploaded, exist in exactly one place: the
`personal-data` volume. Nothing rebuilds them.

```bash
npm run personal:export                       # writes .navigator/exports/personal-<time>/
```

That directory holds `archive.json` — every record, in a versioned format — and
`SUMMARY.md`, which is the same work in a form you can read. Keep it somewhere
you trust. To write it elsewhere, pass `--output <dir> --allow-external-output`:
the extra flag is there because an export is the only copy of work nothing else
can reproduce, and putting it where Git or Docker might pick it up should be a
decision rather than a default.

### Restore your own research

```bash
npm run navigator -- personal import path/to/archive.json                    # shows what it would do
npm run navigator -- personal import path/to/archive.json --confirm-import   # does it
```

The first form changes nothing: it prints what would be inserted and what is
already there. A record that is already present and identical is skipped. A
record that is already present and _different_ aborts the whole import and names
the fields that disagree — the two stores disagree about your work, and only you
can say which is right.

To prove all of this rather than trust it, run the drill. It builds an isolated
stack on its own port with its own volumes, creates private records, exports
them, destroys the volume, restarts, imports, and compares:

```bash
bash scripts/recovery-drill.sh
```

It never touches your own stack, and it refuses to run if the project name it
was given is the real one.

### Restore canonical content

```bash
tar xzf knowledge-backup-YYYY-MM-DD.tar.gz
npm run validate        # confirm the restored corpus is well formed
docker compose up --build -d
```

Fallback container models live in the `ollama-data` volume. Preserving them is
optional — they can always be pulled again — but `docker compose down` without
`--volumes` keeps them. Native host Ollama models are not managed by this
project and are not part of its backup boundary.

## Editing content

The smallest useful change is a new concept page.

```bash
# 1. Copy a page that is already valid and give it a new name.
cp content/concepts/pooling.md content/concepts/dropout.md

# 2. Edit the frontmatter: a new stable concept_id and slug whose final segment
#    matches the file name, then the summary, categories and sources.
#    Leave review_state as generated-draft.

# 3. Validate. Every problem is reported at once, addressed to a file and field.
npm run validate

# 4. Compile, then look at what was actually indexed.
npm run compile
npm run inspect -- concept.deep_learning.dropout
npm run search -- dropout

# 5. Review the diff before committing.
git diff
```

The validator will refuse a page whose identifiers collide with an existing one,
whose relationship targets do not exist, whose relative links point at a file
that is not there, whose headings do not match the tier template, or whose
aliases collide with another concept's name once normalized.

Agents writing content are bound by
[`AGENT_CONTENT_CONTRACT.md`](./AGENT_CONTENT_CONTRACT.md), which forbids
publishing, forbids raising a page's own review state, and requires uncertainty
to be recorded rather than smoothed over.

## Proposing content with an agent

An agent may write content for this corpus. It may not publish it. The whole
loop below exists so that everything an agent produces arrives as a _proposal_ —
a patch, a written account of what was done, and a validation verdict — that a
person reads before it becomes canonical knowledge.

Nothing in this loop is automatic. Every step that changes something needs a
confirmation you type yourself, and there is no command anywhere in this
repository that lets an agent accept its own work.

### 1. Prepare a brief

```bash
npm run navigator -- coverage unresolved          # gaps pages ran into
npm run navigator -- coverage candidates          # gaps the atlas records
npm run navigator -- proposal prepare <backlog-id> --tier 3
```

This writes `.navigator/proposals/<proposal-id>/` containing `manifest.json` and
`REQUEST.md`. No model is involved. The brief names the one file that may be
written, the exact `concept_id` and `slug` it must carry, the pages waiting on
it, the rules it must satisfy, and the point at which the agent must stop.

If the label cannot make a sensible address — `A*`, `C++` — the command refuses
rather than guessing, and asks for `--name <lowercase-dashed-name>`.

### 2. Read it

```bash
cat .navigator/proposals/<proposal-id>/REQUEST.md
```

This is the whole specification the agent will get. If it is wrong, fix it now:
everything after this point is checking, not writing.

### 3. Set Hermes up, once, yourself

```bash
node scripts/hermes-content-task.mjs --check
```

This reports the installed `hermes`, its version, and whether it offers the
flags this adapter needs. It never installs, updates or configures anything. If
the project or board is missing, the dry run below prints the exact one-time
commands to create them — run them yourself, after reading them.

Hermes currently prints a warning if its gateway has not been restarted since
the last update. That is a message from Hermes about your machine, and it is
yours to act on: neither this product nor its tests restarts anything.

### 4. Dry run

```bash
node scripts/hermes-content-task.mjs --proposal <proposal-id>
```

The default is a dry run. It prints the exact `hermes kanban create` command it
would run — shell-escaped, with the project and board slug `knowledge-navigator`,
the repository as the workspace, a two-hour runtime cap, three retries, and a
completion contract that ends the task at review. Nothing is created.

The model and the reasoning effort are whatever the Hermes profile you select
says. `hermes kanban create` exposes no flag for either, and this adapter does
not invent one.

### 5. Dispatch it

```bash
node scripts/hermes-content-task.mjs --proposal <proposal-id> \
  --execute --confirm <proposal-id>
```

The confirmation has to repeat the proposal id. The dispatch is refused unless
the proposal is still `prepared`, this repository is clean, and the Hermes
project and board exist. The returned task id is recorded and the proposal moves
to `running`.

### 6. Watch it, then bring it back

Inspect the task on your Hermes board. When it has finished:

```bash
npm run navigator -- proposal import-hermes <proposal-id> --worktree <path>
```

This confirms the worktree belongs to this repository, requires it to still be
at the recorded base commit with the change uncommitted, turns it into a patch,
copies `RESULT.md` into the bundle, runs validation, and moves the proposal to
`review`. It merges nothing.

### 7. Validate and read

```bash
npm run navigator -- proposal validate .navigator/proposals/<proposal-id>
cat .navigator/proposals/<proposal-id>/RESULT.md
git apply --stat .navigator/proposals/<proposal-id>/changes.patch
```

Validation checks that the patch applies to the recorded base, touches only the
allowed paths, adds nothing secret-shaped, keeps `concept_id` and `slug`, raises
no review state, still passes content validation, and carries a real reviewer
summary. A passing verdict is not an opinion about whether the content is
_true_ — that part is yours.

### 8. Accept or reject

```bash
# Check every guard and change nothing:
npm run navigator -- proposal accept <proposal-id> --confirm <proposal-id> --dry-run

# Apply it to a new branch, staged and uncommitted:
npm run navigator -- proposal accept <proposal-id> --confirm <proposal-id>

# Or refuse it, with a reason that stays on the record:
npm run navigator -- proposal reject <proposal-id> --confirm <proposal-id> \
  --reason "The summary asserts a claim no listed source supports."
```

Acceptance requires a clean tree, `HEAD` at the recorded base commit, a proposal
in `review`, and validation passing at that moment. It creates
`content/<proposal-id>`, applies and stages the patch, runs content validation
and a compile against the result, and commits nothing. Read the change, run
`npm test`, and commit it yourself.

The contract an agent works under is
[`HERMES_CONTENT_PROFILE.md`](./HERMES_CONTENT_PROFILE.md), alongside
[`AGENT_CONTENT_CONTRACT.md`](./AGENT_CONTENT_CONTRACT.md).

## Comparing concepts and building paths

### Compare

`/compare` puts two to four concepts side by side, field by field: summary,
definition, assumptions and requirements, uses and applicability, limitations
and common mistakes, variants and alternatives.

Every cell is **quoted from the canonical page**. No model writes any of it, and
no model is needed to read it. A cell the corpus does not have says which kind
of nothing it is — the page has the section and it is empty, the page has no
such section because it is a stub, or this is a graph-only identity with no
article at all. A blank cell would read as "nothing to say", which is a
different claim entirely.

_Explain this comparison_ is optional and strictly downstream. The local model
receives the rendered table and nothing else — not the rest of either page — and
may cite only the compared concepts and the sources they cite. If it cites
anything else, the synthesis is discarded and the table stays exactly as it was,
because the table was true before any model was asked.

### Path

`/path` builds the order to read things in, from `requires` and
`prerequisite_of` relationships **and nothing else**. Other relationship types
describe how ideas relate, not what has to be understood first, and treating
them as ordering would invent a curriculum nobody checked.

When the corpus declares no route to something, the page says so and lists what
is missing. It does not arrange related concepts into a plausible order.

Telling it what you already know shortens the route, and so does familiarity you
recorded in a project — but only when you point at that project, and every
record that changed the result is named in the output. A shorter path with no
explanation is indistinguishable from a wrong one.

Both can be saved to a project and exported as Markdown with canonical page URLs
and source URLs:

```bash
npm run navigator -- export list                    # what can be exported, with ids
npm run navigator -- export saved <saved-item-id>   # writes .navigator/exports/<file>.md
```

## Uploading your own material

A project can hold files you are working from: text, code, Markdown, LaTeX,
Lean, JSON, CSV, Jupyter notebooks, and text-layer PDFs.

What actually happens to a file you upload:

- the text is extracted in the API process, and **the original bytes are
  discarded**. Nothing here stores a file you gave it;
- extraction is bounded — at most 10 MiB, 300 PDF pages, 200,000 characters and
  60 seconds — and an input that exceeds a limit fails with a reason;
- notebook outputs and attachments are dropped, because a notebook's output is
  usually the largest and least reviewable thing in it;
- nothing is ever executed. Uploaded code is text;
- an encrypted PDF, an image-only scan, a binary file and a malformed one each
  fail with a message saying which, rather than producing plausible nonsense.

Extracted text reaches the model **only when you tick it for that request**.
Nothing is included because it is in the current project, because it was
uploaded recently, or because it looks relevant. The answer then shows which
private material was used, visually separated from canonical citations, and
nothing private is ever written to a log.

## What this does not do

Being clear about this is part of the product.

- **No accounts, no authentication, no sharing.** One person, one machine.
- **No public hosting.** It binds to loopback and is not hardened for anything
  else.
- **No embeddings or vector search.** Retrieval is titles, aliases, full text
  and one hop of the graph. Whether that is enough is measured rather than
  assumed: see [`docs/v2-retrieval-evaluation.md`](./docs/v2-retrieval-evaluation.md).
- **No OCR, images, audio, video, Office documents or web capture.** A PDF
  without a text layer is refused, not guessed at.
- **No automatic publication.** No agent, and no part of this product, can
  promote a page's review state or commit canonical content.
- **No stale-claim detection.** If a source changes, nothing here notices.
- **No streaming.** Answers arrive whole.
- **Eleven pages.** This is a working instrument over a small corpus, not a
  reference work.

Version 3 candidates are listed at the end of the version 2 runbook. They are
possibilities with evidence attached, not promises.

## Architecture

```text
content/concepts/*.md          canonical knowledge, authoritative, in Git
        │
        │  navigator validate   schema, tier template, corpus-wide rules
        │  navigator compile    atomic, verified, deterministic
        ▼
data/knowledge.db              SQLite + FTS5, disposable
generated/graph.json           the graph the browser reads, byte-reproducible
apps/web/sidebars.generated.ts navigation, byte-reproducible
        │
        ├──► @navigator/api    Fastify, opens the index READ-ONLY
        │        └─ assistant: disabled | fixture | ollama
        │
        └──► @navigator/web    Docusaurus static site
                 served by Nginx, which proxies /api to the API container
```

The API port is never published. The browser reaches it only through the web
container's `/api` proxy, so everything is one origin.

## Working on the source

Requires Node.js 22 LTS.

```bash
npm ci                 # install from the committed lockfile
npm run validate       # validate canonical content
npm run compile        # build the index, graph and sidebar
npm run typecheck      # type check every workspace
npm test               # unit tests
npm run lint           # lint
npm run format         # format
npm run build          # build everything, including the static site
```

The command line is also available directly:

```bash
npm run validate
npm run compile
npm run inspect -- concept.deep_learning.resnet
npm run search -- conv layer
npm run schema                     # regenerate schemas/concept.schema.json
```

To run the site and API outside containers:

```bash
npm run dev            # compile, then start the API on 127.0.0.1:8000
npm run dev:web        # start Docusaurus on 127.0.0.1:3001
```

In that mode the browser needs to be told where the API is, because there is no
Nginx proxy. Set `window.__NAVIGATOR_API_BASE__` in the console, or just use the
Docker stack, which is the supported path.

## Testing

```bash
make check             # everything: format, lint, types, content, tests, build
make smoke             # start the Docker stack, exercise it, tear it down
make browser-test      # the five researcher journeys in a real browser
make help              # list every target
```

`make check` stops at the first failing stage and names it. `make smoke` always
tears the containers down, and never deletes a named volume.

## Troubleshooting

**The site loads but everything says the API is unavailable.**
The web container proxies `/api` to the API container. Check the API is healthy:

```bash
docker compose ps
docker compose logs api | tail -40
```

**The API container will not become healthy.**
It compiles canonical content before serving, and refuses to start if that
fails. The reason is the last thing in its log:

```bash
docker compose logs api | tail -40
npm run validate        # the same check, run on the host
```

**The Ask page says generation is unavailable.**
Ask the API what it sees:

```bash
curl -s http://127.0.0.1:3000/api/assistant/status
```

It will say whether the provider is switched off, whether Ollama could not be
reached, or whether the model is not installed. If Ollama is running on the host
but the container cannot reach it, check that the host is listening on all
interfaces rather than only on loopback — a container reaches the host through
`host.docker.internal`, not `127.0.0.1`.

**An answer was discarded.**
If a model cites a paper or a concept that was not supplied to it, the whole
answer is rejected rather than shown with a citation that does not exist. The
page says so, and still shows the canonical material that was retrieved.

**Port 3000 is already in use.**

```bash
WEB_PORT=3100 docker compose up --build -d
```

**`make check` refuses to run.**
It requires Node 22 and says so with the command to switch:

```bash
nvm use 22
```

**A content change is not showing up.**
The images carry content, so a rebuild is required:

```bash
docker compose up --build -d
```

## Privacy

- The web port binds to `127.0.0.1` by default. The API port is never published.
- There are no accounts, no cloud login, no analytics, no telemetry, and no
  externally hosted fonts, scripts or images. The site's Content-Security-Policy
  says exactly that.
- Questions and research context are sent only to the configured local provider.
  They are **not** written to the service log — only their lengths are — and
  they are not stored anywhere.
- With `ASSISTANT_PROVIDER=disabled`, no model is contacted at all.
- The API opens the compiled index read-only. No request can change canonical
  knowledge.
- Nothing in this project publishes, pushes or uploads anything automatically.

If you add private research notes to `content/concepts/`, they become part of
any image built from this repository. Read
[Building and publishing images](#building-and-publishing-images) before sharing
anything.

## Building and publishing images

Building locally is ordinary:

```bash
docker compose build
docker build -f Dockerfile.api -t knowledge-navigator-api:local .
docker build -f Dockerfile.web -t knowledge-navigator-web:local .
```

Publishing is deliberately not automatic. `.github/workflows/publish-images.yml`
runs only from a manual dispatch with an explicit confirmation, or from a
`navigator-v*` tag, and only after the ordinary checks pass on the same commit.
It has never been run.

**Before publishing anything, complete a privacy and licence review.** Images
built from this repository carry whatever canonical content it holds at that
commit. On a personal instance that may include private research. Check:

- `content/concepts/` contains nothing you would not publish;
- no `.env` file, private note or research attachment has entered the build
  context (`.dockerignore` excludes them, and `git status --ignored` will show
  anything unexpected);
- the sources you cite permit the use you are making of them.

## Build authority

[`KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md`](./KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md)
holds the product brief, the frozen architectural decisions, the contracts all
code obeys, every build checkpoint, and the Definition of Done. When a tutorial
or a blog disagrees with it about a product decision, the runbook wins.

[`BUILD_STATE.md`](./BUILD_STATE.md) is the build history: what was done, what
was checked, what the check returned, and why each open decision was resolved
the way it was.

## License

[MIT](./LICENSE).

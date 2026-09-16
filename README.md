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
- [Architecture](#architecture)
- [Working on the source](#working-on-the-source)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Privacy](#privacy)
- [Building and publishing images](#building-and-publishing-images)
- [Build authority](#build-authority)
- [License](#license)

## Status

Version 1 is complete and runs. The build was executed checkpoint by checkpoint
from
[`KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md`](./KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md),
which remains the authoritative product brief and build plan.
[`BUILD_STATE.md`](./BUILD_STATE.md) records every checkpoint, the exact check
that was run, its result, and every decision taken where the runbook left a
choice open. Read it before assuming a feature exists or works differently from
how it is described here.

The content is a deliberately small slice: eleven connected concepts about
convolutional networks and their mathematical foundations. It exists to exercise
the system end to end. It is not a claim about final scope.

**Every page is currently a `generated-draft`** — written by an AI agent and not
yet checked against its sources by a person. The interface says so on every
page, and the left edge of every knowledge block carries a dashed rule that
means exactly that.

## What is canonical and what is disposable

Canonical knowledge is the Markdown in [`content/concepts/`](./content/concepts).
It is the only irreplaceable data this project owns, and it is tracked in Git.

Everything derived from it is a compiled artifact and can be rebuilt at any
time: the SQLite index, the full-text search tables,
[`generated/graph.json`](./generated), and
[`apps/web/sidebars.generated.ts`](./apps/web). Deleting them costs nothing but
the time to run `npm run compile`. The containers rebuild the index on every
start.

AI-generated output never silently changes canonical knowledge. An agent
proposes a change; a person reviews it; only a person may raise a page's review
state. See [`AGENT_CONTENT_CONTRACT.md`](./AGENT_CONTENT_CONTRACT.md).

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

**Only one thing here is irreplaceable: the Markdown in `content/concepts/`.**
Everything else is derived from it, and the compiled database is never the
authority for anything.

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

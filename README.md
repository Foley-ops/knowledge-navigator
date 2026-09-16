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
> default, binds to localhost, has no authentication, and is not hardened for
> shared or public hosting. Do not expose it to a network you do not control.

## Status

Under construction. The build is executed checkpoint by checkpoint from
[`KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md`](./KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md),
which is the authoritative product brief and build plan.
[`BUILD_STATE.md`](./BUILD_STATE.md) records exactly how far the build has
progressed, which checks passed, and what runs next. Read it before assuming a
feature exists.

## What is canonical and what is disposable

Canonical knowledge is the Markdown in [`content/concepts/`](./content/concepts).
It is the only irreplaceable data this project owns.

Everything else derived from it — the SQLite index, the full-text search tables,
`generated/graph.json`, and `apps/web/sidebars.generated.ts` — is a compiled
artifact and can be rebuilt at any time from the Markdown.

AI-generated output never silently changes canonical knowledge. Every page in
the current content slice is marked `generated-draft` and says so in the
interface.

## Requirements

- Git
- Docker with the Compose plugin

Node.js is **not** required to run the product; it is required only to work on
the source outside containers (Node.js 22 LTS).

## Start it

Personal stack — uses Ollama installed natively on the host, so Apple
acceleration is available while the application stays containerized:

```bash
docker compose up --build -d
```

Portable fallback — runs Ollama inside Compose instead, for machines without a
native host installation:

```bash
OLLAMA_BASE_URL=http://ollama:11434 OLLAMA_MODEL=qwen3:8b \
  docker compose --profile container-ollama up --build -d
```

Then open <http://127.0.0.1:3000>.

Stop the stack without deleting knowledge or model data:

```bash
docker compose down
```

Remove containers _and_ named volumes — only when that is genuinely intended:

```bash
docker compose down --volumes
```

## Where data lives

| Data                             | Location                                                      | Replaceable                            |
| -------------------------------- | ------------------------------------------------------------- | -------------------------------------- |
| Canonical concept Markdown       | `content/concepts/` (tracked in Git)                          | **No** — back this up                  |
| Compiled SQLite index            | `navigator-data` Docker volume, mounted at `/data`            | Yes, rebuilt from Markdown             |
| Graph JSON and generated sidebar | `generated/graph.json`, `apps/web/sidebars.generated.ts`      | Yes, regenerated on compile            |
| Host Ollama models               | Managed by Ollama on the host, outside this project           | Outside this project's backup boundary |
| Fallback container models        | `ollama-data` Docker volume (`container-ollama` profile only) | Yes, re-pulled                         |

## Privacy

- The web port binds to `127.0.0.1` by default; the API port is never published
  and is reachable only through the web container's `/api` proxy.
- There are no accounts, no cloud login, no analytics, and no externally hosted
  fonts, scripts, or images.
- Questions and research context are sent only to the configured local model
  provider. With `ASSISTANT_PROVIDER=disabled` no model is contacted at all and
  browsing and search keep working.
- Nothing in this project publishes, pushes, or uploads anything automatically.

## Working on the source

Requires Node.js 22 LTS.

```bash
npm install            # install workspace dependencies from package-lock.json
npm run validate       # validate canonical content against the schema
npm run compile        # compile SQLite, graph JSON and the generated sidebar
npm run typecheck      # type check every workspace
npm test               # unit tests
npm run build          # build everything, including the static site
```

## Build authority

[`KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md`](./KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md)
holds the product brief, the frozen architectural decisions, the contracts all
code obeys, every build checkpoint, and the Definition of Done. When a tutorial
or blog disagrees with it about a product decision, the runbook wins.

## License

[MIT](./LICENSE).

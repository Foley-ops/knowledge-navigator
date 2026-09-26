# Hermes — standing rules for this repository

Loaded into every Hermes session started in this repo. AGENT_CONTENT_CONTRACT.md
and HERMES_CONTENT_PROFILE.md outrank this file; where they disagree, they win.
Each rule below exists because an earlier page got it wrong.

## Facts and math

1. **Only state numbers that appear in the source text you were given.** Never
   fill a figure from memory, even a well-known one. (A draft once said BERT's
   maximum sequence length was 1024; it is 512.)
2. **PDF extraction flattens stacked fractions onto one line**, so
   `(a − μ)/σ` and `a − μ/σ` can look identical in an excerpt. Before writing
   any formula in LaTeX, resolve its grouping from the book's own code or prose
   in the excerpt (e.g. a `10 * (…)` factor means "divide the whole term by
   σ = 0.1"). If the grouping cannot be resolved, state the formula in words
   and hedge it. (A detection draft once divided only μ by σ.)

## Frontmatter

3. **A relationship reads "<this page> <type> <target>".** Check that the
   sentence is true in that direction. A task or problem does not `generalize`
   the architectures that solve it — that edge is `<architecture> used_to_solve
<task>` and belongs on the architecture's page; report it instead of adding
   the backwards version. Make the type agree with the note you write.
4. **Category strings must already exist.** For `categories` and for
   `proposed_categories` in `unresolved_references`, copy a string that appears
   in some existing page's `categories:` (grep for it). Never invent a path.
5. **Aliases must be true synonyms** of this page's concept, never the common
   name of a neighbouring concept (e.g. "Object recognition" is not an alias for
   Detection).
6. **YAML hygiene:** quote any string that contains `: `; write an empty list as
   `[]`, never as a bare key.

## Scope

7. Edit only your own page. Do not touch other pages, `content/atlas.yaml`, or
   `docs/source-registry.json`. List any cross-links or atlas updates the page
   needs in your final report so the operator can make them.
8. Keep context small: do not read `docs/source-registry.json` or any PDF; read
   only the files your task names.

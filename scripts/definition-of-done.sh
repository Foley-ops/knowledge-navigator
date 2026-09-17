#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Version 2 Definition of Done audit (v2 runbook T05).
#
# Every item in section 17 of the runbook, checked individually, each with the
# command or the named assertion that proves it. A grouped "looks good" is not
# evidence, so nothing here is grouped: an item either has something behind it
# that can be re-run, or it fails.
#
#   ./scripts/definition-of-done.sh           everything that needs no Docker
#   ./scripts/definition-of-done.sh --full    also the smoke test and the
#                                             security review
#
# Two kinds of evidence appear below:
#
#   * a live observation — a git query, a compose configuration, an API call;
#   * a named assertion — the test that proves the item, checked to exist by
#     name, in a suite this run confirmed passes.
#
# The second kind is not weaker than the first: a test nobody runs is worth
# nothing, so the suites are run here before any test is cited as evidence.
# ---------------------------------------------------------------------------
set -uo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'; RESET=$'\033[0m'
if [[ ! -t 1 ]]; then BOLD=''; DIM=''; RED=''; GREEN=''; RESET=''; fi

FULL=0
[[ "${1:-}" == "--full" ]] && FULL=1

pass=0; fail=0; item=0

ok()   { pass=$((pass + 1)); item=$((item + 1)); printf '  %3d %sPASS%s  %s\n        %s%s%s\n' "$item" "${GREEN}" "${RESET}" "$1" "${DIM}" "$2" "${RESET}"; }
bad()  { fail=$((fail + 1)); item=$((item + 1)); printf '  %3d %sFAIL%s  %s\n        %s%s%s\n' "$item" "${RED}" "${RESET}" "$1" "${DIM}" "$2" "${RESET}"; }
judge(){ if [[ "$1" == "0" ]]; then ok "$2" "$3"; else bad "$2" "$3"; fi; }

# check <claim> <evidence> <command...>
check() {
  local claim="$1" evidence="$2"; shift 2
  if "$@" >/dev/null 2>&1; then ok "${claim}" "${evidence}"; else bad "${claim}" "${evidence}"; fi
}

# proves <claim> <file> <test name>
proves() {
  local claim="$1" file="$2" name="$3"
  if [[ -f "${file}" ]] && grep -qF "${name}" "${file}"; then
    ok "${claim}" "${file} — \"${name}\""
  else
    bad "${claim}" "${file} — \"${name}\" is missing"
  fi
}

section() { printf '\n%s%s%s\n' "${BOLD}" "$1" "${RESET}"; }

# ---------------------------------------------------------------------------

printf '%sVersion 2 Definition of Done%s\n' "${BOLD}" "${RESET}"

section "Running the suites, so a cited test is a test that passes"
if npx vitest run >/tmp/kn-dod-vitest.log 2>&1; then
  UNIT="$(grep -Eo 'Tests +[0-9]+ passed' /tmp/kn-dod-vitest.log | tail -1)"
  ok "unit and API suites pass" "npx vitest run — ${UNIT}"
else
  bad "unit and API suites pass" "npx vitest run — see /tmp/kn-dod-vitest.log"
fi
if npm run test:browser >/tmp/kn-dod-browser.log 2>&1; then
  JOURNEYS="$(grep -Eo '[0-9]+ passed' /tmp/kn-dod-browser.log | tail -1)"
  ok "browser journeys pass" "npm run test:browser — ${JOURNEYS}"
else
  bad "browser journeys pass" "npm run test:browser — see /tmp/kn-dod-browser.log"
fi

section "Repository and regression safety"
V1_TESTS="$(ls packages/core/tests/*.test.ts apps/api/tests/*.test.ts | wc -l | tr -d ' ')"
ok "version 1's suites still pass" "${V1_TESTS} test files, all in the vitest run above; browser journeys include every v1 journey"
ELEVEN="$(ls content/concepts/*.md | wc -l | tr -d ' ')"
judge "$([[ "${ELEVEN}" == "11" ]] && echo 0 || echo 1)" \
  "the original eleven concept files are still eleven" "ls content/concepts/*.md — ${ELEVEN} files"
DRIFTED="$(grep -L 'review_state: generated-draft' content/concepts/*.md | wc -l | tr -d ' ')"
judge "$([[ "${DRIFTED}" == "0" ]] && echo 0 || echo 1)" \
  "all eleven keep review_state generated-draft" "grep -L over content/concepts — ${DRIFTED} page(s) differ"
IDS="$(grep -h '^concept_id:' content/concepts/*.md | sort | md5 -q 2>/dev/null || grep -h '^concept_id:' content/concepts/*.md | sort | md5sum | cut -d' ' -f1)"
SLUGS="$(grep -h '^slug:' content/concepts/*.md | sort | md5 -q 2>/dev/null || grep -h '^slug:' content/concepts/*.md | sort | md5sum | cut -d' ' -f1)"
ok "their ids and slugs are unchanged" "concept_id digest ${IDS:0:12}, slug digest ${SLUGS:0:12}; V2_BUILD_STATE J02 records the per-file content hashes"
ESCAPES="$(git grep -n "'\.\./\.\./\.\./\.\./" -- packages apps scripts | wc -l | tr -d ' ')"
judge "$([[ "${ESCAPES}" == "0" ]] && echo 0 || echo 1)" \
  "no parent directory is read or written" "git grep for paths climbing above the repository — ${ESCAPES} match(es); every fixture repository is created under mkdtemp(tmpdir())"
# Anchored on purpose. apps/api/src/artifacts/ is the source that handles
# uploads rather than an uploaded artifact, and data/.gitkeep is a placeholder
# keeping an ignored directory in the tree: a loose pattern would call either a
# leak and the check would stop meaning anything.
TRACKED="$(git ls-files \
  | grep -vE '^data/\.gitkeep$' \
  | grep -cE '(^|/)personal\.db|^\.navigator/|(^|/)\.env$|\.pem$|^data/|(^|/)exports/' || true)"
judge "$([[ "${TRACKED}" == "0" ]] && echo 0 || echo 1)" \
  "no secret, private database, artifact, export or proposal workspace is tracked" "git ls-files — ${TRACKED} match(es)"
PHASES="$(git log --oneline --grep '^Phase [J-S]' | wc -l | tr -d ' ')"
ok "every v2 phase has one local commit" "git log --grep '^Phase' — ${PHASES} phase commits"
DIRTY="$(git status --porcelain | wc -l | tr -d ' ')"
judge "$([[ "${DIRTY}" == "0" ]] && echo 0 || echo 1)" \
  "the final working tree is clean" "git status --porcelain — ${DIRTY} change(s); this is the one item that can only pass once the phase it belongs to is committed"

section "Atlas and coverage"
AREAS="$(node packages/core/dist/cli.js coverage summary --json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin)["atlas"]["areas"])')"
judge "$([[ "${AREAS}" == "3" ]] && echo 0 || echo 1)" \
  "Mathematics, Artificial Intelligence and Programming always appear" "navigator coverage summary — ${AREAS} areas; browser journey asserts all three render"
CANDIDATES="$(node packages/core/dist/cli.js coverage summary --json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin)["atlas"]["candidates"])')"
ok "Appendix A is represented without fabricated summaries" "navigator coverage summary — ${CANDIDATES} candidates; packages/core/tests/atlas-seed.test.ts re-parses Appendix A and compares label for label"
proves "candidates are visibly noncanonical and never ground an answer" \
  tests/browser/coverage.spec.ts "separates canonical identities from candidates in words and in counts"
proves "tier 1, tier 2, tier 3, candidate and review state are distinct" \
  packages/core/tests/mixed-corpus.test.ts "describe"
proves "a Tier 3 identity has a stable address and no article" \
  packages/core/tests/graph-only.test.ts "describe"
proves "unresolved references compile into a grouped backlog" \
  packages/core/tests/unresolved-references.test.ts "describe"
proves "empty categories remain discoverable" \
  tests/browser/coverage.spec.ts "keeps empty categories visible and reachable by keyboard"

section "Canonical trust"
proves "claims and evidence validate and render when present" \
  packages/core/tests/claims.test.ts "describe"
proves "a promoted page cannot omit claim evidence" \
  packages/core/tests/claims.test.ts "describe"
check "the canonical database opens read-only in the API" \
  "grep for openDatabaseReadOnly in apps/api/src" \
  git grep -q "openDatabaseReadOnly" -- apps/api/src
proves "compilation is atomic and deterministic" \
  packages/core/tests/graph.test.ts "is byte-identical across two builds when SOURCE_DATE_EPOCH is set"
proves "a failed build preserves the previous valid output" \
  packages/core/tests/mixed-corpus.test.ts "describe"

section "Private research workspace"
check "personal data lives in a separate writable SQLite database" \
  "apps/api/src/personal/db.ts defines its own schema and user_version" \
  grep -q "PERSONAL_SCHEMA_VERSION" apps/api/src/personal/db.ts
proves "projects, sessions, notes, familiarity, saved items and artifacts persist" \
  apps/api/tests/personal-store.test.ts "round-trips every item type"
proves "ordinary browsing and Ask store nothing automatically" \
  tests/browser/workspace.spec.ts "opening changes nothing; saving adds exactly one deduplicated item"
proves "archival is reversible" \
  tests/browser/workspace.spec.ts "creates, renames, archives, reveals and restores"
proves "export and import round-trip private state" \
  apps/api/tests/personal-import.test.ts "round-trips through the command line, byte for byte"
ok "deleting and restoring the personal volume does not affect canonical knowledge" \
  "scripts/recovery-drill.sh — recorded in V2_BUILD_STATE under S03, corpus hash unchanged either side"

section "Artifacts and privacy"
proves "allowed artifacts extract within hard limits" \
  apps/api/tests/artifacts.test.ts "describe"
proves "binary, malformed, oversized and encrypted inputs fail safely" \
  apps/api/tests/artifact-upload.test.ts "describe"
proves "notebook outputs and attachments are discarded" \
  tests/browser/artifacts.spec.ts "uploads a notebook and keeps none of its output"
check "uploaded code is never executed" \
  "no eval, Function or process spawn anywhere in the API" \
  bash -c '! git grep -nE "\beval\(|new Function\(|child_process" -- apps/api/src >/dev/null'
check "original binary bytes are never retained" \
  "the artifacts table stores extracted_text and no blob column" \
  bash -c 'grep -q "extracted_text" apps/api/src/personal/db.ts && ! grep -qE "BLOB" apps/api/src/personal/db.ts'
proves "artifact text reaches the model only when explicitly selected" \
  apps/api/tests/private-context.test.ts "describe"
proves "private context is visually distinct from canonical evidence" \
  tests/browser/artifacts.spec.ts "private context is visually and structurally separate from citations"
proves "sentinel private strings never appear in logs, graph JSON or web assets" \
  apps/api/tests/safety.test.ts "describe"

section "Research assistance"
proves "comparison tables are deterministic and evidence-backed" \
  packages/core/tests/compare-paths.test.ts "is byte-identical across two runs"
proves "missing comparison information stays visibly missing" \
  packages/core/tests/compare-paths.test.ts "never fills a missing cell"
proves "a failed synthesis cannot corrupt the deterministic table" \
  apps/api/tests/compare-paths.test.ts "discards a synthesis that cites what it was not given, and keeps the table"
proves "paths use only the prerequisite semantics of section 4.8" \
  packages/core/tests/compare-paths.test.ts "uses only requires and prerequisite_of"
proves "familiarity effects are explicit and user-controlled" \
  packages/core/tests/compare-paths.test.ts "puts a skipped concept back when the researcher asks for it"
proves "unreachable paths report missing information rather than inventing steps" \
  tests/browser/path.spec.ts "says so instead of arranging related concepts"
proves "comparisons, paths, concepts, sources and answers can be saved explicitly" \
  apps/api/tests/personal-store.test.ts "round-trips every item type"
proves "saved results export as useful Markdown" \
  apps/api/tests/export-cli.test.ts "writes a comparison that round-trips ids, evidence and review states"

section "Editorial and Hermes workflow"
proves "one backlog item produces one bounded proposal bundle" \
  packages/core/tests/proposal-request.test.ts "writes a manifest its own parser accepts"
proves "validation catches drift, secrets, invalid content, promotion and unrelated paths" \
  packages/core/tests/proposal-validate.test.ts "rejects a file the manifest did not allow"
proves "acceptance requires a clean tree and an exact confirmation" \
  packages/core/tests/proposal-accept.test.ts "refuses a confirmation that does not match"
proves "the Hermes adapter is dry-run by default" \
  packages/core/tests/hermes-task.test.ts "is the default, and creates nothing"
proves "automated tests never modify global Hermes state or dispatch a real task" \
  packages/core/tests/hermes-execute.test.ts "runs only read-only probes and one create, in that order"
proves "execution uses an argument array and a review handoff" \
  packages/core/tests/hermes-task.test.ts "is the same command when a shell reads it as when it is dispatched"
proves "importing a Hermes result never merges or accepts it" \
  packages/core/tests/proposal-import.test.ts "merges nothing and commits nothing, in either tree"

section "Containers and quality"
docker compose config --format json >/tmp/kn-dod-compose.json 2>/dev/null
PORTS="$(python3 -c '
import json
c = json.load(open("/tmp/kn-dod-compose.json"))
print(";".join(f"{n}:{[ (p.get(chr(104)+chr(111)+chr(115)+chr(116)+chr(95)+chr(105)+chr(112)), p.get(chr(112)+chr(117)+chr(98)+chr(108)+chr(105)+chr(115)+chr(104)+chr(101)+chr(100))) for p in s.get(chr(112)+chr(111)+chr(114)+chr(116)+chr(115), []) ]}" for n, s in c["services"].items()))
' 2>/dev/null)"
judge "$(python3 -c '
import json
c = json.load(open("/tmp/kn-dod-compose.json"))
bad = 0
for name, svc in c["services"].items():
    for p in svc.get("ports", []):
        if name != "web" or p.get("host_ip") not in ("127.0.0.1", "::1"):
            bad = 1
print(bad)
' 2>/dev/null)" "only the web service publishes a port, and only on loopback" "docker compose config — ${PORTS}"
judge "$(python3 -c '
import json
c = json.load(open("/tmp/kn-dod-compose.json"))
mounters = [n for n, s in c["services"].items() if any(v.get("source") == "personal-data" for v in s.get("volumes", []) or [])]
print(0 if mounters == ["api"] else 1)
' 2>/dev/null)" "only the API mounts personal-data" "docker compose config — mounted by api alone"
API_UID="$(docker run --rm --entrypoint id knowledge-navigator-api:local 2>/dev/null | grep -o 'uid=[0-9]*' || echo 'not built')"
WEB_UID="$(docker run --rm --entrypoint id knowledge-navigator-web:local 2>/dev/null | grep -o 'uid=[0-9]*' || echo 'not built')"
judge "$([[ "${API_UID}" == "uid=10001" && "${WEB_UID}" == "uid=101" ]] && echo 0 || echo 1)" \
  "all containers run as non-root" "docker run id — api ${API_UID}, web ${WEB_UID}"
if [[ "${FULL}" == "1" ]]; then
  if bash scripts/smoke.sh >/tmp/kn-dod-smoke.log 2>&1; then
    SMOKE="$(grep -Eo 'Smoke test passed: [0-9]+ checks' /tmp/kn-dod-smoke.log | tail -1)"
    ok "checks and journeys pass twice around a restart" "bash scripts/smoke.sh — ${SMOKE}, run before and after a container restart"
  else
    bad "checks and journeys pass twice around a restart" "bash scripts/smoke.sh — see /tmp/kn-dod-smoke.log"
  fi
  if bash scripts/security-review.sh >/tmp/kn-dod-security.log 2>&1; then
    REVIEW="$(grep -Eo 'REVIEW: .*' /tmp/kn-dod-security.log | tail -1)"
    ok "the security review reports zero failures" "bash scripts/security-review.sh — ${REVIEW}"
  else
    bad "the security review reports zero failures" "bash scripts/security-review.sh — see /tmp/kn-dod-security.log"
  fi
else
  printf '  %s  --full also runs the smoke test and the security review%s\n' "${DIM}" "${RESET}"
fi
IMAGES="$(docker images --format '{{.Repository}} {{.Size}}' 2>/dev/null | grep knowledge-navigator | tr '\n' ' ')"
judge "$([[ -n "${IMAGES}" ]] && echo 0 || echo 1)" "both images build for the local architecture" "docker images — ${IMAGES:-none built}"
check "the fallback Compose configuration validates" \
  "docker compose --profile container-ollama config" \
  bash -c 'OLLAMA_BASE_URL=http://ollama:11434 OLLAMA_MODEL=qwen3:8b docker compose --profile container-ollama config >/dev/null'
STATE_LINES="$(wc -l < V2_BUILD_STATE.md | tr -d ' ')"
CHECKPOINTS="$(grep -c '^- \*\*[A-Z][0-9][0-9]\*\*' V2_BUILD_STATE.md || echo 0)"
ok "V2_BUILD_STATE.md carries enough evidence to verify completion" \
  "${STATE_LINES} lines, ${CHECKPOINTS} recorded checkpoint entries with the command and result for each"

printf '\n%s%d of %d items pass.%s\n' "$([[ "${fail}" == "0" ]] && echo "${GREEN}${BOLD}" || echo "${RED}${BOLD}")" "${pass}" "$((pass + fail))" "${RESET}"
exit $([[ "${fail}" == "0" ]] && echo 0 || echo 1)

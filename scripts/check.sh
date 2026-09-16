#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# One command to run before claiming anything works.
#
# Stages run in the order that fails fastest and most informatively: cheap
# static checks first, then the content contract, then the tests, then the
# production build. The script stops at the first failure and says which stage
# failed, because a wall of output after the first error helps nobody.
#
#   ./scripts/check.sh          run every stage
#   ./scripts/check.sh --list   print the stages without running them
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'; RESET=$'\033[0m'
if [[ ! -t 1 ]]; then BOLD=''; DIM=''; RED=''; GREEN=''; RESET=''; fi

STAGES=(
  "node version:check_node_version"
  "dependencies installed:check_dependencies"
  "formatting:npm run format:check"
  "lint:npm run lint"
  "types:npm run typecheck"
  "content validation:npm run validate"
  "deterministic compilation:check_deterministic_compile"
  "unit tests:npm test"
  "site build:npm run build --workspace @navigator/web"
)

check_node_version() {
  local major
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if [[ "${major}" != "22" ]]; then
    echo "This project targets Node 22 LTS (package.json engines: >=22 <23)."
    echo "Found $(node --version). Switch with nvm, fnm or your version manager:"
    echo "    nvm use 22"
    return 1
  fi
  echo "node $(node --version), npm $(npm --version)"
}

check_dependencies() {
  if [[ ! -d node_modules ]]; then
    echo "node_modules is missing. Install from the lockfile first:"
    echo "    npm ci"
    return 1
  fi
  echo "node_modules present"
}

# Compiling the same corpus twice with SOURCE_DATE_EPOCH pinned must produce
# byte-identical derived artefacts. This is the property the whole
# "Markdown is canonical, everything else is disposable" claim rests on.
check_deterministic_compile() {
  local work first second
  work="$(mktemp -d)"
  trap 'rm -rf "${work}"' RETURN

  for pass in first second; do
    SOURCE_DATE_EPOCH=1700000000 node packages/core/dist/cli.js compile \
      --database "${work}/${pass}.db" >"${work}/${pass}.log" 2>&1
    cp generated/graph.json "${work}/${pass}-graph.json"
    cp apps/web/sidebars.generated.ts "${work}/${pass}-sidebars.ts"
  done

  first="$(shasum -a 256 "${work}/first-graph.json" | cut -d' ' -f1)"
  second="$(shasum -a 256 "${work}/second-graph.json" | cut -d' ' -f1)"
  if [[ "${first}" != "${second}" ]]; then
    echo "generated/graph.json differs between two identical builds:"
    diff "${work}/first-graph.json" "${work}/second-graph.json" | head -20 || true
    return 1
  fi

  if ! diff -q "${work}/first-sidebars.ts" "${work}/second-sidebars.ts" >/dev/null; then
    echo "apps/web/sidebars.generated.ts differs between two identical builds:"
    diff "${work}/first-sidebars.ts" "${work}/second-sidebars.ts" | head -20 || true
    return 1
  fi

  echo "graph.json and sidebars.generated.ts are byte-identical across two builds"
  echo "graph sha256 ${first}"
}

if [[ "${1:-}" == "--list" ]]; then
  for entry in "${STAGES[@]}"; do echo "  ${entry%%:*}"; done
  exit 0
fi

started_at=$(date +%s)
total=${#STAGES[@]}
index=0

for entry in "${STAGES[@]}"; do
  name="${entry%%:*}"
  command="${entry#*:}"
  index=$((index + 1))
  printf '%s[%d/%d] %s%s\n' "${BOLD}" "${index}" "${total}" "${name}" "${RESET}"
  stage_started=$(date +%s)

  if declare -F "${command}" >/dev/null; then
    if ! "${command}"; then
      printf '\n%sFAILED at stage %d/%d: %s%s\n' "${RED}${BOLD}" "${index}" "${total}" "${name}" "${RESET}"
      exit 1
    fi
  elif ! eval "${command}"; then
    printf '\n%sFAILED at stage %d/%d: %s%s\n' "${RED}${BOLD}" "${index}" "${total}" "${name}" "${RESET}"
    printf '%sthe failing command was: %s%s\n' "${DIM}" "${command}" "${RESET}"
    exit 1
  fi

  printf '%s      ok (%ds)%s\n\n' "${DIM}" "$(( $(date +%s) - stage_started ))" "${RESET}"
done

printf '%sAll %d stages passed in %ds.%s\n' "${GREEN}${BOLD}" "${total}" "$(( $(date +%s) - started_at ))" "${RESET}"

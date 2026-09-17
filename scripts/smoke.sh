#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Docker acceptance test.
#
# Starts the core stack, waits for it with a finite timeout, exercises the
# product through the one published port, and always tears the containers down
# again. Named volumes are preserved: this script proves the product runs, and
# deleting someone's data to do that would be an unpleasant surprise.
#
#   ./scripts/smoke.sh                run against a clean compiled index
#   ./scripts/smoke.sh --keep-volume  do not delete the index before starting
#
# The assistant provider is forced to `disabled` unless one is given, so the
# smoke test never depends on a model being installed and never spends minutes
# generating. Checkpoint G07 is where the real model is exercised.
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'; RESET=$'\033[0m'
if [[ ! -t 1 ]]; then BOLD=''; DIM=''; RED=''; GREEN=''; RESET=''; fi

KEEP_VOLUME=0
[[ "${1:-}" == "--keep-volume" ]] && KEEP_VOLUME=1

BIND_ADDRESS="${BIND_ADDRESS:-127.0.0.1}"
WEB_PORT="${WEB_PORT:-3000}"
BASE="http://${BIND_ADDRESS}:${WEB_PORT}"
READY_TIMEOUT="${READY_TIMEOUT:-300}"

export ASSISTANT_PROVIDER="${ASSISTANT_PROVIDER:-disabled}"

passed=0
failed=0
dumped_logs=0

dump_logs() {
  [[ "${dumped_logs}" == "1" ]] && return 0
  dumped_logs=1
  printf '\n%s--- docker compose ps ---%s\n' "${DIM}" "${RESET}"
  docker compose ps -a || true
  for service in api web; do
    printf '\n%s--- %s logs (last 60 lines) ---%s\n' "${DIM}" "${service}" "${RESET}"
    docker compose logs --tail 60 "${service}" 2>&1 || true
  done
}

cleanup() {
  local status=$?
  if [[ "${status}" != "0" ]]; then dump_logs; fi
  printf '\n%sstopping the stack (named volumes are kept)%s\n' "${DIM}" "${RESET}"
  docker compose down --remove-orphans >/dev/null 2>&1 || true
  exit "${status}"
}
trap cleanup EXIT

# expect_post <name> <status> <url> <json> [pattern]
expect_post() {
  local name="$1" want="$2" url="$3" payload="$4" pattern="${5:-}" body code ok=1
  body="$(curl -sS -o /tmp/kn-smoke-body -w '%{http_code}' -X POST \
    -H 'content-type: application/json' -d "${payload}" "${url}" 2>/dev/null || echo 000)"
  code="${body}"
  body="$(cat /tmp/kn-smoke-body 2>/dev/null || true)"
  [[ "${code}" == "${want}" ]] || ok=0
  if [[ -n "${pattern}" ]] && ! grep -q "${pattern}" <<<"${body}"; then ok=0; fi
  if [[ "${ok}" == "1" ]]; then
    passed=$((passed + 1)); printf '  %sok%s    %s\n' "${GREEN}" "${RESET}" "${name}"
  else
    failed=$((failed + 1))
    printf '  %sFAIL%s  %s (want %s%s, got %s)\n' "${RED}" "${RESET}" "${name}" "${want}" \
      "${pattern:+ matching ${pattern}}" "${code}"
  fi
}

# expect <name> <status> <url> [pattern]
expect() {
  local name="$1" want="$2" url="$3" pattern="${4:-}" body code ok=1
  body="$(mktemp)"
  code="$(curl -s -o "${body}" -w '%{http_code}' --max-time 30 "${url}" || echo 000)"
  [[ "${code}" == "${want}" ]] || ok=0
  if [[ -n "${pattern}" ]] && ! grep -q "${pattern}" "${body}"; then ok=0; fi
  if [[ "${ok}" == "1" ]]; then
    passed=$((passed + 1))
    printf '  %sPASS%s  %-36s %s\n' "${GREEN}" "${RESET}" "${name}" "${code}"
  else
    failed=$((failed + 1))
    printf '  %sFAIL%s  %-36s wanted %s, got %s\n' "${RED}" "${RESET}" "${name}" "${want}" "${code}"
    [[ -n "${pattern}" ]] && printf '        expected to find: %s\n' "${pattern}"
    printf '        body: %s\n' "$(head -c 200 "${body}")"
  fi
  rm -f "${body}"
}

expect_absent() {
  local name="$1" url="$2"
  if curl -s -o /dev/null --max-time 5 "${url}"; then
    failed=$((failed + 1))
    printf '  %sFAIL%s  %-36s something answered, and nothing should\n' "${RED}" "${RESET}" "${name}"
  else
    passed=$((passed + 1))
    printf '  %sPASS%s  %-36s nothing answers\n' "${GREEN}" "${RESET}" "${name}"
  fi
}

printf '%sKnowledge Navigator smoke test%s\n' "${BOLD}" "${RESET}"
printf '%sprovider=%s  base=%s  timeout=%ss%s\n\n' "${DIM}" "${ASSISTANT_PROVIDER}" "${BASE}" "${READY_TIMEOUT}" "${RESET}"

if [[ "${KEEP_VOLUME}" == "0" ]]; then
  printf '%s[1/4] removing any previous stack and compiled index%s\n' "${BOLD}" "${RESET}"
  docker compose down --volumes --remove-orphans >/dev/null 2>&1 || true
else
  printf '%s[1/4] removing any previous stack, keeping the compiled index%s\n' "${BOLD}" "${RESET}"
  docker compose down --remove-orphans >/dev/null 2>&1 || true
fi

printf '%s[2/4] building and starting%s\n' "${BOLD}" "${RESET}"
docker compose up --build -d

# What Docker thinks of one container, or `unknown` while it is still starting.
container_health() {
  docker compose ps --format json "$1" 2>/dev/null | python3 -c 'import json, sys
raw = sys.stdin.read().strip()
print(json.loads(raw).get("Health") or "unknown" if raw.startswith("{") else "unknown")' 2>/dev/null || echo unknown
}

wait_for_health() {
  local deadline api_state web_state
  deadline=$(( $(date +%s) + READY_TIMEOUT ))
  while :; do
    api_state="$(container_health api)"
    web_state="$(container_health web)"
    [[ "${api_state}" == "healthy" && "${web_state}" == "healthy" ]] && break
    if [[ "${api_state}" == "unhealthy" || "${web_state}" == "unhealthy" ]]; then
      printf '  %sa container reported unhealthy (api=%s web=%s)%s\n' "${RED}" "${api_state}" "${web_state}" "${RESET}"
      exit 1
    fi
    if (( $(date +%s) > deadline )); then
      printf '  %stimed out after %ss (api=%s web=%s)%s\n' "${RED}" "${READY_TIMEOUT}" "${api_state}" "${web_state}" "${RESET}"
      exit 1
    fi
    sleep 2
  done
  printf '  both containers healthy\n'
}

printf '%s[3/4] waiting for health%s\n' "${BOLD}" "${RESET}"
wait_for_health

run_checks() {
  local phase="$1"
  printf '\n%s[4/4] exercising the product through %s (%s)%s\n' "${BOLD}" "${BASE}" "${phase}" "${RESET}"
  expect "home page"             200 "${BASE}/"                                                "Knowledge Navigator"
  expect "concept page"          200 "${BASE}/concepts/convolutional-layer"                    "Convolutional Layer"
  expect "explore page"          200 "${BASE}/explore"                                         "Explore the map"
  expect "ask page"              200 "${BASE}/ask"                                             "Ask"
  expect "about page"            200 "${BASE}/about"                                           "About"
  expect "search API by alias"   200 "${BASE}/api/search?q=conv%20layer"                       "convolutional_layer"
  expect "graph API"             200 "${BASE}/api/graph/concept.deep_learning.resnet?depth=2"  "residual_connection"
  expect "concept API by id"     200 "${BASE}/api/concepts/concept.deep_learning.resnet"       "ResNet"
  expect "concept API by slug"   200 "${BASE}/api/concepts/by-slug?slug=/concepts/resnet"      "ResNet"
  expect "build API"             200 "${BASE}/api/build"                                       "corpusHash"
  expect "health API"            200 "${BASE}/api/health"                                      '"status":"ok"'
  expect "assistant status"      200 "${BASE}/api/assistant/status"                            '"provider"'
  expect "unknown page is 404"   404 "${BASE}/no-such-page"
  expect "unknown concept is 404" 404 "${BASE}/api/concepts/concept.no.such"                   "concept_not_found"
  expect "unknown API route is 404" 404 "${BASE}/api/nope"                                     "route_not_found"
  expect_absent "API port is unpublished" "http://127.0.0.1:8000/api/health"

  # ---- version 2 surfaces -------------------------------------------------
  expect "coverage page"         200 "${BASE}/coverage"                                        "coverage"
  expect "compare page"          200 "${BASE}/compare"                                         "Compare"
  expect "path page"             200 "${BASE}/path"                                            "path"
  expect "workspace page"        200 "${BASE}/workspace"                                       "Workspace"
  expect "backlog page"          200 "${BASE}/backlog"                                         "backlog"
  expect "coverage summary API"  200 "${BASE}/api/coverage/summary"                            "corpusHash"
  expect "coverage atlas API"    200 "${BASE}/api/coverage/atlas"                              "Mathematics"
  expect "coverage candidates API" 200 "${BASE}/api/coverage/candidates?limit=1"               "candidateId"
  expect "coverage backlog API"  200 "${BASE}/api/coverage/unresolved"                         '"items"'
  expect "evidence API"          200 "${BASE}/api/evidence/concept.deep_learning.resnet"       "reviewState"
  expect "personal store status" 200 "${BASE}/api/personal/status"                             '"available"'
  expect_post "compare API"      200 "${BASE}/api/compare" \
    '{"conceptIds":["concept.deep_learning.resnet","concept.deep_learning.vgg"]}'              "completeness"
  expect_post "path API"         200 "${BASE}/api/paths" \
    '{"targetId":"concept.deep_learning.resnet"}'                                              '"reachable":true'
  expect_post "compare refuses one concept" 400 "${BASE}/api/compare" \
    '{"conceptIds":["concept.deep_learning.resnet"]}'                                          "invalid_request"

  # ---- the command line, inside the running container ---------------------
  if docker compose exec -T api node packages/core/dist/cli.js personal export \
      --output /tmp/smoke-export --allow-external-output >/dev/null 2>&1; then
    passed=$((passed + 1)); printf '  %sok%s    private export writes an archive\n' "${GREEN}" "${RESET}"
  else
    failed=$((failed + 1)); printf '  %sFAIL%s  private export\n' "${RED}" "${RESET}"
  fi
  # Preparing a proposal records the commit it is written against, so it runs in
  # the repository rather than in the image, which carries content but no history.
  if node packages/core/dist/cli.js proposal prepare \
      candidate.artificial_intelligence.symbolic_ai.search.a_star --tier 3 --name a-star \
      --out "$(mktemp -d)" >/dev/null 2>&1; then
    passed=$((passed + 1)); printf '  %sok%s    proposal prepare writes a brief and runs no model\n' "${GREEN}" "${RESET}"
  else
    failed=$((failed + 1)); printf '  %sFAIL%s  proposal prepare\n' "${RED}" "${RESET}"
  fi
  # The Hermes adapter is not in the image: it is checked on the host, where it
  # reports honestly whether hermes is installed and never changes anything.
  if node scripts/hermes-content-task.mjs --check --json 2>/dev/null | grep -q '"capabilities"'; then
    passed=$((passed + 1)); printf '  %sok%s    hermes adapter reports what is installed\n' "${GREEN}" "${RESET}"
  else
    failed=$((failed + 1)); printf '  %sFAIL%s  hermes adapter check\n' "${RED}" "${RESET}"
  fi
}

run_checks "first run"

printf '\n%srestarting the containers and running everything again%s\n' "${BOLD}" "${RESET}"
docker compose restart >/dev/null
wait_for_health
run_checks "after restart"

printf '\n'
if [[ "${failed}" == "0" ]]; then
  printf '%sSmoke test passed: %d checks.%s\n' "${GREEN}${BOLD}" "${passed}" "${RESET}"
else
  printf '%sSmoke test failed: %d passed, %d failed.%s\n' "${RED}${BOLD}" "${passed}" "${failed}" "${RESET}"
  dump_logs
  exit 1
fi

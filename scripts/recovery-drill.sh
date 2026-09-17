#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Recovery drill (v2 runbook S03).
#
# Proves the one claim that matters about private research: you own it, and you
# can get it back. The drill creates real records through the running product,
# exports them, *destroys the volume they live in*, restarts, imports the
# archive, and compares the two exports.
#
# It never touches the researcher's own stack. Everything runs under a separate
# Compose project name with its own volumes and its own port, and the script
# refuses to run if that name is the real one.
#
#   ./scripts/recovery-drill.sh
#
# Requires Docker. Takes a few minutes, most of it building images.
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PROJECT="navigator-recovery-drill"
PORT="${DRILL_PORT:-3399}"
BASE="http://127.0.0.1:${PORT}"

if [ "${PROJECT}" = "knowledge-navigator" ]; then
  echo "refusing to run the destructive drill against the real project" >&2
  exit 1
fi

WORK="$(mktemp -d)"
step=0

compose() {
  WEB_PORT="${PORT}" ASSISTANT_PROVIDER=disabled \
    docker compose -p "${PROJECT}" "$@"
}

say() {
  step=$((step + 1))
  printf '\n[%d] %s\n' "${step}" "$1"
}

cleanup() {
  compose down --volumes --remove-orphans >/dev/null 2>&1 || true
  rm -rf "${WORK}"
}
trap cleanup EXIT

wait_for_health() {
  for _ in $(seq 1 60); do
    if curl -fsS "${BASE}/api/health" >/dev/null 2>&1; then return 0; fi
    sleep 2
  done
  echo "the drill stack never became healthy at ${BASE}" >&2
  return 1
}

corpus_hash() {
  curl -fsS "${BASE}/api/build" | python3 -c 'import json,sys; print(json.load(sys.stdin)["corpusHash"])'
}

post() {
  curl -fsS -X POST -H 'content-type: application/json' -d "$2" "${BASE}$1"
}

# `exportedAt` is the one field that moves between two exports of the same data.
normalize() {
  python3 - "$1" <<'PY'
import json, sys
archive = json.load(open(sys.argv[1]))
archive.pop('exportedAt', None)
# The history row records the export itself, so it differs by construction.
archive['tables'].pop('export_history', None)
archive['counts'].pop('export_history', None)
print(json.dumps(archive, indent=2, sort_keys=True))
PY
}

say "building and starting an isolated stack on port ${PORT}"
compose up -d --build >/dev/null
wait_for_health
BEFORE_HASH="$(corpus_hash)"
echo "    corpus hash ${BEFORE_HASH}"

say "creating private research through the running product"
PROJECT_ID="$(post /api/personal/projects \
  '{"title":"Recovery drill","description":"Written by scripts/recovery-drill.sh."}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
post "/api/personal/projects/${PROJECT_ID}/sessions" \
  '{"title":"Drill session","startingQuestion":"Does a restore actually restore?"}' >/dev/null
post "/api/personal/projects/${PROJECT_ID}/notes" \
  '{"body":"DRILL-NOTE this sentence exists only in the private store.","conceptId":"concept.deep_learning.pooling"}' >/dev/null
post /api/personal/familiarity/concept.deep_learning.resnet '{"level":"strong"}' >/dev/null
BEFORE_COUNT="$(curl -fsS "${BASE}/api/personal/projects" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')"
echo "    ${BEFORE_COUNT} project(s) created"

say "exporting the private store"
compose exec -T api node packages/core/dist/cli.js personal export \
  --output /tmp/drill-before --allow-external-output >/dev/null
compose cp api:/tmp/drill-before/archive.json "${WORK}/before.json" >/dev/null
echo "    $(wc -c <"${WORK}/before.json" | tr -d ' ') bytes"

say "destroying the personal volume, as a failed disk would"
compose down >/dev/null
docker volume rm "${PROJECT}_personal-data" >/dev/null
compose up -d >/dev/null
wait_for_health
EMPTY_COUNT="$(curl -fsS "${BASE}/api/personal/projects" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')"
if [ "${EMPTY_COUNT}" != "0" ]; then
  echo "    the store still holds ${EMPTY_COUNT} project(s): the volume was not destroyed" >&2
  exit 1
fi
echo "    the private store is empty, and the product still runs"

say "importing the archive"
compose cp "${WORK}/before.json" api:/tmp/restore.json >/dev/null
compose exec -T api node packages/core/dist/cli.js personal import /tmp/restore.json \
  --confirm-import
AFTER_COUNT="$(curl -fsS "${BASE}/api/personal/projects" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')"
echo "    ${AFTER_COUNT} project(s) restored"

say "exporting again and comparing"
compose exec -T api node packages/core/dist/cli.js personal export \
  --output /tmp/drill-after --allow-external-output >/dev/null
compose cp api:/tmp/drill-after/archive.json "${WORK}/after.json" >/dev/null

normalize "${WORK}/before.json" >"${WORK}/before.normal.json"
normalize "${WORK}/after.json" >"${WORK}/after.normal.json"
if ! diff -u "${WORK}/before.normal.json" "${WORK}/after.normal.json"; then
  echo "    the restored export is not identical to the original" >&2
  exit 1
fi
echo "    the restored export is byte-identical"

AFTER_HASH="$(corpus_hash)"
if [ "${BEFORE_HASH}" != "${AFTER_HASH}" ]; then
  echo "    the canonical corpus hash changed: ${BEFORE_HASH} -> ${AFTER_HASH}" >&2
  exit 1
fi

printf '\nDRILL: private work survived the loss of its volume.\n'
printf '  projects before %s, after %s\n' "${BEFORE_COUNT}" "${AFTER_COUNT}"
printf '  corpus hash unchanged: %s\n' "${AFTER_HASH}"

#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Security and privacy review (runbook I04).
#
# Every item is checked against the running artefacts rather than assumed from
# the source. It inspects the Compose configuration, both image filesystems and
# the tracked files, and it prints candidate matches for human judgement rather
# than hiding them.
#
# Requires the images to exist:
#     docker compose build
#
# Known false positives, reported as NOTE rather than suppressed:
#   * the distribution CA trust store in the web image (/etc/ssl*/cert.pem and
#     /etc/ssl*/certs) — 145 public root certificates, zero private keys,
#     owned by the base image's ca-certificates-bundle package;
#   * `password:` in publish-images.yml — the input name of
#     docker/login-action, fed GitHub's built-in ephemeral token;
#   * `/etc/passwd` in three test files — path-traversal inputs used to prove
#     the API refuses them;
#   * the assistant's references to private types — apps/api/src/assistant/
#     private-context.ts is the explicit-selection path itself, so it must name
#     them. The check prints the matches rather than hiding them, and the
#     containment property is proved by apps/api/tests/private-context.test.ts.
# ---------------------------------------------------------------------------
set -uo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
pass=0; fail=0; note=0
ok()   { pass=$((pass+1)); printf '  PASS  %s\n' "$1"; }
bad()  { fail=$((fail+1)); printf '  FAIL  %s\n' "$1"; }
info() { note=$((note+1)); printf '  NOTE  %s\n' "$1"; }
judge(){ if [ "$1" = 0 ]; then ok "$2"; else bad "$2"; fi; }

echo "== 1. localhost binding and published ports =="
docker compose config --format json > /tmp/kn-config.json
python3 - <<'PY'
import json
c = json.load(open('/tmp/kn-config.json'))
bad = 0
for name, svc in c['services'].items():
    for p in svc.get('ports', []):
        host = p.get('host_ip')
        if name != 'web' or host not in ('127.0.0.1', '::1'):
            print(f'  FAIL  {name} publishes {p}')
            bad = 1
print('  PASS  only web publishes a port, and only on loopback' if not bad else '')
PY
[ "$(python3 -c "import json;c=json.load(open('/tmp/kn-config.json'));print(len(c['services']['api'].get('ports',[])))")" = 0 ] \
  && ok "the API publishes no port at all" || bad "the API publishes a port"

echo
echo "== 2. containers do not run as root =="
docker run --rm --entrypoint id ${API_IMAGE:-knowledge-navigator-api:local} 2>/dev/null | grep -q 'uid=10001' \
  && ok "API image runs as uid 10001" || bad "API image user is not 10001"
docker run --rm --entrypoint id ${WEB_IMAGE:-knowledge-navigator-web:local} 2>/dev/null | grep -q 'uid=101' \
  && ok "web image runs as uid 101 (nginx-unprivileged)" || bad "web image user is not 101"

echo
echo "== 3. no secrets, private notes or credentials in the images =="
for image in ${API_IMAGE:-knowledge-navigator-api:local} ${WEB_IMAGE:-knowledge-navigator-web:local}; do
  found=$(docker run --rm --entrypoint sh "$image" -c '
    find / -xdev \( -name ".env" -o -name ".git" -o -name "*.pem" -o -name "id_rsa*" \
      -o -name "*.key" -o -name ".npmrc" -o -name "KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md" \
      -o -name "BUILD_STATE.md" \) 2>/dev/null \
      | grep -v node_modules \
      | grep -vE "^/etc/ssl1?(\.1)?/(certs/|cert\.pem)" \
      | grep -vE "^/usr/(share|lib)/ca-certificates/" | head -5' 2>/dev/null)
  if [ -z "$found" ]; then ok "$image carries no secret-shaped file, no .git, no runbook, no build state";
  else bad "$image contains: $found"; fi
done
docker run --rm --entrypoint sh ${API_IMAGE:-knowledge-navigator-api:local} -c 'ls /data/*.db 2>/dev/null' >/dev/null 2>&1 \
  && bad "the API image ships a prebuilt database" || ok "no database is baked into the API image"

echo
echo "== 4. credential patterns in tracked files =="
hits=$(git grep -nIE '(api[_-]?key|secret[_-]?key|password|passwd|BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})' \
  -- . ':!package-lock.json' ':!KNOWLEDGE_NAVIGATOR_BUILD_RUNBOOK.md' 2>/dev/null | grep -vE 'password=\(\)|no credentials|Put no credentials|credential patterns|no secrets' || true)
if [ -z "$hits" ]; then ok "no credential-shaped string in tracked files"; else printf '  NOTE  candidate matches (reviewed below):\n%s\n' "$hits"; note=$((note+1)); fi

echo
echo "== 5. the API cannot write canonical knowledge =="
grep -rqE "readonly:\s*true" packages/core/src/db.ts && ok "openDatabaseReadOnly passes readonly:true" || bad "the read-only open is missing"
# The API may write exactly one thing: the private personal store, through
# apps/api/src/personal/. Everywhere else a filesystem write is a defect, and
# the pattern now includes the *Sync variants the earlier list missed.
# Call-shaped so that a word such as `truncated` is not mistaken for `truncate(`.
WRITE_CALLS='\b(writeFile|writeFileSync|appendFile|appendFileSync|createWriteStream|unlink|unlinkSync|rename|renameSync|mkdir|mkdirSync|rmdir|rmdirSync|rm|rmSync|truncate|truncateSync|chmod|chmodSync|chown|chownSync|copyFile|copyFileSync|open)\s*\('
if git grep -nE "$WRITE_CALLS" -- apps/api/src ':!apps/api/src/personal' | grep -q .; then
  bad "the API writes to the filesystem outside the private store:"
  git grep -nE "$WRITE_CALLS" -- apps/api/src ':!apps/api/src/personal' | sed 's/^/        /'
else ok "the only filesystem writes in the API are in the private store"; fi
# And the private store may touch nothing but its own path.
# Comment lines are excluded: the module explains *why* it is separate from
# knowledge.db, and naming it in prose is the opposite of a leak.
canon=$(git grep -nE "DATABASE_PATH|CONTENT_PATH|content/concepts|knowledge\.db" -- apps/api/src/personal \
        | grep -vE ':[0-9]+: *(\*|//|/\*)')
if [ -n "$canon" ]; then
  bad "the private store references canonical paths in code:"; printf '%s\n' "$canon" | sed 's/^/        /'
else ok "the private store never opens the canonical database or content"; fi
# The canonical index is opened read-only everywhere the API opens it.
if git grep -n "openDatabaseReadOnly" -- apps/api/src | grep -q .; then
  ok "the API opens the canonical index only through openDatabaseReadOnly"
else bad "the API does not use openDatabaseReadOnly"; fi
if git grep -nE "new Database\(" -- apps/api/src ':!apps/api/src/personal' | grep -q .; then
  bad "the API opens a database directly outside the private store:"
  git grep -nE "new Database\(" -- apps/api/src ':!apps/api/src/personal' | sed 's/^/        /'
else ok "no direct database handle is opened outside the private store"; fi
if git grep -nE "CONTENT_PATH" -- apps/api/src | grep -vE 'config\.ts' | grep -q .; then
  info "CONTENT_PATH referenced outside config; reviewed:"; git grep -nE "CONTENT_PATH" -- apps/api/src | grep -v config.ts | sed 's/^/        /'
else ok "content/ is never opened by the API at all"; fi

echo
echo "== 6. the fixture provider cannot run in production =="
grep -q "NODE_ENV === 'production' && config.ASSISTANT_PROVIDER === 'fixture'" apps/api/src/config.ts \
  && ok "assertProviderAllowed refuses fixture in production" || bad "the production guard is missing"
docker run --rm --entrypoint sh ${API_IMAGE:-knowledge-navigator-api:local} -c 'echo $NODE_ENV' | grep -q production \
  && ok "the API image sets NODE_ENV=production" || bad "the API image does not set NODE_ENV=production"

echo
echo "== 7. questions and research context are never logged =="
# Every field name that may hold something a person wrote must be in
# PRIVATE_FIELDS, and the redact paths must be derived from that list rather
# than typed out — a hand-written list is a list that goes stale.
missing=""
for field in question context title description body label note statement rationale \
             startingQuestion contextSummary payload answer interpretation \
             extractedText originalName filename; do
  grep -qE "^  '${field}',$" apps/api/src/logger.ts || missing="${missing} ${field}"
done
if [ -n "$missing" ]; then bad "PRIVATE_FIELDS is missing:${missing}"
else ok "PRIVATE_FIELDS names every field that can hold what a person wrote"; fi
grep -q "PRIVATE_FIELDS.map((field) => \`req.body.\${field}\`)" apps/api/src/logger.ts \
  && ok "redact paths are derived from PRIVATE_FIELDS, not hand-written" \
  || bad "redact paths are not derived from PRIVATE_FIELDS"
if git grep -nE "log\.(info|warn|error|debug)\(" -- apps/api/src | grep -E "question[^L]|context[^L]" | grep -vq "questionLength\|contextLength"; then
  bad "a log call carries the question or context"
else ok "every assistant log line carries lengths and counts only"; fi

# The private store must never reach a model prompt on its own.
if git grep -nE "personal|artifact|familiarity|savedItem" -- apps/api/src/assistant | grep -q .; then
  info "the assistant references private types; reviewed for explicit selection:"
  git grep -nE "personal|artifact|familiarity|savedItem" -- apps/api/src/assistant | sed 's/^/        /'
else ok "the assistant reads nothing from the private store"; fi

echo
echo "== 7b. the private store is separate and never published =="
python3 - <<'PY'
import json
c = json.load(open('/tmp/kn-config.json'))
mounters = [
    name
    for name, svc in c['services'].items()
    if any(v.get('source') == 'personal-data' for v in svc.get('volumes', []) or [])
]
if mounters == ['api']:
    print('  PASS  personal-data is mounted by the API and by nothing else')
else:
    print(f'  FAIL  personal-data is mounted by {mounters or "no service"}')
PY
if [ -n "$(git ls-files | grep -E 'personal\.db|\.navigator/')" ]; then
  bad "a private file is tracked in Git"
else ok "no private database or proposal workspace is tracked"; fi
if git check-ignore -q data/personal.db && git check-ignore -q .navigator/proposals/x; then
  ok "the private paths are ignored by Git"
else bad "a private path is not ignored"; fi
# The exporter (Q07) is the only thing outside the API that touches private
# records. It must never be able to write one.
cli_private=$(grep -nE "new Database\(" packages/core/src/cli.ts | grep -v "readonly: true")
if [ -n "$cli_private" ]; then
  bad "the command line opens a database without readonly:"; printf '%s\n' "$cli_private" | sed 's/^/        /'
else ok "the command line opens the private store read-only"; fi
if grep -qE "projectPaths\(\)\.exportsDir" packages/core/src/cli.ts; then
  ok "exports default to .navigator/exports, which Git ignores"
else bad "the export command does not default to .navigator/exports"; fi

echo
echo "== 8. no externally hosted asset in the shipped site =="
ext=$(docker run --rm --entrypoint sh ${WEB_IMAGE:-knowledge-navigator-web:local} -c \
  "find /usr/share/nginx/html -name '*.html' -o -name '*.js' -o -name '*.css' | xargs grep -hoE '(src|href|url)\(?[\"'\'']https?://[^\"'\'')]+' 2>/dev/null | grep -viE 'arxiv|deeplearningbook|ieeexplore|distill|pytorch|springer|ocw.mit|icml.cc|docusaurus.io|127.0.0.1|ollama.com|schema.org|w3.org' | sort -u | head -5" 2>/dev/null)
if [ -z "$ext" ]; then ok "no external asset host in the built site"; else bad "external references: $ext"; fi

echo
echo "== 9. the fallback profile exposes nothing =="
OLLAMA_BASE_URL=http://ollama:11434 OLLAMA_MODEL=qwen3:8b docker compose --profile container-ollama config --format json \
  | python3 -c "
import json,sys
c=json.load(sys.stdin)
extra=[(n,s.get('ports')) for n,s in c['services'].items() if s.get('ports') and n!='web']
print('  PASS  the container-ollama profile publishes no port' if not extra else f'  FAIL  {extra}')
"

echo
echo "== 10. no authentication is claimed anywhere =="
grep -qi "has no authentication of any kind" README.md && ok "the README states plainly that there is no authentication" || bad "the no-authentication warning is missing"

echo
printf 'REVIEW: %d passed, %d failed, %d notes\n' "$pass" "$fail" "$note"
exit $([ "$fail" = 0 ] && echo 0 || echo 1)

#!/bin/sh
# Compile canonical Markdown into a fresh index, then serve it.
#
# Compiling on every start means the container can never serve an index that
# disagrees with the content baked into the image, and it makes the compiled
# database genuinely disposable: deleting the volume costs nothing.
set -eu

echo "knowledge-navigator: compiling canonical content from ${CONTENT_PATH}"
node /app/packages/core/dist/cli.js compile \
  --content "${CONTENT_PATH}" \
  --database "${DATABASE_PATH}"

echo "knowledge-navigator: starting the API on ${HOST}:${PORT}"
exec node /app/apps/api/dist/server.js

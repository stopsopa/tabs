#!/bin/bash

# Generates js files from the source of truth skills/vanilla-tabs/vanilla-tabs.ts, next to it, using esbuild:
#
#   skills/vanilla-tabs/vanilla-tabs.esm.js  - ES module: import vanillaTabs from "./vanilla-tabs.esm.js"
#   skills/vanilla-tabs/vanilla-tabs.js      - classic <script src="vanilla-tabs.js"> defining window.vanillaTabs
#
# Both are in .gitignore - they exist only after running this script. They are needed by:
#   - index.html (demo, "xx server" runs this script first)
#   - github pages (.github/workflows/deploy.yaml runs this script before the deployment)
#   - npm package (build.sh runs this script and copies them to dist/)
#
#   npm install
#   /bin/bash transpile.sh
#
# WARNING: esbuild only strips types, it doesn't check them (for that: npm run typecheck)

set -e

cd "$(dirname "${BASH_SOURCE[0]}")"

ESBUILD="node_modules/.bin/esbuild"

if [ ! -f "${ESBUILD}" ]; then
  echo "${0} error: ${ESBUILD} not found, run 'npm install' first"

  exit 1
fi

SOURCE="skills/vanilla-tabs/vanilla-tabs.ts"

BANNER="/**
 * https://github.com/stopsopa/tabs
 *
 * GENERATED FILE - don't edit. Edit vanilla-tabs.ts and run: /bin/bash transpile.sh
 */"

# The ES module is exactly the same code + its exports + one thing which can't exist in the classic script:
# autoenable triggered by query string of the url the module was imported from
# (the classic script reads it from src of its <script> tag).
ESM_FOOTER='if (typeof window !== "undefined" && new URL(import.meta.url).searchParams.has("vanilla-tabs-autoenable")) {
  window.vanillaTabs.autoenable();
}'

"${ESBUILD}" "${SOURCE}" \
  --bundle \
  --format=esm \
  --outfile=skills/vanilla-tabs/vanilla-tabs.esm.js \
  --target=es2020 \
  --charset=utf8 \
  --banner:js="${BANNER}" \
  --footer:js="${ESM_FOOTER}"

# iife: exports are dropped, window.vanillaTabs is defined by the code itself
"${ESBUILD}" "${SOURCE}" \
  --bundle \
  --format=iife \
  --outfile=skills/vanilla-tabs/vanilla-tabs.js \
  --target=es2020 \
  --charset=utf8 \
  --banner:js="${BANNER}"

# generated files are formatted too, so projects copying them and running prettier
# (printWidth 120, see prettier.config.cjs) don't get them reformatted.
# --ignore-path /dev/null: without it prettier skips them, because they are in .gitignore
node_modules/.bin/prettier --config prettier.config.cjs --ignore-path /dev/null --write \
  skills/vanilla-tabs/vanilla-tabs.js \
  skills/vanilla-tabs/vanilla-tabs.esm.js

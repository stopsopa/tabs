#!/bin/bash

# Transpiles vanilla-tabs.ts using esbuild to:
#   vanilla-tabs.js      - classic <script src="vanilla-tabs.js"> defining window.vanillaTabs
#   vanilla-tabs.esm.js  - ES module: import vanillaTabs from "./vanilla-tabs.esm.js"
#
#   npm install
#   /bin/bash transpile.sh
#
# WARNING: esbuild only strips types, it doesn't check them

set -e

cd "$(dirname "${BASH_SOURCE[0]}")"

ESBUILD="node_modules/.bin/esbuild"

if [ ! -f "${ESBUILD}" ]; then
  echo "${0} error: ${ESBUILD} not found, run 'npm install' first"

  exit 1
fi

BANNER="/**
 * https://github.com/stopsopa/tabs
 *
 * GENERATED FILE - don't edit. Edit vanilla-tabs.ts and run: /bin/bash transpile.sh
 */"

# ESM version is exactly the same code (it also defines window.vanillaTabs) + export.
# Classic script detects ?vanilla-tabs-autoenable in src of its <script> tag,
# for module the equivalent is query string of the import url.
ESM_FOOTER='const vanillaTabs = window.vanillaTabs;
if (new URL(import.meta.url).searchParams.has("vanilla-tabs-autoenable")) {
  vanillaTabs.autoenable();
}
export { vanillaTabs };
export default vanillaTabs;'

"${ESBUILD}" vanilla-tabs.ts \
  --outfile=vanilla-tabs.js \
  --target=es2020 \
  --charset=utf8 \
  --banner:js="${BANNER}"

"${ESBUILD}" vanilla-tabs.ts \
  --outfile=vanilla-tabs.esm.js \
  --target=es2020 \
  --charset=utf8 \
  --banner:js="${BANNER}" \
  --footer:js="${ESM_FOOTER}"

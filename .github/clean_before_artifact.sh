

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%N}" )" && pwd -P )"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    ;;
esac

ROOT="${_DIR}/.."

cd "${ROOT}"

ROOT="$(pwd)"

set -x
rm -rf xx.ts
rm -rf prettier.config.cjs
rm -rf .prettierignore
rm -rf .vscode
rm -rf .github
rm -rf .env*
rm -rf package.json
rm -rf node_modules
rm -rf package-lock.json
rm -rf transpile.sh
# tests and tooling, not part of the site
rm -rf test
rm -rf e2e
rm -rf test-results
rm -rf playwright-report
rm -rf playwright.config.ts
rm -rf tsconfig.json
rm -rf vitest.config.ts
rm -rf SUGGESTED_IMPROVEMENTS.md
rm -rf __links

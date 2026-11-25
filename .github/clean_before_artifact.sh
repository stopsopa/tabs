

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
# sources, tests and tooling of the npm package (published by job "npm" from its own checkout), not part of the site
rm -rf dist
rm -rf react
rm -rf test
rm -rf bash
rm -rf tag.sh
rm -rf build.sh
rm -rf tsconfig.json
rm -rf tsconfig.build.json
rm -rf vitest.config.ts
rm -rf NPM_RELEASE.md
rm -rf __links

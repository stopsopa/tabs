
# Library files were moved from the root of the repository to skills/vanilla-tabs/
# but other projects still load them from the old urls like:
#
#   https://stopsopa.github.io/tabs/vanilla-tabs.js?vanilla-tabs-autoenable
#
# This script recreates the old location in the root of the project (for github pages deployment only):
#
#   vanilla-tabs.js      - copy + appended .github/legacy_location_warning.js
#   vanilla-tabs.esm.js  - copy + appended .github/legacy_location_warning.js
#   vanilla-tabs.css     - plain copy (css can't print anything to the console)
#
# Appended code prints console.error in the form of a prompt for AI agent,
# telling how to switch to the new url https://stopsopa.github.io/tabs/skills/vanilla-tabs/...
#
# Usage (from any directory):
#
#   /bin/bash .github/legacy_location.sh
#
# Has to run after transpile.sh (needs generated files in skills/vanilla-tabs/)
# and before .github/clean_before_artifact.sh (which removes .github directory).
# Generated files are listed in .gitignore - they are not supposed to be committed.

_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%x}" )" && pwd -P )"
    ;;
  sh)
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    ;;
esac

_ROOT="$(cd "${_DIR}/.." && pwd)"

set -e

SOURCE_DIR="${_ROOT}/skills/vanilla-tabs"

WARNING="${_DIR}/legacy_location_warning.js"

if [[ ! -f "${WARNING}" ]]; then
  echo "${0} error: file with the warning to append not found WARNING=>${WARNING}<"

  exit 1
fi

for FILE in vanilla-tabs.js vanilla-tabs.esm.js vanilla-tabs.css; do
  SOURCE="${SOURCE_DIR}/${FILE}"

  TARGET="${_ROOT}/${FILE}"

  if [[ ! -f "${SOURCE}" ]]; then
    echo "${0} error: source file not found SOURCE=>${SOURCE}<, run 'npm run transpile' first"

    exit 1
  fi

  cp "${SOURCE}" "${TARGET}"

  if [[ "${FILE}" == *.js ]]; then
    printf "\n" >> "${TARGET}"

    sed "s/__LEGACY_FILE__/${FILE}/g" "${WARNING}" >> "${TARGET}"
  fi

  echo "${0}: created ${TARGET}"
done

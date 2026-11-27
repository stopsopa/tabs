// to install go to: https://github.com/stopsopa/xx
// github edit  : https://github.com/stopsopa/xx/edit/main/templates/xx.ts

// 🚀 -
// ✅ -
// ⚙️  -
// 🗑️  -
// 🛑 -
// to call other xx commands from inside any xx command use:
//    shopt -s expand_aliases && source ~/.bashrc
// after that just do:
//   xx <command_name>

type Command = {
  // required. Shell script, written to xx_generated.sh and executed with /bin/bash
  command: string;
  // default: name of the command. Shown under the menu for the selected row
  description?: string;
  // default: false = run straight away
  // true = ask "Run command?" first (XX_CONFIRM=false skips the question)
  confirm?: boolean;
  // default: false = executed with /bin/bash as a separate process
  // true = sourced in the current shell (cd, export, source venv/bin/activate stay after it ends)
  source?: boolean;
  // default: 0. Lower goes first: negative = top, positive = bottom
  // commands with the same order stay in the order of this file
  order?: number;
};

type Commands = Record<string, Command>;

type Ctx = {
  // arguments given after the name of the command: xx <name> [args]
  args: string[];
  // directory xx was called in
  cwd: string;
  // path of this file
  configPath: string;
};

// makes sure node_modules (esbuild, prettier) are installed
const npmInstall = `
if [ ! -d node_modules ]; then
  npm install
fi
`;

export default (setup: Commands, ctx: Ctx): Commands => {
  return {
    help: {
      command: `
set -e
PORT="4286"

cat <<EEE

  🐙 GitHub: $(git ls-remote --get-url origin | awk '{\$1=\$1};1' | tr -d '\\n' | sed -E 's/git@github\\.com:([^/]+)\\/(.+)\\.git/https:\\/\\/github.com\\/\\1\\/\\2/g')

  server:
    http://localhost:\${PORT}

      vanilla demo:  /index.html
      react demo:    /demo/react/index.html

  pages:    https://stopsopa.github.io/tabs/
            https://stopsopa.github.io/tabs/demo/react/

  release:  there is none - push to master deploys github pages, projects copy the files from there (README.md)

EEE
      `,
      description: "Status of all things",
      confirm: false,
    },
    [`server`]: {
      command: `
set -e
${npmInstall}
# index.html loads skills/vanilla-tabs/vanilla-tabs.js which is generated (not in git)
/bin/bash transpile.sh
PORT="4286"
cat <<EEE
    http://localhost:\${PORT}
    http://localhost:\${PORT}/demo/react/index.html
EEE
python3 -m http.server \${PORT} --directory .
`,
      description: "transpile, then serve the demos (index.html, demo/react/index.html) on http://localhost:4286",
      confirm: false,
    },
    [`watch`]: {
      command: `
set -e
${npmInstall}
PORT="4286"
cat <<EEE
    http://localhost:\${PORT}
    http://localhost:\${PORT}/demo/react/index.html
EEE
# both end with Ctrl+C
trap 'kill 0' EXIT
/bin/bash transpile.sh --watch &
python3 -m http.server \${PORT} --directory . &
wait
`,
      description: "like server, but generated files are rebuilt on every change of the sources (reload the page)",
      confirm: false,
    },
    [`transpile`]: {
      command: `
set -e
${npmInstall}
/bin/bash transpile.sh
`,
      description:
        "skills/vanilla-tabs/vanilla-tabs.ts (source of truth) -> vanilla-tabs.js + vanilla-tabs.esm.js next to it, demo/react/main.tsx -> main.js (generated, not in git)",
      confirm: false,
    },
    [`typecheck`]: {
      command: `
set -e
${npmInstall}
./node_modules/.bin/tsc -p tsconfig.json
`,
      description:
        "tsc: check types of skills/vanilla-tabs/ (vanilla-tabs.ts, Tabs.tsx), demo/, test/ and e2e/ (the same check runs in CI)",
    },
    [`test`]: {
      command: `
set -e
${npmInstall}
./node_modules/.bin/vitest run "\${@}"
`,
      description:
        "vitest (jsdom): tests of vanilla-tabs.ts, of generated files and of the react component, arguments go to vitest",
    },
    [`e2e`]: {
      command: `
set -e
${npmInstall}
# does nothing when the browser is already there
./node_modules/.bin/playwright install chromium
./node_modules/.bin/playwright test "\${@}"
`,
      description:
        "playwright: mouse, keyboard and api on both demo pages in real chromium (starts its own server on port 4287), arguments go to playwright (--ui, --headed, -g ...)",
    },
    [`style:check`]: {
      command: `
set -e
${npmInstall}
./node_modules/.bin/prettier --config prettier.config.cjs --check .
`,
      description: `prettier --check (fails if any file is not formatted)`,
      confirm: false,
    },
    [`style:fix`]: {
      command: `
set -e
${npmInstall}
./node_modules/.bin/prettier --config prettier.config.cjs --write .
`,
      description: `prettier --write (format all files)`,
      confirm: false,
    },
    [`style:list`]: {
      command: `
set -e
${npmInstall}
./node_modules/.bin/prettier --config prettier.config.cjs --list-different .
`,
      description: `prettier --list-different (list files which are not formatted)`,
      confirm: false,
    },

    ...setup,
  };
};

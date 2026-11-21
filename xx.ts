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
  // shell script, written to xx_generated.sh and executed with /bin/bash
  command: string;
  // shown under the menu for selected row. Default: name of the command
  description?: string;
  // default true: ask "Run command?" before running
  confirm?: boolean;
  // default false. true = run in the current shell (source) instead of /bin/bash
  source?: boolean;
  // lower goes first. Missing means 0, so negative = top, positive = bottom
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

EEE
      `,
      description: "Status of all things",
      confirm: false,
    },
    [`server`]: {
      command: `
PORT="4286"
cat <<EEE
    http://localhost:\${PORT}
EEE
read -p "\n      Press enter to continue\n"
python3 -m http.server \${PORT} --directory .
`,
      confirm: false,
    },
    [`transpile`]: {
      command: `
set -e
${npmInstall}
/bin/bash transpile.sh
`,
      description: "vanilla-tabs.ts -> skills/vanilla-tabs/*.js (esbuild + prettier)",
      confirm: false,
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

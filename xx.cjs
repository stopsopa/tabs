// to install go to: https://stopsopa.github.io//pages/bash/index.html#xx

// https://stopsopa.github.io/viewer.html?file=%2Fpages%2Fbash%2Fxx%2Fxx-template.cjs
// edit: https://github.com/stopsopa/stopsopa.github.io/blob/master/pages/bash/xx/xx-template.cjs

// 🚀 -
// ✅ -
// ⚙️  -
// 🗑️  -
// 🛑 -
// to call other xx commands from inside any xx command use:
//    shopt -s expand_aliases && source ~/.bashrc
// after that just do:
//   xx <command_name>

module.exports = (setup) => {
  return {
    help: {
      command: `
set -e  
# git config core.excludesFile .git/.gitignore_local
# read -p "       Press enter to continue\\n\\n"
# source .env
# source .env.sh
DYNAMO_ADMIN_PORT="4286"
export NODE_OPTIONS=""
        
cat <<EEE

  🐙 GitHub: $(git ls-remote --get-url origin | awk '{\$1=\$1};1' | tr -d '\\n' | sed -E 's/git@github\\.com:([^/]+)\\/(.+)\\.git/https:\\/\\/github.com\\/\\1\\/\\2/g')

  arango admin:
    http://localhost:\${DYNAMO_ADMIN_PORT}

EEE

      `,
      description: "Status of all things",
      source: true,
      confirm: false,
    },
    [`server`]: {
      command: `
DYNAMO_ADMIN_PORT="4286"
cat <<EEE
    http://localhost:\${DYNAMO_ADMIN_PORT}
EEE
read -p "\n      Press enter to continue\n"
#python -m http.server \${DYNAMO_ADMIN_PORT} --directory .

# for python version 2.7

# cd ./coverage
python -m SimpleHTTPServer \${DYNAMO_ADMIN_PORT}
`,
      confirm: false,
    },

    ...setup,
  };
};

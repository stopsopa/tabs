/**
 * Appended by .github/legacy_location.sh to the copies of the library served from the old location
 * https://stopsopa.github.io/tabs/__LEGACY_FILE__
 *
 * Prints console error in the form of a prompt for AI agent, explaining how to switch to the new url.
 */
(function () {
  var oldUrl = "https://stopsopa.github.io/tabs/__LEGACY_FILE__";
  var newUrl = "https://stopsopa.github.io/tabs/skills/vanilla-tabs/__LEGACY_FILE__";

  var lines = [
    "[vanilla-tabs] DEPRECATED URL - this page loads vanilla-tabs from the old location:",
    "",
    "    " + oldUrl,
    "",
    "It still works, but it might be removed at any time. Switch to:",
    "",
    "    " + newUrl,
    "",
    "Copy everything between the lines below and give it to your AI coding agent (or follow it by hand).",
    "",
    "--------------------------------------------------------------------------------",
    "Task: migrate this project from the deprecated urls of the vanilla-tabs library",
    "(https://github.com/stopsopa/tabs) to the new ones.",
    "",
    "Hosted files of the library were moved to the subdirectory skills/vanilla-tabs/ :",
    "",
    "    old: stopsopa.github.io/tabs/vanilla-tabs.js",
    "    new: stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.js",
    "",
    "    old: stopsopa.github.io/tabs/vanilla-tabs.esm.js",
    "    new: stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.esm.js",
    "",
    "    old: stopsopa.github.io/tabs/vanilla-tabs.css",
    "    new: stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.css",
    "",
    "So there is one rule for all of them: insert `skills/vanilla-tabs/` right after `stopsopa.github.io/tabs/`.",
    "",
    "Steps:",
    "",
    "1. Search ALL files of this project for the string `stopsopa.github.io/tabs/vanilla-tabs`.",
    "   Don't assume how the library is loaded, it might be: <script src>, <link href>, static import,",
    "   dynamic import(), a string in js which injects the tag, a template of any server side language,",
    "   markdown, a config value, a list of urls to cache in a service worker, anything else.",
    "   So don't limit the search to particular file extensions or directories.",
    "",
    "   The only exception: NEVER search in `node_modules` directories. Don't filter them out from",
    "   the results afterwards - exclude them from the search itself, don't even enter them. Skip `.git` too.",
    "   Example: grep -rn --exclude-dir=node_modules --exclude-dir=.git 'stopsopa.github.io/tabs/vanilla-tabs' .",
    "",
    "2. Fix every occurrence found according to the rule above.",
    "   Keep everything else exactly as it is: the protocol (https://, http:// or //), the hash,",
    "   other attributes of the tag and especially the query string - `?vanilla-tabs-autoenable`",
    "   is not a cache buster, it turns on automatic initialisation of the tabs, it has to stay.",
    "",
    "3. Leave alone: urls which already contain `/tabs/skills/vanilla-tabs/`, urls from other hosts",
    "   (like cdn.jsdelivr.net) and copies of the library files stored locally in the project.",
    "",
    "4. If nothing was found in step 1 then the url is most likely assembled from parts.",
    "   Search separately for `stopsopa.github.io` and for `vanilla-tabs.js`, `vanilla-tabs.esm.js`,",
    "   `vanilla-tabs.css` (still not entering node_modules) and fix the place which builds the url.",
    "   If it is still not found then the url comes from outside of this repository (database or CMS content,",
    "   environment variable, another repository). Don't guess then - report where you have looked",
    "   and what are the candidates.",
    "",
    "5. Change nothing else. Api and html markup of the library are the same in the new location.",
    "   Don't refactor, don't download the files to the project, don't switch to another CDN.",
    "",
    "6. At the end list every file and line you have changed and, if you can run the project, confirm that",
    "   this error is not printed in the browser console anymore.",
    "--------------------------------------------------------------------------------",
  ];

  console.error(lines.join("\n"));
})();

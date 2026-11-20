


# Preview

![ScreenShot](tabs.gif)

# What is it?

It would be nice to have some easy to use tabs system for raw html which would work declaratively just after loading one js and one css file, without need for manual javascript to attach event.
Also that should also work for all dynamically created formation of html tags introduced to the page after initial library is loaded.

So this is that. Around 270 lines of vanilla js. Have fun.

# Demo & Docs

https://stopsopa.github.io/tabs/

Current version was rewritten to use vanilla [event delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Event_bubbling#event_delegation) technique.

# Install

Copy files from [skills/vanilla-tabs](skills/vanilla-tabs) to your project (this is where the generated files live):

- `vanilla-tabs.css`
- `vanilla-tabs.esm.js` - ES module, preferred (native browser ESM and bundlers)
- `vanilla-tabs.js` - classic script, for older setups

```html
<link rel="stylesheet" href="./vanilla-tabs.css" />
<script type="module">
  import vanillaTabs from "./vanilla-tabs.esm.js?vanilla-tabs-autoenable";
</script>

<!-- or, older setups (instead of the module above): -->
<script src="./vanilla-tabs.js?vanilla-tabs-autoenable"></script>
```

Presence of `vanilla-tabs-autoenable` in query string triggers autobinding and watch mode, otherwise call:

```js
const unbind = vanillaTabs.bind();
vanillaTabs.active();

// that will trigger .activate() everytime new [data-buttons]
// will be created anywhere in the document
vanillaTabs.watchMutationsEnable();
```

## Latest from github pages (not recommended to use)

```html
<link rel="stylesheet" href="https://stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.css" />
<script src="https://stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.js?vanilla-tabs-autoenable"></script>
```

Note: before the files moved to `skills/vanilla-tabs/` they were served from `https://stopsopa.github.io/tabs/vanilla-tabs.*`.

## Older versions (files in repo root)

### v1.0.0

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/stopsopa/tabs@v1.0.0/vanilla-tabs.css"
/>
<script src="https://cdn.jsdelivr.net/gh/stopsopa/tabs@v1.0.0/vanilla-tabs.js"></script>
```

### v1.0.1

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/stopsopa/tabs@v1.0.1/vanilla-tabs.css"
/>
<script src="https://cdn.jsdelivr.net/gh/stopsopa/tabs@v1.0.1/vanilla-tabs.js?vanilla-tabs-autoenable"></script>
```

# Colors

Tabs are transparent by default. Background and lines color are css variables:

```html
<!-- all instances -->
<style>
  [data-vanilla-tabs] {
    --vanilla-tabs-background-color: white;
    --vanilla-tabs-lines-color: #565656;
  }
</style>

<!-- single instance via style -->
<div data-vanilla-tabs style="--vanilla-tabs-background-color: white">...</div>

<!-- single instance via attributes (applied by js) -->
<div data-vanilla-tabs data-background-color="white" data-lines-color="navy">
  ...
</div>
```

# Events

Every time tab becomes visible (also the initial one) `vanilla-tabs:change` event is dispatched on the tab content element and it bubbles:

```js
// register before loading vanilla-tabs.js to catch initially active tabs too
document.addEventListener("vanilla-tabs:change", function (e) {
  const { parent, button, tab, index } = e.detail;
});
```

Or bind to single `[data-vanilla-tabs]` element - listener lives on that element, so it is destroyed together with it when element is removed:

```js
const unbind = vanillaTabs.on(element, function ({ parent, button, tab, index }) {});
```

# ESM

The same library as ES module (`vanilla-tabs.esm.js`), see Install above.

Don't load both `vanilla-tabs.js` and `vanilla-tabs.esm.js` on the same page.

# More tabs than available width

Prev/next arrows show up automatically when buttons don't fit. If you add/remove buttons manually
and you don't use watch mode, call `vanillaTabs.updateOverflow(element)` afterwards.

# Skill for AI agents

[skills/vanilla-tabs/SKILL.md](skills/vanilla-tabs/SKILL.md) is a standard agent skill explaining to AI how to use this library.
The directory also contains the generated `vanilla-tabs.css`, `vanilla-tabs.esm.js` and `vanilla-tabs.js`; the skill instructs the agent to copy them into your project and use them from there.

## Install the skill

Repository: https://github.com/stopsopa/tabs - the skill is the `skills/vanilla-tabs` directory.

Easiest, with the [skills CLI](https://github.com/vercel-labs/skills) (works for Claude Code and other agents):

```bash
npx skills add stopsopa/tabs
```

Manually for Claude Code (use `~/.claude/skills/` instead of `.claude/skills/` to install it for all projects):

```bash
git clone --depth 1 https://github.com/stopsopa/tabs.git /tmp/stopsopa-tabs
mkdir -p .claude/skills
cp -R /tmp/stopsopa-tabs/skills/vanilla-tabs .claude/skills/
rm -rf /tmp/stopsopa-tabs
```

For other agents copy the `skills/vanilla-tabs` directory to the place where that agent looks for skills.
After that ask the agent for tabs on your page - it will copy `vanilla-tabs.css` and the JS file into your project.

# Dev notes

Source is `vanilla-tabs.ts`; `npm run transpile` (or `xx transpile`) generates `skills/vanilla-tabs/vanilla-tabs.js` and `vanilla-tabs.esm.js` - commit them.

To refresh jsdelivr visit: https://purge.jsdelivr.net/gh/stopsopa/tabs@v1.0.1/vanilla-tabs.js
pointing to version specified by latest tag

Inspecting version in jsdelivr: https://www.jsdelivr.com/package/npm/stopsopa.tabs

### License

The MIT License (MIT)
Copyright (c) 2016-2025 Szymon Działowski
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# Preview

![ScreenShot](tabs.gif)

# What is it?

It would be nice to have some easy to use tabs system for raw html which would work declaratively just after loading one js and one css file, without need for manual javascript to attach event.
Also that should also work for all dynamically created formation of html tags introduced to the page after initial library is loaded.

So this is that. Around 270 lines of vanilla js. Have fun.

# Demo & Docs

https://stopsopa.github.io/tabs/

Current version was rewritten to use vanilla [event delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Event_bubbling#event_delegation) technique.

# Two ways to use it

|              | [Vanilla](#vanilla)                                          | [React](#react)                               |
| ------------ | ------------------------------------------------------------ | --------------------------------------------- |
| for          | raw html, server rendered pages, any framework without React | React 18+ applications (also SSR: Next.js...) |
| you write    | html markup with `data-*` attributes                         | `<Tabs>` / `<Tab>` components                 |
| installation | copy 2 files, or CDN, or npm                                 | npm                                           |
| stylesheet   | `vanilla-tabs.css`                                           | the same `vanilla-tabs.css`                   |

Both come from the same npm package `@stopsopa/tabs` and look exactly the same.
Use one or the other for given page - don't enable the vanilla script on a page rendering the React component.

# Vanilla

## Installation

Pick one of three ways.

### A. Copy the files (no build step, no npm)

Download to your project:

- [`vanilla-tabs.css`](https://stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.css) - always
- [`vanilla-tabs.esm.js`](https://stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.esm.js) - ES module, preferred
- or [`vanilla-tabs.js`](https://stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.js) - classic script, for older setups

```html
<link rel="stylesheet" href="./vanilla-tabs.css" />
<script type="module">
  import vanillaTabs from "./vanilla-tabs.esm.js?vanilla-tabs-autoenable";
</script>
```

or with the classic script (put it at the end of `<body>`):

```html
<link rel="stylesheet" href="./vanilla-tabs.css" />
<script src="./vanilla-tabs.js?vanilla-tabs-autoenable"></script>
```

Don't load both `vanilla-tabs.js` and `vanilla-tabs.esm.js` on the same page.

The js files are generated from [`skills/vanilla-tabs/vanilla-tabs.ts`](skills/vanilla-tabs/vanilla-tabs.ts) and are not stored
in the repository, that's why the links above point to github pages.

### B. CDN (nothing to copy)

Pinned version from the npm package (replace `1.1.0` with the version you need):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@stopsopa/tabs@1.1.0/dist/vanilla-tabs.css" />
<script src="https://cdn.jsdelivr.net/npm/@stopsopa/tabs@1.1.0/dist/vanilla-tabs.js?vanilla-tabs-autoenable"></script>
```

Latest from github pages (not recommended: it changes with every commit):

```html
<link rel="stylesheet" href="https://stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.css" />
<script src="https://stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.js?vanilla-tabs-autoenable"></script>
```

### C. npm (bundler: vite, webpack, rollup, esbuild, parcel...)

```bash
npm install @stopsopa/tabs
```

ES module with TypeScript types:

```ts
import vanillaTabs from "@stopsopa/tabs";
import "@stopsopa/tabs/vanilla-tabs.css";

// with a bundler there is no ?vanilla-tabs-autoenable in the url, so call it once, anywhere in the browser code:
vanillaTabs.autoenable();
```

If your bundler doesn't handle css imports, link `node_modules/@stopsopa/tabs/dist/vanilla-tabs.css` the way your project links stylesheets.
Importing the module without DOM (SSR) is safe, calling its methods is not.

## Usage

### 1. Markup

```html
<div data-vanilla-tabs>
  <div data-buttons>
    <span>first</span>
    <span class="active">second</span>
    <a href="javascript:;">third</a>
  </div>
  <div data-tabs>
    <div>content of first</div>
    <div>content of second</div>
    <div>content of third</div>
  </div>
</div>
```

- `[data-buttons]` and `[data-tabs]` have to be direct children of `[data-vanilla-tabs]`.
- Buttons are direct children of `[data-buttons]` (any tag), panels are direct `<div>` children of `[data-tabs]`.
  They are matched by position, so there has to be the same number of both.
- `class="active"` on a button picks the initially open tab. Without it the first one is open.
- Keep the content of a button plain text - a click on an element nested in a button is not recognised.
- Tabs can be nested: put another `[data-vanilla-tabs]` inside a panel.

That's all when autoenable is on: tabs present on the page work, and tabs added to the page later (ajax, templates,
any framework) work too, without any extra call.

### 2. Enabling

Autoenable = handle clicks + activate all tabs on the page + watch the page for tabs added later. Any of these turns it on:

| how                                                          | where it works                      |
| ------------------------------------------------------------ | ----------------------------------- |
| `?vanilla-tabs-autoenable` in the url of the script / import | classic script, native ES module    |
| `<body class="vanilla-tabs-autoenable">`                     | classic script, native ES module    |
| `vanillaTabs.autoenable()`                                   | everywhere, required with a bundler |

Or do it step by step, taking only what you need:

```js
const unbind = vanillaTabs.bind(); // handle clicks (one delegated listener on document.body)

vanillaTabs.active(); // activate initial tab in every [data-vanilla-tabs] present on the page

vanillaTabs.watchMutationsEnable(); // do the above automatically for tabs added later
```

### 3. Colors

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
<div data-vanilla-tabs data-background-color="white" data-lines-color="navy">...</div>
```

### 4. Events

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

### 5. Switching tabs from code

```js
const element = document.querySelector("[data-vanilla-tabs]");

vanillaTabs.activeByIndex(element, 2); // zero based

vanillaTabs.activeByButtonElement(element, buttonElement);
```

### 6. More tabs than available width

Prev/next arrows show up automatically when buttons don't fit. If you add/remove buttons manually
and you don't use watch mode, call `vanillaTabs.updateOverflow(element)` afterwards.

### 7. TypeScript

Types come with the npm package:

```ts
import vanillaTabs, { type VanillaTabs, type VanillaTabsChangeDetail } from "@stopsopa/tabs";

document.addEventListener("vanilla-tabs:change", (e) => {
  const { parent, button, tab, index } = (e as CustomEvent<VanillaTabsChangeDetail>).detail;
});

const tool: VanillaTabs = window.vanillaTabs; // the same object, window.vanillaTabs is typed too
```

Without npm: copy [`vanilla-tabs.ts`](skills/vanilla-tabs/vanilla-tabs.ts) to a TypeScript project and import it directly
(then call `vanillaTabs.autoenable()`, the query string works only in the generated files).

## Older versions (files in repo root)

Before the files moved to `skills/vanilla-tabs/` they were served from `https://stopsopa.github.io/tabs/vanilla-tabs.*`.

### v1.0.0

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/stopsopa/tabs@v1.0.0/vanilla-tabs.css" />
<script src="https://cdn.jsdelivr.net/gh/stopsopa/tabs@v1.0.0/vanilla-tabs.js"></script>
```

### v1.0.1

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/stopsopa/tabs@v1.0.1/vanilla-tabs.css" />
<script src="https://cdn.jsdelivr.net/gh/stopsopa/tabs@v1.0.1/vanilla-tabs.js?vanilla-tabs-autoenable"></script>
```

# React

Typed React component. It is implemented in React itself (it doesn't run the vanilla script): state lives in React,
it renders the same markup as the vanilla version and uses the same stylesheet. Safe for SSR.

## Installation

Requires React 18 or newer.

```bash
npm install @stopsopa/tabs
```

Import the stylesheet once in the application (entry file, root layout...):

```ts
import "@stopsopa/tabs/vanilla-tabs.css";
```

If your setup doesn't handle css imports, link `node_modules/@stopsopa/tabs/dist/vanilla-tabs.css` the way your project links stylesheets.

Nothing else: no provider, no initialisation. Don't call `vanillaTabs.autoenable()` on pages rendering `<Tabs>`.

## Usage

### 1. Basic (uncontrolled)

The component keeps the active tab on its own:

```tsx
import { Tabs, Tab } from "@stopsopa/tabs/react";

export default function Example() {
  return (
    <Tabs defaultIndex={1} onChange={(index) => console.log("active tab:", index)}>
      <Tab label="first">content of first</Tab>
      <Tab label="second">content of second</Tab>
      <Tab label={<b>third</b>}>content of third</Tab>
    </Tabs>
  );
}
```

### 2. Controlled

You keep the active tab (state, url, store...). The tab changes only when `index` changes:

```tsx
import { useState } from "react";
import { Tabs, Tab } from "@stopsopa/tabs/react";

export default function Example() {
  const [index, setIndex] = useState(0);

  return (
    <>
      <button onClick={() => setIndex(2)}>go to third</button>
      <Tabs index={index} onChange={setIndex}>
        <Tab label="first">content of first</Tab>
        <Tab label="second">content of second</Tab>
        <Tab label="third">content of third</Tab>
      </Tabs>
    </>
  );
}
```

### 3. Props

`<Tabs>`:

| prop              | type                      | what                                                                          |
| ----------------- | ------------------------- | ----------------------------------------------------------------------------- |
| `defaultIndex`    | `number`                  | initially active tab (uncontrolled mode), zero based, default `0`             |
| `index`           | `number`                  | active tab (controlled mode) - changes only when the prop changes             |
| `onChange`        | `(index: number) => void` | user picked another tab (click, Enter, Space). Not called for the initial tab |
| `backgroundColor` | `string`                  | background of active button and panel, default transparent                    |
| `linesColor`      | `string`                  | borders, text of the buttons, arrows, default `#565656`                       |
| anything else     |                           | `className`, `style`, `id`, `data-*`, `ref`... go to the root `<div>`         |

`<Tab>`:

| prop          | type        | what                                                      |
| ------------- | ----------- | --------------------------------------------------------- |
| `label`       | `ReactNode` | required. Content of the button, any node                 |
| `children`    | `ReactNode` | content of the panel                                      |
| anything else |             | `className`, `style`, `data-*`... go to the panel `<div>` |

Good to know:

- `<Tab>` elements have to be direct children of `<Tabs>` (not wrapped in a fragment or another component). A list is fine:
  `{items.map((item) => <Tab key={item.id} label={item.name}>...</Tab>)}`
- All panels stay mounted, inactive ones are hidden with css - state of components inside inactive tabs is preserved.
- `index` out of range falls to the closest existing tab.
- Tabs can be nested: render another `<Tabs>` inside a `<Tab>`.
- Prev/next arrows show up automatically when buttons don't fit.

### 4. Colors

```tsx
<Tabs backgroundColor="white" linesColor="navy">
  ...
</Tabs>
```

or for all instances in css, exactly like in the vanilla version:

```css
[data-vanilla-tabs] {
  --vanilla-tabs-background-color: white;
  --vanilla-tabs-lines-color: #565656;
}
```

### 5. TypeScript

```tsx
import { Tabs, Tab, type TabsProps, type TabProps } from "@stopsopa/tabs/react";
```

### 6. SSR (Next.js and others)

The component renders on the server with the active tab already marked. It uses state and effects, so in frameworks
with React Server Components the file using it has to be a client component:

```tsx
"use client";

import { Tabs, Tab } from "@stopsopa/tabs/react";
```

# Skill for AI agents

[skills/vanilla-tabs/SKILL.md](skills/vanilla-tabs/SKILL.md) is a standard agent skill explaining to AI how to use this library.
The directory also contains `vanilla-tabs.css` and the source `vanilla-tabs.ts`; the skill instructs the agent to bring the css and the js file
(generated from the source, downloaded from github pages when it is not next to the skill) into your project and use them from there.

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

Source of truth is `skills/vanilla-tabs/vanilla-tabs.ts`. `npm run transpile` (or `xx transpile`) generates `vanilla-tabs.js` and `vanilla-tabs.esm.js`
next to it with esbuild. They are in `.gitignore`: after cloning run `xx transpile` (`xx server` and `xx build` do it on their own),
github actions generates them for github pages and for the npm package.

React component: `react/Tabs.tsx`, tests: `test/`.

| command (`xx <name>` or `npm run <name>`) | what                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `transpile`                               | `skills/vanilla-tabs/vanilla-tabs.ts` -> `vanilla-tabs.js`, `vanilla-tabs.esm.js` next to it |
| `server` (xx only)                        | transpile + demo on http://localhost:4286                                                    |
| `typecheck`                               | `tsc` over sources and tests                                                                 |
| `test`                                    | vitest: React component, vanilla module, SSR                                                 |
| `build`                                   | content of the npm package in `dist/` (not committed)                                        |
| `xx publish`                              | new git tag -> github actions publishes `@stopsopa/tabs` to npm                              |

Release process and its one time setup: [NPM_RELEASE.md](NPM_RELEASE.md).

Old urls `https://stopsopa.github.io/tabs/vanilla-tabs.{js,esm.js,css}` (before the files moved to `skills/vanilla-tabs/`)
are recreated during deployment by `.github/legacy_location.sh`; the js files print a console error asking to switch to the new url.

Inspecting versions in jsdelivr: https://www.jsdelivr.com/package/npm/@stopsopa/tabs
(versions up to `v1.0.1` were published only as git tags, see "Older versions" above)

### License

The MIT License (MIT)
Copyright (c) 2016-2025 Szymon Działowski
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

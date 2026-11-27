---
name: vanilla-tabs
description: Add tabs to a plain HTML page or to a React application with the stopsopa vanilla-tabs library (https://github.com/stopsopa/tabs). Use when the user asks for tabs / tabbed content in raw HTML without a framework, or for a tabs component in React (`<Tabs>` / `<Tab>` from the copied `Tabs.tsx`), or when the project already contains `data-vanilla-tabs`, `vanilla-tabs.js`, `vanilla-tabs.css` or that `Tabs.tsx`. Covers both modes - vanilla (markup, loading, colors, overflow arrows, events, JS API) and React (files to copy, bundler imports, controlled / uncontrolled, onChange, onShow, lazy tabs). Both have keyboard support and aria attributes built in.
---

# vanilla-tabs

Dependency-free, declarative tabs: load one CSS file and one JS file, write the markup, done.
No manual initialisation is needed and tabs injected into the page later work automatically.

## Two modes - pick one first

| mode    | when                                                              | files to copy                                           | read            |
| ------- | ----------------------------------------------------------------- | ------------------------------------------------------- | --------------- |
| vanilla | raw html, server rendered pages, any framework other than React   | `vanilla-tabs.css` + one js file (or `vanilla-tabs.ts`) | sections 1 - 7  |
| React   | the tabs are rendered by React (Vite, Next.js, Remix, webpack...) | `vanilla-tabs.css` + `Tabs.tsx`                         | section 8 (+ 3) |

Both look the same and share `vanilla-tabs.css`. Never use both modes for the same tabs, and never enable the vanilla
script on a page which renders the React component. Nothing is installed from npm in either mode - files are copied
into the project.

## Files shipped with this skill

Files which you should normally consider copying into the user's project and using directly:

- `vanilla-tabs.css` - styles, always needed (both modes)
- `vanilla-tabs.esm.js` - vanilla mode: ES module version (preferred, see "Which JS file" below)
- `vanilla-tabs.js` - vanilla mode: classic script version (older setups, see below)
- `Tabs.tsx` - React mode: the component (see section 8)

Copy only the files of the chosen mode: css + one JS file (vanilla), or css + `Tabs.tsx` (React).

Where to take them from:

- `vanilla-tabs.css` and `Tabs.tsx` are next to this `SKILL.md`.
- The two JS files are **generated** from `vanilla-tabs.ts` (the source of truth, next to this `SKILL.md`) and are not stored
  in the repository of the library, so they might not be next to this file. If the one you need is not here, download it:
  `https://stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.esm.js` or
  `https://stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.js`
- Only when the project is written in TypeScript and its bundler handles `.ts` files, you can copy `vanilla-tabs.ts` instead
  and import it (`import vanillaTabs from "./vanilla-tabs.ts"`). It has no query string autoenable: call `vanillaTabs.autoenable()`.
- Any file missing next to this `SKILL.md` can be downloaded from `https://stopsopa.github.io/tabs/skills/vanilla-tabs/<FILE>`.

Before copying <FILE>, search the project for it
(exclude dependencies directories typical to current project setup - like node_modules for node.js).
If it is already there, use that copy and follow the comment at its top; do not copy or import it again.
If it is not there, copy it into the project, import it once, and write a short comment at the top of the copy with:

- where it is imported,
- how to use it in this particular project (framework, build setup, conventions),
- how to find the places that use it (what to search for).

(For `vanilla-tabs.css` write that comment as a `/* ... */` block at the top of the copy.)

## Which JS file

- **`vanilla-tabs.esm.js`** - default choice. Native browser ES modules (`<script type="module">`) and any modern bundler.
- **`vanilla-tabs.js`** - older setups: no ES module support, plain `<script src>` without a bundler, or an older toolchain
  that cannot handle ESM. Defines `window.vanillaTabs`. (The library needs a DOM, so it is not usable in plain Node.js.)

Use one or the other, never both on the same page.

## 1. Load

Use the copies in the project (see above). Paths below are relative to the copied files - adjust them.

```html
<link rel="stylesheet" href="./vanilla-tabs.css" />
<script type="module">
  import vanillaTabs from "./vanilla-tabs.esm.js?vanilla-tabs-autoenable";
</script>
```

Older setups (classic script; it can be anywhere, also in `<head>`):

```html
<script src="./vanilla-tabs.js?vanilla-tabs-autoenable"></script>
```

- `?vanilla-tabs-autoenable` turns on click handling, activates all tabs present and watches the DOM for
  tabs added later. For the classic script `<body class="vanilla-tabs-autoenable">` has the same effect.
  With a bundler the query string cannot be used - call `vanillaTabs.autoenable()` yourself.
- Only the classic script reads the query string from its own `<script src>`; the query string of other scripts is ignored.
- Both files also define `window.vanillaTabs`; the ESM one additionally exports it (default and named `vanillaTabs`).
- The JS files are generated from `vanilla-tabs.ts` (https://github.com/stopsopa/tabs) - never edit the `.js` / `.esm.js` files.
- Only if copying is impossible (no place for local files), load from the CDN:
  `https://stopsopa.github.io/tabs/skills/vanilla-tabs/vanilla-tabs.{css,js,esm.js}` (latest).
  Pinned versions `https://cdn.jsdelivr.net/gh/stopsopa/tabs@<tag>/vanilla-tabs.{css,js}` lack colors via
  variables/attributes, overflow arrows, events, `vanillaTabs.on()` and keyboard support (they exist only in versions newer than `v1.0.1`).
  There is no npm package.

## 2. Markup

```html
<div data-vanilla-tabs>
  <div data-buttons>
    <span>first</span>
    <span class="active">second</span>
    <button type="button">third</button>
  </div>
  <div data-tabs>
    <div>content of first</div>
    <div>content of second</div>
    <div>content of third</div>
  </div>
</div>
```

Rules:

- `[data-buttons]` and `[data-tabs]` must be **direct children** of `[data-vanilla-tabs]`.
- Buttons are the direct children of `[data-buttons]`: `<span>` or `<button type="button">` (an `<a href>` works too, its
  navigation is prevented; never use `href="javascript:..."`). Panels are the direct `<div>` children of `[data-tabs]`.
  They are matched **by position**, so the counts must be equal - otherwise the element is skipped with a console warning.
- Put `class="active"` on one button to choose the initially open tab. Without it the first one opens.
  Do not add `active` to the panels - the library does it.
- Buttons may contain other elements (icons, `<b>`); a click on a nested element works.
- Do not write `role`, `aria-*` or `tabindex` on buttons and panels - the library sets them (and adds an `id` where missing).
- Do not add other direct children to `[data-vanilla-tabs]`. The library itself injects two
  `<button data-vanilla-tabs-nav="prev|next">` elements there - leave them alone.
- Tabs can be nested: put another `[data-vanilla-tabs]` inside a panel.

## 3. Colors

Transparent by default (the page background shows through). Two CSS variables:

| variable                          | default       | what                             |
| --------------------------------- | ------------- | -------------------------------- |
| `--vanilla-tabs-background-color` | `transparent` | active button + panel background |
| `--vanilla-tabs-lines-color`      | `#565656`     | borders, button text, arrows     |

```html
<!-- all instances -->
<style>
  [data-vanilla-tabs] {
    --vanilla-tabs-background-color: white;
    --vanilla-tabs-lines-color: #565656;
  }
</style>

<!-- one instance: style -->
<div data-vanilla-tabs style="--vanilla-tabs-background-color: white">...</div>

<!-- one instance: attributes (copied to the variables by JS) -->
<div data-vanilla-tabs data-background-color="white" data-lines-color="navy">...</div>
```

The variables are inherited, so nested tabs get the colors of the outer one unless they set their own.

## 4. More tabs than fit

Nothing to do: when buttons do not fit in the available width, prev/next arrows appear and the
row of buttons scrolls. This is re-checked on resize and when buttons are added or removed.
Only when the page does **not** use autoenable / `watchMutationsEnable()` and buttons were changed by script, call
`vanillaTabs.updateOverflow(element)`.

## 5. Events - run code when a tab becomes visible, stop a change

Every time a tab becomes visible (including the initially active one) the CustomEvent `vanilla-tabs:change`
is dispatched on the panel element and bubbles. `event.detail` is `{ parent, button, tab, index, previousIndex }`:
`parent` - the `[data-vanilla-tabs]` element, `button` - the button, `tab` - the panel, `index` - zero based,
`previousIndex` - the tab visible before (`-1` for the initial one).
It is not fired again when the already active tab is clicked.

Global listener - covers all tabs, also created later. Register it **before** the script loading the library,
otherwise events of initially active tabs are missed:

```html
<script>
  document.addEventListener("vanilla-tabs:change", function (e) {
    const { parent, button, tab, index, previousIndex } = e.detail;

    // lazy load: only the first time the tab is shown
    if (tab.matches("#lazy") && !tab.dataset.loaded) {
      tab.dataset.loaded = "true";
      // load content here
    }
  });
</script>
<script src="./vanilla-tabs.js?vanilla-tabs-autoenable"></script>
```

Listener bound to one tabs element - it lives on that element, so it is destroyed together with the element when
the element is removed (no cleanup needed). Events from nested tabs are ignored:

```js
const unbind = vanillaTabs.on(element, function ({ parent, button, tab, index, previousIndex }) {});
// unbind(); // optional
```

`vanillaTabs.on()` is available only after the library is loaded, so it does not see the event of the tab
which was active on page load - handle the initial state directly or use the global listener above.

Stopping a change (unsaved form...): before a change made **by the user** (click, keyboard) the cancelable event
`vanilla-tabs:before-change` is dispatched the same way with the same detail (`index` = the tab the user wants).
`preventDefault()` keeps the current tab. Changes made from code (`activeByIndex()`) are not announced and cannot be stopped:

```js
document.addEventListener("vanilla-tabs:before-change", function (e) {
  if (e.detail.parent.id === "editor" && hasUnsavedChanges()) {
    e.preventDefault();
  }
});
```

## 6. Keyboard and accessibility

Built in, nothing to write: `role="tablist"` / `tab` / `tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`,
roving `tabindex` (only the active button is in the tab order), ArrowLeft / ArrowRight / Home / End open another tab and move
focus, Enter / Space open the focused one, visible `:focus-visible` outline. The prev/next arrows are not focusable.
Do not add your own `keydown` handlers or `tabindex` to buttons.

## 7. JS API (`window.vanillaTabs`)

Needed only without autoenable or for programmatic control.

| call                                                 | what                                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `bind()`                                             | start handling clicks and keyboard (delegated listeners on `document`); returns unbind function, can be bound again later |
| `active()` / `active({ root })`                      | activate initial tab in every `[data-vanilla-tabs]` on the page / inside `root` (itself included); returns array of ids   |
| `watchMutationsEnable()` / `watchMutationsDisable()` | automatically handle tabs added later, buttons added/removed, changed color attributes                                    |
| `activeByIndex(element, zeroIndex)`                  | switch tab programmatically; throws when the index is out of range                                                        |
| `activeByButtonElement(element, buttonElement)`      | switch tab programmatically by its button; throws when it is not a button of that element                                 |
| `on(element, callback)`                              | see section 5                                                                                                             |
| `updateOverflow(element)`                            | see section 4                                                                                                             |
| `autoenable()`                                       | `bind()` + `active()` + `watchMutationsEnable()` in one call; what `?vanilla-tabs-autoenable` does                        |
| `autoenableUnbind()`                                 | exists only in autoenable mode; stops handling events and watching                                                        |
| `destroy()`                                          | removes everything the library attached (all listeners and observers); markup stays. For SPA teardown and tests           |

Manual setup equal to autoenable:

```html
<script src="vanilla-tabs.js"></script>
<script>
  vanillaTabs.bind();
  vanillaTabs.active();
  vanillaTabs.watchMutationsEnable();
</script>
```

## 8. React mode (`Tabs.tsx`)

Use it when the tabs are rendered by React. Ignore sections 1, 2, 5 and 7 above in that case: there is no markup to write,
no script to load and no `window.vanillaTabs`. Sections 3 (colors), 4 (overflow arrows) and 6 (keyboard, accessibility)
apply unchanged, because the component renders the same markup and uses the same `vanilla-tabs.css`.

### 8.1 Files

Exactly two files, copied into the project next to each other (for example `src/tabs/`), both are next to this `SKILL.md`:

- `Tabs.tsx` - the component. Self-contained, imports only `react`.
- `vanilla-tabs.css` - the styles.

If one is missing here: `curl -fsSLO https://stopsopa.github.io/tabs/skills/vanilla-tabs/Tabs.tsx` (the same for the css).

Do not copy `vanilla-tabs.ts` / `vanilla-tabs.js` / `vanilla-tabs.esm.js` for React mode and do not install anything from npm.
The rule from "Files shipped with this skill" applies: search the project for `Tabs.tsx` / `data-vanilla-tabs` first, reuse an
existing copy, and write the short comment at the top of a new copy.

Requirements, check them before copying:

- React 18+ (`useId`).
- TypeScript 4.5+ with `"jsx": "react-jsx"`. With `"jsx": "react"` add `import React from "react";` to the copied file.
- Project without TypeScript: convert once and copy the result instead:
  `npx esbuild Tabs.tsx --jsx=automatic --format=esm --outfile=Tabs.jsx`

### 8.2 Import

```tsx
import { Tabs, Tab } from "./tabs/Tabs";
```

Load the stylesheet once per application:

- Vite, Parcel, webpack (with css loaders), Remix / React Router: `import "./tabs/vanilla-tabs.css";` in the entry file
  (`src/main.tsx`, `app/root.tsx`).
- Next.js app router: import it in `app/layout.tsx`; pages router: in `pages/_app.tsx`.
- Bundler without css support: put the file in the public directory and add `<link rel="stylesheet" href="/vanilla-tabs.css" />`.

Frameworks with React Server Components (Next.js app router): the file using `<Tabs>` must start with `"use client";`
(or add that line once at the top of the copied `Tabs.tsx`). Server rendering itself works, the active tab is in the html.

### 8.3 Usage

Uncontrolled (the component keeps the active tab):

```tsx
<Tabs defaultIndex={1} onChange={(index) => console.log("user picked", index)}>
  <Tab label="first">content of first</Tab>
  <Tab label="second">content of second</Tab>
  <Tab label={<b>third</b>}>content of third</Tab>
</Tabs>
```

Controlled (active tab in state / url / store - it changes only when `index` changes):

```tsx
const [index, setIndex] = useState(0);

<Tabs index={index} onChange={setIndex}>
  <Tab label="first">content of first</Tab>
  <Tab label="second">content of second</Tab>
</Tabs>;
```

Switching from code = `setIndex(n)`. Refusing a change = not calling `setIndex` in `onChange`.

Run code when a tab becomes visible - `onShow`, the React equivalent of the `vanilla-tabs:change` event:

```tsx
import { Tabs, Tab, type TabsShowDetail } from "./tabs/Tabs";

<Tabs onShow={({ parent, button, tab, index }: TabsShowDetail) => console.log("visible", index)}>
  <Tab label="first">content of first</Tab>
  <Tab label="chart" onShow={({ tab }) => drawChart(tab.querySelector("canvas")!)}>
    <canvas />
  </Tab>
  <Tab label="report" lazy>
    <Report />
  </Tab>
  <Tab label="video" unmountOnHide>
    <Player />
  </Tab>
</Tabs>;
```

| what                  | called when                                                                 | initial tab |
| --------------------- | --------------------------------------------------------------------------- | ----------- |
| `<Tabs onChange>`     | user picked another tab (click, keyboard). Argument: `index`                | no          |
| `<Tabs onShow>`       | any tab became visible, by the user or by the `index` prop                  | yes         |
| `<Tab onShow>`        | that tab became visible                                                     | yes         |
| `<Tab lazy>`          | not a callback: children are rendered on the first visit, then stay mounted | -           |
| `<Tab unmountOnHide>` | not a callback: children are rendered only while the tab is visible         | -           |

`onShow` receives `{ parent, button, tab, index, previousIndex }` (DOM elements, zero based index, index of the tab visible
before or `-1`) and runs after the panel is displayed, so the content can be measured. The component also dispatches the
bubbling DOM event `vanilla-tabs:change` with the same detail, like the vanilla version. Use it for imperative code (charts, maps, focus). To load data on the first visit prefer
`lazy` + an effect inside the child component.

### 8.4 Props

`<Tabs>`: `defaultIndex?: number` (default `0`), `index?: number`, `onChange?: (index: number) => void`,
`onShow?: (detail: TabsShowDetail) => void`, `backgroundColor?: string`, `linesColor?: string`; everything else
(`className`, `style`, `id`, `data-*`, `ref`) goes to the root `<div data-vanilla-tabs>`.

`<Tab>`: `label: ReactNode` (required, the button), `children` (the panel), `onShow?`, `lazy?: boolean`,
`unmountOnHide?: boolean`; everything else
(`className`, `style`, `data-*`) goes to the panel `<div>`.

Exported types: `TabsProps`, `TabProps`, `TabsShowDetail`.

### 8.5 Rules

- `<Tab>` must be a child of `<Tabs>` directly, in a fragment, behind a condition or in a list - never wrapped in another
  component. Give list items a stable `key`: `{items.map((item) => <Tab key={item.id} label={item.name}>...</Tab>)}`
- All panels stay mounted (inactive ones are hidden with css), so component state inside inactive tabs is preserved
  (except `unmountOnHide`).
- `index` out of range falls to the closest existing tab.
- Nesting: render another `<Tabs>` inside a `<Tab>`.
- Never load `vanilla-tabs.js` / call `vanillaTabs.autoenable()` or `vanillaTabs.bind()` on a page rendering `<Tabs>`:
  the vanilla click handler would switch classes of the same elements behind React's back.
- Do not write `data-vanilla-tabs` markup by hand in JSX and do not toggle `active` classes yourself - use the component.
- Html which React does not render (CMS content, `dangerouslySetInnerHTML`) is the only case for vanilla mode inside a
  React application: copy `vanilla-tabs.ts`, `import vanillaTabs from "./tabs/vanilla-tabs"` and call
  `vanillaTabs.autoenable()` once in browser code (in SSR frameworks inside `useEffect`).

## Don'ts

- Don't write custom click or keyboard handlers toggling `active` classes - use `activeByIndex()` (React: the `index` prop).
- Don't install anything from npm for this library and don't write `role` / `aria-*` / `tabindex` on its elements.
- Don't hide/show panels with your own CSS; visibility is driven by the `active` class.
- Don't override the layout of `[data-vanilla-tabs]` (`display: grid`) or `[data-buttons]` (`display: flex; overflow-x: auto`) -
  overflow arrows depend on it. Restyle through the CSS variables.
- Don't use the old `--background-color` / `--lines-color` variable names; they no longer exist.

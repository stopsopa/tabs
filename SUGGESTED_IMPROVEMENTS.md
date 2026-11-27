# Suggested improvements - status

Review of the project, mainly `skills/vanilla-tabs/vanilla-tabs.ts`. The first version of this file was a list of
proposals; all of them were addressed afterwards. This is the record of what was done, where it is tested, and the few
things which were deliberately left alone (section 8).

Tests: `test/` = vitest + jsdom (`npm test`), `e2e/` = playwright in real chromium on the demo pages (`npm run e2e`).

## 1. Bugs

| #   | problem                                                                                              | fix                                                                                                                                                                  | tests                                                                 |
| --- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1.1 | after `unbind()` the library could not be bound again                                                | the unbind function resets the state; `bind()` called twice returns the same unbind function                                                                         | `test/vanilla.test.ts` "bind() - mouse", `e2e/vanilla.spec.ts` api    |
| 1.2 | classic script in `<head>` crashed (`document.body` was `null`)                                      | listeners and the observer are attached to `document`; the class of `<body>` is checked on `DOMContentLoaded` when body doesn't exist yet                            | `test/generated.test.ts`, `e2e/fixtures/head.html`, `body-class.html` |
| 1.3 | click on an element nested in a button was ignored                                                   | `target.closest(...)` instead of `target.matches(...)`                                                                                                               | both suites ("nested")                                                |
| 1.4 | `activeByIndex()` with an index out of range hid every tab                                           | throws, tabs stay as they were                                                                                                                                       | both suites                                                           |
| 1.5 | `onChange` callbacks leaked, were shared between clones, were called when nothing changed            | `WeakMap` keyed by the element (ids too - the attribute `data-vanilla-tab-id` is only informative now); the callback is called under the same condition as the event | `test/vanilla.test.ts` "callbacks"                                    |
| 1.6 | any mutation re-activated all tabs of the page                                                       | the observer processes only `[data-vanilla-tabs]` elements touched by the mutation; `active({ root })` is public                                                     | `test/vanilla.test.ts` "watchMutationsEnable()"                       |
| 1.7 | buttons/panels count mismatch threw from event handlers and stopped processing of the remaining tabs | `warn` + skip; in watch mode incomplete elements are skipped silently and handled when the rest arrives; one broken element doesn't stop `active()`                  | `test/vanilla.test.ts` "active()", "watchMutationsEnable()"           |

Also fixed on the way: `<a href="#">` used as a button doesn't navigate; removing the active button in watch mode
activates the first one instead of leaving nothing visible.

## 2. Accessibility

Both versions now follow the [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/):

- vanilla: `role="tablist"` / `tab` / `tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`, generated `id`s
  (existing ones are kept) - set on activation, kept up to date;
- both: roving `tabindex` (only the active button is in the tab order), <kbd>←</kbd> <kbd>→</kbd> with wrapping,
  <kbd>Home</kbd>, <kbd>End</kbd> open the tab and move focus, <kbd>Enter</kbd> / <kbd>Space</kbd> open the focused one;
- css: `outline: 0` is gone, `:focus-visible` draws an outline in the color of the lines (not shown after a mouse click);
- prev/next arrows have `tabindex="-1"`: the row follows the focused tab on its own;
- `<a href="javascript:;">` was removed from the demo, README and SKILL.md in favour of `<span>` / `<button type="button">`;
  the css resets button styles so a `<button>` looks like the other tab buttons.

Tests: "accessibility" and "bind() - keyboard" in `test/vanilla.test.ts`, "keyboard" in `test/react.test.tsx`,
"keyboard" groups in both e2e specs (including the Tab key order and visibility of the focus outline).

## 3. API and code quality (`vanilla-tabs.ts`)

- dead `indexOf(...) ?? 0` removed; a foreign element gives "target is not a button ... of given parent";
- `bind()` always returns `VanillaTabsUnbind` (no union with the tool);
- `warn()` without the pointless `try/catch`; errors carry their context (`error.context`);
- `isNode()` replaced with a real element check (`nodeType === 1`, works across frames);
- redundant `!Number.isNaN()` removed, the index is validated against the number of buttons;
- autoenable by url reads `document.currentScript` only (another script with the parameter doesn't enable it);
- `destroy()` - removes document listeners, mutation observer, resize observer and (through one `AbortController`)
  scroll listeners of all prepared elements;
- event detail has `previousIndex`; new cancelable `vanilla-tabs:before-change` for changes made by the user;
- `data-background-color` / `data-lines-color` changed (or removed) later are followed in watch mode.

## 4. React component (`skills/vanilla-tabs/Tabs.tsx`)

- `onShow` on `<Tabs>` and `<Tab>`, `<Tab lazy>`, `<Tab unmountOnHide>`, `previousIndex` in the detail;
- keyboard and roving `tabindex` as above;
- fragments and conditional children are flattened (`<>{cond && <Tab />}<Tab /></>` works);
- the bubbling DOM event `vanilla-tabs:change` is dispatched together with `onShow` (one document listener for both modes);
- overflow is re-checked by `ResizeObserver` + `MutationObserver` on the row of buttons instead of after every render.

## 5. Distribution: copy only

- removed: `build.sh`, `dist/`, `tsconfig.build.json`, `tag.sh`, `bash/file/fuzzy.ts` (used only by `tag.sh`),
  `NPM_RELEASE.md`, `react/index.ts`, the `npm` job of the workflow, `xx build`, `xx publish`, npm sections of README;
- `package.json`: `"private": true`, no `exports` / `files` / `peerDependencies` - it only holds dev tooling;
- `Tabs.tsx` moved to `skills/vanilla-tabs/` - everything what projects (and the agent skill) copy is in one directory
  and is served from `https://stopsopa.github.io/tabs/skills/vanilla-tabs/`;
- README and SKILL.md describe copying only.

## 6. Docs, demo, repository

- README: stale line count and misplaced sentence fixed, license years, sections for keyboard, events, bundler usage;
- `vanilla-tabs.css` header: demo url, years, version entry;
- `index.html`: viewport meta, no request for a missing favicon, `/&gt` typo, wrong `lang` of the first snippet,
  new section (keyboard, `before-change`, switching from code) which the e2e tests drive;
- `.github/workflows/deploy.yaml`: commented-out steps from another project removed, `setup-node@v4`, e2e step with
  traces uploaded on failure. Pull requests are now only tested, not deployed;
- `xx server` doesn't wait for Enter; `xx watch` / `transpile.sh --watch` rebuild generated files on change.

## 7. Tests

|                          | before | now                                                                  |
| ------------------------ | ------ | -------------------------------------------------------------------- |
| `test/vanilla.test.ts`   | 5      | 42 - every public method, keyboard, events, watch mode, overflow     |
| `test/generated.test.ts` | -      | 8 - the generated classic script: query string, body class, `<head>` |
| `test/react.test.tsx`    | 25     | 39                                                                   |
| `test/demo.test.tsx`     | -      | 5 - examples of the React demo render and survive clicking           |
| `e2e/vanilla.spec.ts`    | -      | 17 - mouse, keyboard, api, overflow, colors, three ways of loading   |
| `e2e/react.spec.ts`      | -      | 12 - every example of the React demo                                 |

## 8. Deliberately left as it is

- **`.active` class** as the styling hook. Styling by `aria-selected` would leave `class="active"` written in the markup
  unstyled until the script runs (flash of a page without an open tab). Selectors are scoped to `[data-vanilla-tabs] >`.
- **`window.vanillaTabs` is assigned on import**, also through a bundler: the generated ES module relies on it for
  the query string autoenable and existing pages use the global.
- **`forwardRef`** in `Tabs.tsx`: deprecated in React 19 but required for React 18. Remove when React 18 is dropped.
- **Overflow logic exists twice** (vanilla and React, ~30 lines): sharing it would break "copy one file".
- **`onChange` option** of the vanilla api stays (now leak free) next to `on()` and the events, for existing users.
- **jsdelivr urls of old tags** (`v1.0.0`, `v1.0.1`) in README "Older versions": still valid, they point to git tags.
- Browser tests run in chromium only. `playwright.config.ts` has one project; firefox / webkit are one line each
  when wanted (the CI step would need to install them).

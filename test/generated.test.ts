/**
 * Tests of the GENERATED files (the ones pages really load), mainly of what exists only there:
 * autoenable by ?vanilla-tabs-autoenable in the url and by class of <body>, loading in <head>.
 *
 *   skills/vanilla-tabs/vanilla-tabs.js      - classic script, executed here in a fresh jsdom window per test
 *   skills/vanilla-tabs/vanilla-tabs.esm.js  - ES module, only its content is checked: jsdom can't run modules
 *                                              (the real import is tested in the browser: e2e/vanilla.spec.ts)
 *
 * They are not in git: this file generates them (transpile.sh) when they are missing or older than the source.
 *
 *   npm test          (or: xx test)
 */
// @vitest-environment node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));

const source = `${root}skills/vanilla-tabs/vanilla-tabs.ts`;

const classic = `${root}skills/vanilla-tabs/vanilla-tabs.js`;

const esm = `${root}skills/vanilla-tabs/vanilla-tabs.esm.js`;

const tabs = `
<div data-vanilla-tabs>
  <div data-buttons><span>first</span><span class="active">second</span></div>
  <div data-tabs><div>content of first</div><div>content of second</div></div>
</div>`;

beforeAll(() => {
  const stale = [classic, esm].some((file) => !existsSync(file) || statSync(file).mtimeMs < statSync(source).mtimeMs);

  if (stale) {
    execFileSync("/bin/bash", [`${root}transpile.sh`], { stdio: "pipe" });
  }
}, 60000);

/**
 * Fresh window with an empty page + run(src): executes the code of vanilla-tabs.js in it as if it was loaded
 * by <script src="..."> with given src (jsdom would have to fetch the file asynchronously)
 */
function page() {
  const code = readFileSync(classic, "utf8");

  const errors: unknown[] = [];

  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    runScripts: "outside-only",
    url: "http://localhost/",
  });

  const { window } = dom;

  window.addEventListener("error", (e: ErrorEvent) => errors.push(e.error ?? e.message));

  const { document } = window;

  // document.currentScript is what the library reads, so it is emulated for the inlined code
  const run = (src: string) => {
    const script = document.createElement("script");

    script.setAttribute("src", src);

    Object.defineProperty(document, "currentScript", { value: script, configurable: true });

    try {
      window.eval(code);
    } finally {
      Object.defineProperty(document, "currentScript", { value: null, configurable: true });
    }
  };

  const state = () =>
    Array.from(document.querySelectorAll("[data-buttons] > *")).map((el: Element) => el.classList.contains("active"));

  const panels = () =>
    Array.from(document.querySelectorAll("[data-tabs] > *")).map((el: Element) => el.classList.contains("active"));

  // MutationObserver callbacks
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  return { window, document, run, state, panels, settle, errors };
}

describe("vanilla-tabs.js (classic script)", () => {
  it("defines window.vanillaTabs and doesn't enable anything on its own", async () => {
    const { window, document, run, panels } = page();

    document.body.innerHTML = tabs;

    run("vanilla-tabs.js");

    expect(typeof window.vanillaTabs.autoenable).toBe("function");

    expect(window.vanillaTabs.autoenableUnbind).toBeUndefined();

    expect(panels()).toEqual([false, false]);
  });

  it("autoenables with ?vanilla-tabs-autoenable in its url", async () => {
    const { window, document, run, panels } = page();

    document.body.innerHTML = tabs;

    run("./some/dir/vanilla-tabs.js?v=1&vanilla-tabs-autoenable");

    expect(typeof window.vanillaTabs.autoenableUnbind).toBe("function");

    expect(panels()).toEqual([false, true]);

    document.querySelector<HTMLElement>("[data-buttons] > *")!.click();

    expect(panels()).toEqual([true, false]);
  });

  it("is not enabled by the query string of another script on the page", async () => {
    const { window, document, run } = page();

    document.body.innerHTML = `<script src="other.js?vanilla-tabs-autoenable"></script>${tabs}`;

    run("vanilla-tabs.js");

    expect(window.vanillaTabs.autoenableUnbind).toBeUndefined();
  });

  it("autoenables with class vanilla-tabs-autoenable on <body>", async () => {
    const { document, run, panels } = page();

    document.body.className = "vanilla-tabs-autoenable";

    document.body.innerHTML = tabs;

    run("vanilla-tabs.js");

    expect(panels()).toEqual([false, true]);
  });

  it("works when loaded in <head>, before <body> exists", async () => {
    const { window, document, run, panels, settle, errors } = page();

    // the state of the document while a script in <head> is executed
    document.body.remove();

    expect(document.body).toBeNull();

    run("vanilla-tabs.js?vanilla-tabs-autoenable");

    expect(errors).toEqual([]);

    expect(typeof window.vanillaTabs.autoenableUnbind).toBe("function");

    // the parser reaches <body>
    const body = document.createElement("body");

    body.innerHTML = tabs;

    document.documentElement.appendChild(body);

    await settle();

    expect(panels()).toEqual([false, true]);

    document.querySelector<HTMLElement>("[data-buttons] > *")!.click();

    expect(panels()).toEqual([true, false]);
  });

  it("loaded in <head> without the query string waits for the class of <body>", async () => {
    const { window, document, run, panels } = page();

    document.body.remove();

    run("vanilla-tabs.js");

    expect(window.vanillaTabs.autoenableUnbind).toBeUndefined();

    const body = document.createElement("body");

    body.className = "vanilla-tabs-autoenable";

    body.innerHTML = tabs;

    document.documentElement.appendChild(body);

    document.dispatchEvent(new window.Event("DOMContentLoaded"));

    expect(panels()).toEqual([false, true]);
  });
});

describe("vanilla-tabs.esm.js (ES module)", () => {
  it("exports the library and autoenables by the url it was imported from", () => {
    const code = readFileSync(esm, "utf8");

    expect(code).toMatch(/export\s*\{[^}]*vanillaTabs[^}]*\}/);

    expect(code).toMatch(/as default/);

    expect(code).toContain('new URL(import.meta.url).searchParams.has("vanilla-tabs-autoenable")');
  });

  it("both files come from the current source", () => {
    [classic, esm].forEach((file) => {
      const code = readFileSync(file, "utf8");

      expect(code).toContain("GENERATED FILE");

      expect(code).toContain("vanilla-tabs:before-change");
    });
  });
});

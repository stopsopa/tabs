/**
 * Smoke test of the vanilla library (skills/vanilla-tabs/vanilla-tabs.ts) as an imported ES module, the way bundlers
 * and the npm package use it (vitest + jsdom).
 *
 *   npm test          (or: xx test)
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import vanillaTabs, {
  vanillaTabs as named,
  type VanillaTabsChangeDetail,
} from "../skills/vanilla-tabs/vanilla-tabs.ts";

const html = `
<div data-vanilla-tabs data-lines-color="navy">
  <div data-buttons>
    <span>first</span>
    <span class="active">second</span>
    <span>third</span>
  </div>
  <div data-tabs>
    <div>content of first</div>
    <div>content of second</div>
    <div>content of third</div>
  </div>
</div>
`;

function active(selector: string): boolean[] {
  return Array.from(document.querySelectorAll(selector)).map((el) => el.classList.contains("active"));
}

afterEach(() => {
  vanillaTabs.autoenableUnbind?.();

  document.body.innerHTML = "";
});

describe("vanilla-tabs as a module", () => {
  it("exports the same object as default, as named export and as window.vanillaTabs", () => {
    expect(named).toBe(vanillaTabs);

    expect(window.vanillaTabs).toBe(vanillaTabs);
  });

  it("doesn't autoenable on import without the query string", () => {
    expect(vanillaTabs.autoenableUnbind).toBeUndefined();
  });

  it("autoenable() activates tabs, handles clicks and dispatches the change event", () => {
    document.body.innerHTML = html;

    const events: VanillaTabsChangeDetail[] = [];

    const listener = (e: Event) => events.push((e as CustomEvent<VanillaTabsChangeDetail>).detail);

    document.addEventListener("vanilla-tabs:change", listener);

    vanillaTabs.autoenable();

    expect(active("[data-buttons] > *")).toEqual([false, true, false]);

    expect(active("[data-tabs] > div")).toEqual([false, true, false]);

    document.querySelectorAll<HTMLElement>("[data-buttons] > *")[2].click();

    expect(active("[data-buttons] > *")).toEqual([false, false, true]);

    expect(active("[data-tabs] > div")).toEqual([false, false, true]);

    expect(events.map((e) => e.index)).toEqual([1, 2]);

    document.removeEventListener("vanilla-tabs:change", listener);
  });

  it("setup() copies colors from attributes and injects the arrows once", () => {
    document.body.innerHTML = html;

    const parent = document.querySelector<HTMLElement>("[data-vanilla-tabs]")!;

    vanillaTabs.setup(parent);

    vanillaTabs.setup(parent);

    expect(parent.style.getPropertyValue("--vanilla-tabs-lines-color")).toBe("navy");

    expect(parent.querySelectorAll(":scope > [data-vanilla-tabs-nav]")).toHaveLength(2);
  });

  it("on() reports changes of the given element", () => {
    document.body.innerHTML = html;

    const parent = document.querySelector<HTMLElement>("[data-vanilla-tabs]")!;

    const callback = vi.fn();

    const unbind = vanillaTabs.on(parent, callback);

    vanillaTabs.activeByIndex(parent, 0);

    expect(callback).toHaveBeenCalledTimes(1);

    expect(callback.mock.calls[0][0].index).toBe(0);

    unbind();

    vanillaTabs.activeByIndex(parent, 2);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

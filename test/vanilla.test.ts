/**
 * Tests of the vanilla library (skills/vanilla-tabs/vanilla-tabs.ts) imported as an ES module, the way bundlers
 * use it (vitest + jsdom). Generated files (vanilla-tabs.js, vanilla-tabs.esm.js): test/generated.test.ts,
 * real browser: e2e/
 *
 *   npm test          (or: xx test)
 *
 * jsdom has no layout: scrollWidth/clientWidth are always 0 and element.scrollBy() doesn't exist,
 * so tests of the overflow arrows define them by hand.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import vanillaTabs, {
  vanillaTabs as named,
  type VanillaTabsChangeDetail,
} from "../skills/vanilla-tabs/vanilla-tabs.ts";

function markup(names: string[], active = -1, attributes = ""): string {
  return `
<div data-vanilla-tabs ${attributes}>
  <div data-buttons>
    ${names.map((name, i) => `<span${i === active ? ' class="active"' : ""}>${name}</span>`).join("")}
  </div>
  <div data-tabs>
    ${names.map((name) => `<div>content of ${name}</div>`).join("")}
  </div>
</div>
`;
}

const html = markup(["first", "second", "third"], 1, 'data-lines-color="navy"');

function root(selector = "[data-vanilla-tabs]"): HTMLElement {
  return document.querySelector<HTMLElement>(selector)!;
}

function buttons(parent: Element = root()): HTMLElement[] {
  return Array.from(parent.querySelectorAll<HTMLElement>(":scope > [data-buttons] > *"));
}

function panels(parent: Element = root()): HTMLElement[] {
  return Array.from(parent.querySelectorAll<HTMLElement>(":scope > [data-tabs] > *"));
}

function active(parent: Element = root()): { buttons: boolean[]; panels: boolean[] } {
  return {
    buttons: buttons(parent).map((el) => el.classList.contains("active")),
    panels: panels(parent).map((el) => el.classList.contains("active")),
  };
}

/**
 * Index of active tab, checks that button and panel agree. -1: nothing active
 */
function index(parent: Element = root()): number {
  const state = active(parent);

  expect(state.buttons).toEqual(state.panels);

  expect(state.buttons.filter(Boolean).length).toBeLessThanOrEqual(1);

  return state.buttons.indexOf(true);
}

function record(name = "vanilla-tabs:change") {
  const events: VanillaTabsChangeDetail[] = [];

  const listener = (e: Event) => events.push((e as CustomEvent<VanillaTabsChangeDetail>).detail);

  document.addEventListener(name, listener);

  cleanups.push(() => document.removeEventListener(name, listener));

  return events;
}

// MutationObserver callbacks are microtasks
const mutations = () => new Promise((resolve) => setTimeout(resolve, 0));

const cleanups: (() => void)[] = [];

afterEach(() => {
  cleanups.splice(0).forEach((fn) => fn());

  vanillaTabs.destroy();

  document.body.innerHTML = "";

  document.body.className = "";

  vi.restoreAllMocks();
});

describe("module", () => {
  it("exports the same object as default, as named export and as window.vanillaTabs", () => {
    expect(named).toBe(vanillaTabs);

    expect(window.vanillaTabs).toBe(vanillaTabs);
  });

  it("doesn't autoenable on import without the query string", () => {
    expect(vanillaTabs.autoenableUnbind).toBeUndefined();
  });
});

describe("active()", () => {
  it("activates button with class 'active', or the first one", () => {
    document.body.innerHTML = html + markup(["a", "b"]);

    const ids = vanillaTabs.active();

    const [first, second] = Array.from(document.querySelectorAll("[data-vanilla-tabs]"));

    expect(index(first)).toBe(1);

    expect(index(second)).toBe(0);

    expect(ids).toHaveLength(2);

    expect(new Set(ids).size).toBe(2);

    expect(ids[0]).toBe(first.getAttribute("data-vanilla-tab-id"));
  });

  it("dispatches the change event for initial tabs, once", () => {
    document.body.innerHTML = html;

    const events = record();

    vanillaTabs.active();

    vanillaTabs.active();

    expect(events).toHaveLength(1);

    expect(events[0]).toEqual({
      parent: root(),
      button: buttons()[1],
      tab: panels()[1],
      index: 1,
      previousIndex: -1,
    });
  });

  it("can be limited to a root, the root itself included", () => {
    document.body.innerHTML = `<section>${markup(["a", "b"])}</section>${markup(["c", "d"])}`;

    const [inside, outside] = Array.from(document.querySelectorAll("[data-vanilla-tabs]"));

    expect(vanillaTabs.active({ root: document.querySelector("section")! })).toHaveLength(1);

    expect(index(inside)).toBe(0);

    expect(index(outside)).toBe(-1);

    expect(vanillaTabs.active({ root: outside })).toHaveLength(1);

    expect(index(outside)).toBe(0);
  });

  it("one broken element doesn't stop the others", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    document.body.innerHTML =
      `<div data-vanilla-tabs><div data-buttons><span>a</span><span>b</span></div><div data-tabs><div>A</div></div></div>` +
      markup(["c", "d"]);

    vanillaTabs.active();

    expect(index(document.querySelectorAll("[data-vanilla-tabs]")[1])).toBe(0);

    expect(warn).toHaveBeenCalledTimes(1);

    expect(String(warn.mock.calls[0][1])).toContain("length mismatch");
  });

  it("handles nested tabs independently", () => {
    document.body.innerHTML = `
      <div data-vanilla-tabs id="outer">
        <div data-buttons><span>a</span><span class="active">b</span></div>
        <div data-tabs>
          <div>A</div>
          <div>${markup(["x", "y", "z"], 2, 'id="inner"')}</div>
        </div>
      </div>`;

    vanillaTabs.bind();

    vanillaTabs.active();

    expect(index(root("#outer"))).toBe(1);

    expect(index(root("#inner"))).toBe(2);

    buttons(root("#inner"))[0].click();

    expect(index(root("#inner"))).toBe(0);

    expect(index(root("#outer"))).toBe(1);
  });
});

describe("accessibility", () => {
  it("sets roles, aria attributes and roving tabindex, and keeps them up to date", () => {
    document.body.innerHTML = html;

    vanillaTabs.active();

    expect(root().querySelector(":scope > [data-buttons]")!.getAttribute("role")).toBe("tablist");

    buttons().forEach((button, i) => {
      const panel = panels()[i];

      expect(button.getAttribute("role")).toBe("tab");

      expect(panel.getAttribute("role")).toBe("tabpanel");

      expect(button.id).not.toBe("");

      expect(button.getAttribute("aria-controls")).toBe(panel.id);

      expect(panel.getAttribute("aria-labelledby")).toBe(button.id);
    });

    expect(buttons().map((b) => b.getAttribute("aria-selected"))).toEqual(["false", "true", "false"]);

    expect(buttons().map((b) => b.getAttribute("tabindex"))).toEqual(["-1", "0", "-1"]);

    vanillaTabs.activeByIndex(root(), 2);

    expect(buttons().map((b) => b.getAttribute("aria-selected"))).toEqual(["false", "false", "true"]);

    expect(buttons().map((b) => b.getAttribute("tabindex"))).toEqual(["-1", "-1", "0"]);
  });

  it("keeps existing ids of buttons and panels", () => {
    document.body.innerHTML = `
      <div data-vanilla-tabs>
        <div data-buttons><span id="my-button">a</span></div>
        <div data-tabs><div id="my-panel">A</div></div>
      </div>`;

    vanillaTabs.active();

    expect(buttons()[0].getAttribute("aria-controls")).toBe("my-panel");

    expect(panels()[0].getAttribute("aria-labelledby")).toBe("my-button");
  });

  it("arrows are not in the tab order", () => {
    document.body.innerHTML = html;

    vanillaTabs.active();

    const nav = Array.from(root().querySelectorAll<HTMLElement>(":scope > [data-vanilla-tabs-nav]"));

    expect(nav.map((el) => el.getAttribute("tabindex"))).toEqual(["-1", "-1"]);

    expect(nav.map((el) => el.getAttribute("aria-label"))).toEqual(["previous tabs", "next tabs"]);
  });
});

describe("bind() - mouse", () => {
  it("switches tab on click and dispatches the change event with previousIndex", () => {
    document.body.innerHTML = html;

    const events = record();

    vanillaTabs.bind();

    vanillaTabs.active();

    buttons()[2].click();

    expect(index()).toBe(2);

    buttons()[2].click();

    expect(events.map((e) => [e.previousIndex, e.index])).toEqual([
      [-1, 1],
      [1, 2],
    ]);
  });

  it("recognises a click on an element nested in a button", () => {
    document.body.innerHTML = `
      <div data-vanilla-tabs>
        <div data-buttons><span>a</span><span><b><i id="deep">b</i></b></span></div>
        <div data-tabs><div>A</div><div>B</div></div>
      </div>`;

    vanillaTabs.bind();

    vanillaTabs.active();

    document.querySelector<HTMLElement>("#deep")!.click();

    expect(index()).toBe(1);
  });

  it("ignores clicks inside of panels", () => {
    document.body.innerHTML = html;

    vanillaTabs.bind();

    vanillaTabs.active();

    panels()[1].click();

    expect(index()).toBe(1);
  });

  it("<a href> used as a button doesn't navigate", () => {
    document.body.innerHTML = `
      <div data-vanilla-tabs>
        <div data-buttons><span>a</span><a href="#somewhere">b</a></div>
        <div data-tabs><div>A</div><div>B</div></div>
      </div>`;

    vanillaTabs.bind();

    vanillaTabs.active();

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });

    buttons()[1].dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);

    expect(index()).toBe(1);
  });

  it("returns unbind function, the same one when already bound, and can be bound again after unbinding", () => {
    document.body.innerHTML = html;

    vanillaTabs.active();

    const unbind = vanillaTabs.bind();

    expect(typeof unbind).toBe("function");

    expect(vanillaTabs.bind()).toBe(unbind);

    unbind();

    buttons()[0].click();

    expect(index()).toBe(1);

    const again = vanillaTabs.bind();

    expect(again).not.toBe(unbind);

    buttons()[0].click();

    expect(index()).toBe(0);

    again();

    buttons()[2].click();

    expect(index()).toBe(0);
  });

  it("arrows scroll the row of buttons by 70% of its width and don't switch tabs", () => {
    document.body.innerHTML = html;

    vanillaTabs.bind();

    vanillaTabs.active();

    const row = root().querySelector<HTMLElement>(":scope > [data-buttons]")!;

    const scrollBy = vi.fn();

    row.scrollBy = scrollBy;

    vi.spyOn(row, "clientWidth", "get").mockReturnValue(200);

    ["next", "prev"].forEach((direction) => {
      const nav = root().querySelector<HTMLButtonElement>(`:scope > [data-vanilla-tabs-nav="${direction}"]`)!;

      // jsdom has no layout, so both are disabled (nothing to scroll) and disabled buttons don't click
      nav.disabled = false;

      nav.click();
    });

    expect(scrollBy.mock.calls.map(([arg]) => arg.left)).toEqual([140, -140]);

    expect(index()).toBe(1);
  });
});

describe("bind() - keyboard", () => {
  function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });

    document.activeElement!.dispatchEvent(event);

    return event;
  }

  function prepare() {
    document.body.innerHTML = html;

    vanillaTabs.bind();

    vanillaTabs.active();

    buttons()[1].focus();
  }

  it("ArrowRight / ArrowLeft / Home / End open another tab and move focus, with wrapping", () => {
    prepare();

    const steps: [string, number][] = [
      ["ArrowRight", 2],
      ["ArrowRight", 0],
      ["ArrowLeft", 2],
      ["Home", 0],
      ["End", 2],
      ["ArrowLeft", 1],
    ];

    steps.forEach(([key, expected]) => {
      const event = press(key);

      expect(event.defaultPrevented).toBe(true);

      expect(index()).toBe(expected);

      expect(document.activeElement).toBe(buttons()[expected]);
    });
  });

  it("Enter and Space open focused button", () => {
    prepare();

    buttons()[0].focus();

    press("Enter");

    expect(index()).toBe(0);

    buttons()[2].focus();

    press(" ");

    expect(index()).toBe(2);
  });

  it("ignores other keys, keys with modifiers and keys pressed outside of buttons", () => {
    prepare();

    expect(press("a").defaultPrevented).toBe(false);

    expect(press("ArrowRight", { ctrlKey: true }).defaultPrevented).toBe(false);

    panels()[1].innerHTML = `<input />`;

    panels()[1].querySelector("input")!.focus();

    expect(press("ArrowRight").defaultPrevented).toBe(false);

    expect(index()).toBe(1);
  });
});

describe("vanilla-tabs:before-change", () => {
  it("is dispatched for changes made by the user and can cancel them", () => {
    document.body.innerHTML = html;

    vanillaTabs.bind();

    vanillaTabs.active();

    const before = record("vanilla-tabs:before-change");

    const changes = record();

    let allow = false;

    const guard = (e: Event) => {
      if (!allow) {
        e.preventDefault();
      }
    };

    document.addEventListener("vanilla-tabs:before-change", guard);

    cleanups.push(() => document.removeEventListener("vanilla-tabs:before-change", guard));

    buttons()[2].click();

    expect(index()).toBe(1);

    buttons()[1].focus();

    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(index()).toBe(1);

    expect(document.activeElement).toBe(buttons()[1]);

    expect(changes).toHaveLength(0);

    allow = true;

    buttons()[2].click();

    expect(index()).toBe(2);

    expect(before.map((e) => [e.previousIndex, e.index])).toEqual([
      [1, 2],
      [1, 2],
      [1, 2],
    ]);

    expect(before[0].tab).toBe(panels()[2]);

    expect(changes).toHaveLength(1);
  });

  it("is not dispatched for the api and for a click on already active button", () => {
    document.body.innerHTML = html;

    const before = record("vanilla-tabs:before-change");

    vanillaTabs.bind();

    vanillaTabs.active();

    vanillaTabs.activeByIndex(root(), 0);

    buttons()[0].click();

    expect(before).toHaveLength(0);
  });
});

describe("activeByIndex() / activeByButtonElement()", () => {
  it("switch tabs without bind()", () => {
    document.body.innerHTML = html;

    vanillaTabs.activeByIndex(root(), 2);

    expect(index()).toBe(2);

    vanillaTabs.activeByButtonElement(root(), buttons()[0]);

    expect(index()).toBe(0);

    vanillaTabs.activeByIndex(root());

    expect(index()).toBe(0);
  });

  it("throw for index out of range and leave the tabs as they were", () => {
    document.body.innerHTML = html;

    vanillaTabs.active();

    [3, -1, 1.5, NaN].forEach((wrong) => {
      expect(() => vanillaTabs.activeByIndex(root(), wrong)).toThrow(/zeroIndex/);
    });

    expect(index()).toBe(1);
  });

  it("throw for a button of another element and for a parent which is not an element", () => {
    document.body.innerHTML = html + markup(["a", "b"]);

    const other = document.querySelectorAll("[data-vanilla-tabs]")[1];

    expect(() => vanillaTabs.activeByButtonElement(root(), buttons(other)[0])).toThrow(/target is not a button/);

    expect(() => vanillaTabs.activeByIndex({} as Element, 0)).toThrow(/not valid DOM element/);

    expect(() => vanillaTabs.activeByIndex(new Date() as unknown as Element, 0)).toThrow(/not valid DOM element/);
  });

  it("only warn when buttons and panels don't match or are missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    document.body.innerHTML = `
      <div data-vanilla-tabs id="mismatch">
        <div data-buttons><span>a</span><span>b</span></div>
        <div data-tabs><div>A</div></div>
      </div>
      <div data-vanilla-tabs id="empty"></div>`;

    vanillaTabs.activeByIndex(root("#mismatch"), 0);

    vanillaTabs.activeByIndex(root("#empty"), 0);

    expect(warn.mock.calls.map((call) => call[1])).toEqual([
      "buttons (2) and tabs (1) length mismatch",
      "buttons not found",
    ]);

    expect(active(root("#mismatch"))).toEqual({ buttons: [false, false], panels: [false] });
  });
});

describe("callbacks", () => {
  it("on() reports changes of the given element only, until unbound", () => {
    document.body.innerHTML = `
      <div data-vanilla-tabs id="outer">
        <div data-buttons><span>a</span><span>b</span></div>
        <div data-tabs>
          <div>${markup(["x", "y"], -1, 'id="inner"')}</div>
          <div>B</div>
        </div>
      </div>`;

    const callback = vi.fn();

    const unbind = vanillaTabs.on(root("#outer"), callback);

    vanillaTabs.active();

    vanillaTabs.activeByIndex(root("#inner"), 1);

    expect(callback).toHaveBeenCalledTimes(1);

    expect(callback.mock.calls[0][0].parent).toBe(root("#outer"));

    expect(callback.mock.calls[0][1]).toBeInstanceOf(Event);

    unbind();

    vanillaTabs.activeByIndex(root("#outer"), 1);

    expect(callback).toHaveBeenCalledTimes(1);

    expect(() => vanillaTabs.on(null as unknown as Element, callback)).toThrow(/not valid DOM element/);
  });

  it("onChange is called only when the tab really changes", () => {
    document.body.innerHTML = html;

    const onChange = vi.fn();

    vanillaTabs.active({ onChange });

    vanillaTabs.active();

    vanillaTabs.activeByIndex(root(), 1);

    expect(onChange).toHaveBeenCalledTimes(1);

    vanillaTabs.activeByIndex(root(), 0);

    expect(onChange).toHaveBeenCalledTimes(2);

    expect(onChange).toHaveBeenLastCalledWith({ button: buttons()[0], tab: panels()[0], index: 0 });
  });

  it("onChange can be bound by element or by id, the last one wins", () => {
    document.body.innerHTML = html;

    const first = vi.fn();

    const second = vi.fn();

    const [id] = vanillaTabs.active();

    vanillaTabs.bindOnChange(root(), first);

    vanillaTabs.bindOnChange(id, second);

    vanillaTabs.activeByIndex(root(), 0);

    expect(first).not.toHaveBeenCalled();

    expect(second).toHaveBeenCalledTimes(1);
  });

  it("a copy of an element (cloneNode) gets its own id and doesn't share onChange with the original", () => {
    document.body.innerHTML = html;

    const onChange = vi.fn();

    vanillaTabs.active({ onChange });

    onChange.mockClear();

    const clone = root().cloneNode(true) as HTMLElement;

    document.body.appendChild(clone);

    vanillaTabs.activeByIndex(clone, 0);

    expect(onChange).not.toHaveBeenCalled();

    expect(clone.getAttribute("data-vanilla-tab-id")).not.toBe(root().getAttribute("data-vanilla-tab-id"));

    // ids of buttons and panels are copied by cloneNode - that is a duplicate the page author has to solve
    expect(index(clone)).toBe(0);

    expect(index(root())).toBe(1);
  });
});

describe("setup()", () => {
  it("copies colors from attributes and injects the arrows once", () => {
    document.body.innerHTML = html;

    vanillaTabs.setup(root());

    vanillaTabs.setup(root());

    expect(root().style.getPropertyValue("--vanilla-tabs-lines-color")).toBe("navy");

    expect(root().style.getPropertyValue("--vanilla-tabs-background-color")).toBe("");

    expect(root().querySelectorAll(":scope > [data-vanilla-tabs-nav]")).toHaveLength(2);
  });

  it("does nothing without [data-buttons]", () => {
    document.body.innerHTML = `<div data-vanilla-tabs data-lines-color="navy"></div>`;

    vanillaTabs.setup(root());

    expect(root().children).toHaveLength(0);
  });
});

describe("overflow arrows", () => {
  /**
   * Fakes the layout: [data-buttons] has content 600px wide in the box of given width,
   * the root element is "root" px wide
   */
  function layout(sizes: { root: number; buttons: number; scrollLeft?: number }) {
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(function (this: HTMLElement) {
      return this.hasAttribute("data-buttons") ? 600 : 0;
    });

    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
      if (this.hasAttribute("data-buttons")) {
        return sizes.buttons;
      }

      return this.hasAttribute("data-vanilla-tabs") ? sizes.root : 0;
    });

    vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockImplementation(function (this: HTMLElement) {
      return this.hasAttribute("data-buttons") ? (sizes.scrollLeft ?? 0) : 0;
    });
  }

  function arrows() {
    return {
      prev: root().querySelector<HTMLButtonElement>(':scope > [data-vanilla-tabs-nav="prev"]')!,
      next: root().querySelector<HTMLButtonElement>(':scope > [data-vanilla-tabs-nav="next"]')!,
    };
  }

  it("are not announced when buttons fit (jsdom: all widths are 0)", () => {
    document.body.innerHTML = html;

    vanillaTabs.active();

    expect(root().hasAttribute("data-overflow")).toBe(false);
  });

  it("show up when buttons don't fit, only 'next' is enabled at the beginning", () => {
    layout({ root: 300, buttons: 220 });

    document.body.innerHTML = html;

    vanillaTabs.active();

    expect(root().hasAttribute("data-overflow")).toBe(true);

    expect(arrows().prev.disabled).toBe(true);

    expect(arrows().next.disabled).toBe(false);
  });

  it("are updated on scroll and by updateOverflow()", () => {
    const sizes = { root: 300, buttons: 220, scrollLeft: 0 };

    layout(sizes);

    document.body.innerHTML = html;

    vanillaTabs.active();

    sizes.scrollLeft = 380;

    root().querySelector(":scope > [data-buttons]")!.dispatchEvent(new Event("scroll"));

    expect(arrows().prev.disabled).toBe(false);

    expect(arrows().next.disabled).toBe(true);

    sizes.root = 700;

    vanillaTabs.updateOverflow(root());

    expect(root().hasAttribute("data-overflow")).toBe(false);
  });
});

describe("watchMutationsEnable()", () => {
  it("activates tabs added later, also nested in the added element", async () => {
    vanillaTabs.autoenable();

    const events = record();

    const wrapper = document.createElement("section");

    wrapper.innerHTML = html + markup(["a", "b"]);

    document.body.appendChild(wrapper);

    await mutations();

    const [first, second] = Array.from(document.querySelectorAll("[data-vanilla-tabs]"));

    expect(index(first)).toBe(1);

    expect(index(second)).toBe(0);

    expect(events).toHaveLength(2);

    buttons(second)[1].click();

    expect(index(second)).toBe(1);
  });

  it("doesn't touch tabs which are not affected by the mutation", async () => {
    document.body.innerHTML = html;

    vanillaTabs.autoenable();

    const onChange = vi.fn();

    vanillaTabs.bindOnChange(root(), onChange);

    const setup = vi.spyOn(vanillaTabs, "setup");

    const wrapper = document.createElement("section");

    wrapper.innerHTML = markup(["a", "b"]);

    document.body.appendChild(wrapper);

    await mutations();

    expect(setup).toHaveBeenCalledTimes(1);

    expect(setup.mock.calls[0][0]).toBe(wrapper.firstElementChild);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("handles a button and a panel added to existing tabs in separate steps", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    document.body.innerHTML = html;

    vanillaTabs.autoenable();

    const button = document.createElement("span");

    button.textContent = "fourth";

    root().querySelector(":scope > [data-buttons]")!.appendChild(button);

    await mutations();

    // incomplete: nothing breaks, nothing changes
    expect(active().buttons).toEqual([false, true, false, false]);

    expect(button.hasAttribute("role")).toBe(false);

    const panel = document.createElement("div");

    root().querySelector(":scope > [data-tabs]")!.appendChild(panel);

    await mutations();

    expect(button.getAttribute("role")).toBe("tab");

    expect(button.getAttribute("aria-controls")).toBe(panel.id);

    button.click();

    expect(index()).toBe(3);

    expect(warn).not.toHaveBeenCalled();
  });

  it("activates the first tab when the active one is removed", async () => {
    document.body.innerHTML = html;

    vanillaTabs.autoenable();

    const events = record();

    buttons()[1].remove();

    panels()[1].remove();

    await mutations();

    expect(index()).toBe(0);

    expect(events.map((e) => e.button.textContent)).toEqual(["first"]);
  });

  it("follows changes of the color attributes", async () => {
    document.body.innerHTML = html;

    vanillaTabs.autoenable();

    root().setAttribute("data-lines-color", "red");

    root().setAttribute("data-background-color", "white");

    await mutations();

    expect(root().style.getPropertyValue("--vanilla-tabs-lines-color")).toBe("red");

    expect(root().style.getPropertyValue("--vanilla-tabs-background-color")).toBe("white");

    root().removeAttribute("data-lines-color");

    await mutations();

    expect(root().style.getPropertyValue("--vanilla-tabs-lines-color")).toBe("");
  });

  it("stops after watchMutationsDisable()", async () => {
    vanillaTabs.autoenable();

    vanillaTabs.watchMutationsDisable();

    document.body.innerHTML = markup(["a", "b"]);

    await mutations();

    expect(index()).toBe(-1);
  });
});

describe("autoenable() / destroy()", () => {
  it("autoenable() is safe to call many times and autoenableUnbind() stops everything", async () => {
    document.body.innerHTML = html;

    const events = record();

    vanillaTabs.autoenable();

    vanillaTabs.autoenable();

    expect(events).toHaveLength(1);

    vanillaTabs.autoenableUnbind!();

    expect(vanillaTabs.autoenableUnbind).toBeUndefined();

    buttons()[0].click();

    document.body.insertAdjacentHTML("beforeend", markup(["a", "b"]));

    await mutations();

    expect(index()).toBe(1);

    expect(index(document.querySelectorAll("[data-vanilla-tabs]")[1])).toBe(-1);
  });

  it("destroy() removes listeners of prepared elements and the library can be enabled again", () => {
    document.body.innerHTML = html;

    vanillaTabs.autoenable();

    const update = vi.spyOn(vanillaTabs, "updateOverflow");

    const row = root().querySelector(":scope > [data-buttons]")!;

    row.dispatchEvent(new Event("scroll"));

    expect(update).toHaveBeenCalledTimes(1);

    vanillaTabs.destroy();

    row.dispatchEvent(new Event("scroll"));

    buttons()[0].click();

    expect(update).toHaveBeenCalledTimes(1);

    expect(index()).toBe(1);

    vanillaTabs.autoenable();

    buttons()[0].click();

    expect(index()).toBe(0);

    update.mockClear();

    row.dispatchEvent(new Event("scroll"));

    expect(update).toHaveBeenCalledTimes(1);
  });
});

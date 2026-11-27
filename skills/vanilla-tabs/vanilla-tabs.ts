/**
 * https://github.com/stopsopa/tabs
 *
 * Source of truth of the library (ES module with exported types).
 * The js files next to this file are GENERATED from it with esbuild and are not stored in git:
 *
 *   vanilla-tabs.esm.js  - ES module       (+ autoenable by ?vanilla-tabs-autoenable in the import url)
 *   vanilla-tabs.js      - classic script  <script src="vanilla-tabs.js"> defining window.vanillaTabs
 *
 * To generate them (from the root of the repository https://github.com/stopsopa/tabs):
 *
 *   npm install
 *   /bin/bash transpile.sh        (or: xx transpile)
 *
 * In a TypeScript project this file can be also imported directly:
 *
 *   import vanillaTabs, { type VanillaTabs } from "./vanilla-tabs.ts";
 *   vanillaTabs.autoenable();
 *
 * Importing this module in an environment without DOM (SSR) is safe - nothing is touched until
 * the methods are called. In the browser it also defines window.vanillaTabs.
 */

export type VanillaTabsOnChange = (data: { button: Element; tab: Element; index: number }) => void;

/**
 * Every time tab becomes visible (including first activation on init) CustomEvent
 * "vanilla-tabs:change" is dispatched on the tab content element and it bubbles, so:
 *
 *   document.addEventListener("vanilla-tabs:change", (e) => {
 *     const { parent, button, tab, index, previousIndex } = e.detail;
 *   });
 *
 * Before a change requested by the user (click, keyboard - not by the api) cancelable CustomEvent
 * "vanilla-tabs:before-change" with the same detail is dispatched in the same way:
 *
 *   document.addEventListener("vanilla-tabs:before-change", (e) => {
 *     if (unsavedChanges) e.preventDefault(); // tab stays
 *   });
 */
export type VanillaTabsChangeDetail = {
  parent: Element;
  button: Element;
  tab: Element;
  index: number;
  /**
   * Zero based index of the tab which was visible before, -1 when there was none (first activation)
   */
  previousIndex: number;
};

export type VanillaTabsExtra = {
  buttons?: Element[];
  tabs?: Element[];
  onChange?: VanillaTabsOnChange;
};

export type VanillaTabsUnbind = () => void;

export interface VanillaTabs {
  /**
   * One time preparation of single [data-vanilla-tabs] element (colors from attributes, arrows).
   * Called by active(), safe to call many times.
   */
  setup(parent: HTMLElement): void;
  updateOverflow(parent: HTMLElement): void;
  scrollToButton(button: Element): void;
  getNewId(): string;
  produceId(parent: Element): string;
  /**
   * Activates initial tab (button with class "active", otherwise the first one) in every [data-vanilla-tabs]
   * of the document, or of given root (the root itself included). Returns ids of processed elements.
   */
  active(opt?: { onChange?: VanillaTabsOnChange; root?: ParentNode }): string[];
  activeByButtonElement(parent: Element, target: Element, extra?: VanillaTabsExtra): string;
  /**
   * Binds callback to single [data-vanilla-tabs] element, called when its tab changes.
   * Prefer on() or the "vanilla-tabs:change" event - they do the same and can be unbound.
   */
  bindOnChange(parent: Element | string, onChange?: VanillaTabsOnChange): void;
  activeByIndex(parent: Element, zeroIndex?: number, extra?: VanillaTabsExtra): string;
  /**
   * Starts handling clicks and keyboard (delegated listeners on document).
   * Returns unbind function (the same one when called again while bound).
   */
  bind(): VanillaTabsUnbind;
  /**
   * Binds callback to single [data-vanilla-tabs] element (events from nested tabs are ignored).
   * Listener is attached to the element itself, nothing global holds reference to it,
   * so once element is removed from DOM listener is gone together with it.
   * Returns function to unbind manually.
   */
  on(parent: Element, callback: (detail: VanillaTabsChangeDetail, event: Event) => void): VanillaTabsUnbind;
  watchMutationsEnable(): void;
  watchMutationsDisable(): void;
  /**
   * bind() + active() + watchMutationsEnable() in one call. Safe to call many times.
   * Called automatically when ?vanilla-tabs-autoenable is in the url of the script
   * or when body has class vanilla-tabs-autoenable
   */
  autoenable(): void;
  autoenableUnbind?: () => void;
  /**
   * Removes everything the library attached: listeners on document, mutation observer, resize observer
   * and scroll listeners of all prepared elements. Markup (classes, attributes, arrows) stays as it is.
   * After that the library can be enabled again.
   */
  destroy(): void;
}

declare global {
  interface Window {
    vanillaTabs: VanillaTabs;
  }
}

const vanillaTabs: VanillaTabs = (function (): VanillaTabs {
  // keyed by element: nothing leaks when element is removed and copies of an element (cloneNode) share nothing
  let onChangeEvents = new WeakMap<Element, VanillaTabsOnChange>();

  let ids = new WeakMap<Element, string>();

  const dataidkey = "data-vanilla-tab-id";

  const changeEventName = "vanilla-tabs:change";

  const beforeChangeEventName = "vanilla-tabs:before-change";

  const rootSelector = "[data-vanilla-tabs]";

  const buttonSelector = "[data-vanilla-tabs] > [data-buttons] > *";

  const navSelector = "[data-vanilla-tabs] > [data-vanilla-tabs-nav]";

  const colors = [
    ["data-background-color", "--vanilla-tabs-background-color"],
    ["data-lines-color", "--vanilla-tabs-lines-color"],
  ];

  let i = 0;

  function warn(...args: unknown[]): void {
    if (typeof console !== "undefined") {
      console.warn("vanilla-tabs:", ...args);
    }
  }

  function th(msg: string, ...context: unknown[]): Error {
    const error = new Error(`vanilla-tabs error: ${msg}`) as Error & { context?: unknown[] };

    // visible when the error is inspected in the console
    error.context = context;

    return error;
  }

  function isElement(value: unknown): value is Element {
    // nodeType: elements from another frame are not instances of Element of this window
    return typeof value === "object" && value !== null && (value as Node).nodeType === 1;
  }

  function children(parent: Element, selector: string): Element[] {
    const container = parent.querySelector(`:scope > ${selector}`);

    return container ? Array.from(container.children) : [];
  }

  function elementId(element: Element, prefix: string): string {
    if (!element.id) {
      i += 1;

      element.id = `${prefix}-${i}`;
    }

    return element.id;
  }

  /**
   * Roles and aria attributes (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) + roving tabindex:
   * only active button is in the tab order, the others are reached with arrow keys
   */
  function accessibility(parent: Element, buttons: Element[], tabs: Element[], zeroIndex: number): void {
    parent.querySelector(":scope > [data-buttons]")?.setAttribute("role", "tablist");

    buttons.forEach(function (button, i) {
      const tab = tabs[i];

      button.setAttribute("role", "tab");

      button.setAttribute("aria-selected", i === zeroIndex ? "true" : "false");

      button.setAttribute("tabindex", i === zeroIndex ? "0" : "-1");

      button.setAttribute("aria-controls", elementId(tab, "vanilla-tabs-tab"));

      tab.setAttribute("role", "tabpanel");

      tab.setAttribute("aria-labelledby", elementId(button, "vanilla-tabs-button"));
    });
  }

  function applyColors(parent: HTMLElement, remove: boolean): void {
    colors.forEach(([attr, variable]) => {
      const value = parent.getAttribute(attr);

      if (typeof value === "string" && value.trim()) {
        parent.style.setProperty(variable, value.trim());
      } else if (remove) {
        parent.style.removeProperty(variable);
      }
    });
  }

  /**
   * setup() + activation of the button with class "active" (or the first one).
   * silent: used for elements which might be incomplete at the moment (page still parsed, framework
   * adding buttons and panels in separate steps) - they are handled again when the rest arrives
   */
  function activate(parent: HTMLElement, onChange: VanillaTabsOnChange | undefined, silent: boolean): void {
    tool.setup(parent);

    const buttons = children(parent, "[data-buttons]");

    if (silent && (buttons.length === 0 || buttons.length !== children(parent, "[data-tabs]").length)) {
      return;
    }

    const index = buttons.findIndex((button) => button.classList.contains("active"));

    tool.activeByIndex(parent, Math.max(index, 0), { buttons, onChange });
  }

  /**
   * Change requested by the user (click, keyboard): it can be cancelled in "vanilla-tabs:before-change"
   */
  function request(parent: Element, buttons: Element[], zeroIndex: number): boolean {
    const tabs = children(parent, "[data-tabs]");

    const button = buttons[zeroIndex];

    const tab = tabs[zeroIndex];

    if (button && tab && !button.classList.contains("active")) {
      const detail: VanillaTabsChangeDetail = {
        parent,
        button,
        tab,
        index: zeroIndex,
        previousIndex: buttons.findIndex((b) => b.classList.contains("active")),
      };

      const allowed = tab.dispatchEvent(
        new CustomEvent(beforeChangeEventName, { bubbles: true, cancelable: true, detail }),
      );

      if (!allowed) {
        return false;
      }
    }

    tool.activeByIndex(parent, zeroIndex, { buttons, tabs });

    return true;
  }

  let unbind: VanillaTabsUnbind | undefined;

  let prepared = new WeakSet<Element>();

  // all scroll listeners of prepared elements are removed with one abort() in destroy()
  let listeners: AbortController | undefined;

  let resizeObserver: ResizeObserver | undefined;

  let observer: MutationObserver | undefined;

  const tool: VanillaTabs = {
    /**
     * One time preparation of single [data-vanilla-tabs] element:
     *  - colors from attributes data-background-color & data-lines-color
     *  - prev/next arrows for the case when buttons don't fit in available width
     */
    setup: function (parent) {
      const buttons = parent.querySelector<HTMLElement>(":scope > [data-buttons]");

      if (!buttons) {
        return;
      }

      applyColors(parent, false);

      [
        ["prev", "‹", "previous tabs"],
        ["next", "›", "next tabs"],
      ].forEach(([dir, label, aria]) => {
        if (parent.querySelector(`:scope > [data-vanilla-tabs-nav="${dir}"]`)) {
          return;
        }

        const nav = document.createElement("button");

        nav.setAttribute("type", "button");

        nav.setAttribute("data-vanilla-tabs-nav", dir);

        nav.setAttribute("aria-label", aria);

        // arrows only scroll the row: keyboard users move between tabs with arrow keys and the row follows
        nav.setAttribute("tabindex", "-1");

        nav.textContent = label;

        parent.appendChild(nav);
      });

      if (!prepared.has(buttons)) {
        prepared.add(buttons);

        if (!listeners && typeof AbortController === "function") {
          listeners = new AbortController();
        }

        buttons.addEventListener("scroll", () => this.updateOverflow(parent), {
          passive: true,
          signal: listeners?.signal,
        });

        if (typeof ResizeObserver === "function") {
          if (!resizeObserver) {
            resizeObserver = new ResizeObserver((entries) => {
              entries.forEach((entry) => {
                const root = entry.target.parentElement;

                if (root) {
                  this.updateOverflow(root);
                }
              });
            });
          }

          resizeObserver.observe(buttons);
        }
      }

      this.updateOverflow(parent);
    },
    /**
     * Shows/hides arrows and enables/disables them depending on scroll position.
     * Called automatically on resize, scroll and (in watch mode) when buttons are added/removed.
     * Call it manually if you change buttons and you don't use watchMutationsEnable()
     */
    updateOverflow: function (parent) {
      const buttons = parent.querySelector<HTMLElement>(":scope > [data-buttons]");

      if (!buttons) {
        return;
      }

      // comparing with width of parent (not buttons) because that width doesn't depend on
      // visibility of arrows - otherwise it could flip back and forth forever
      const overflow = buttons.scrollWidth > parent.clientWidth;

      if (overflow !== parent.hasAttribute("data-overflow")) {
        parent.toggleAttribute("data-overflow", overflow);

        const active = buttons.querySelector(":scope > .active");

        if (active) {
          this.scrollToButton(active);
        }
      }

      const max = buttons.scrollWidth - buttons.clientWidth;

      const prev = parent.querySelector<HTMLButtonElement>(':scope > [data-vanilla-tabs-nav="prev"]');

      const next = parent.querySelector<HTMLButtonElement>(':scope > [data-vanilla-tabs-nav="next"]');

      if (prev) {
        prev.disabled = buttons.scrollLeft <= 1;
      }

      if (next) {
        next.disabled = buttons.scrollLeft >= max - 1;
      }
    },
    /**
     * Scrolls only the row of buttons (never the page) to make given button fully visible
     */
    scrollToButton: function (button) {
      const container = button.parentElement;

      if (!container) {
        return;
      }

      const c = container.getBoundingClientRect();

      const b = button.getBoundingClientRect();

      if (b.left < c.left) {
        container.scrollLeft -= c.left - b.left;
      } else if (b.right > c.right) {
        container.scrollLeft += b.right - c.right;
      }
    },
    getNewId: function () {
      i += 1;

      return `vanilla-tabs-${i}`;
    },
    produceId: function (parent) {
      if (!isElement(parent)) {
        throw th(`parent argument is not valid DOM element`, parent);
      }

      let id = ids.get(parent);

      if (typeof id !== "string") {
        // the attribute is only informative. It is not trusted: a copy of an element (cloneNode, innerHTML)
        // comes with the attribute of the original and gets its own id here
        id = this.getNewId();

        ids.set(parent, id);

        parent.setAttribute(dataidkey, id);
      }

      return id;
    },
    active: function (opt) {
      const list: string[] = [];

      const { onChange, root } = { ...opt };

      const scope: ParentNode = root || document;

      const found = Array.from(scope.querySelectorAll<HTMLElement>(rootSelector));

      if (isElement(scope) && scope.matches(rootSelector)) {
        found.unshift(scope as HTMLElement);
      }

      found.forEach((parent) => {
        list.push(this.produceId(parent));

        // one broken element doesn't stop the others
        try {
          activate(parent, onChange, false);
        } catch (e) {
          warn(e, parent);
        }
      });

      return list;
    },
    activeByButtonElement: function (parent, target, extra) {
      const id = this.produceId(parent);

      let { buttons, onChange } = { ...extra };

      if (!buttons) {
        buttons = children(parent, "[data-buttons]");
      }

      const zeroIndex = buttons.indexOf(target);

      if (zeroIndex === -1) {
        throw th(`target is not a button (direct child of [data-buttons]) of given parent`, target, parent);
      }

      this.activeByIndex(parent, zeroIndex, { buttons, onChange });

      return id;
    },
    bindOnChange: function (parent, onChange) {
      const element =
        typeof parent === "string" ? document.querySelector(`[${dataidkey}=${JSON.stringify(parent)}]`) : parent;

      if (element && typeof onChange === "function") {
        onChangeEvents.set(element, onChange);
      }
    },
    activeByIndex: function (parent, zeroIndex = 0, extra) {
      const id = this.produceId(parent);

      let { buttons, tabs, onChange } = { ...extra };

      this.bindOnChange(parent, onChange);

      if (!buttons) {
        buttons = children(parent, "[data-buttons]");
      }

      if (buttons.length === 0) {
        warn(`buttons not found`, parent);

        return id;
      }

      if (!tabs) {
        tabs = children(parent, "[data-tabs]");
      }

      if (tabs.length === 0) {
        warn(`tabs not found`, parent);

        return id;
      }

      if (buttons.length !== tabs.length) {
        // not an exception: it happens for a moment when buttons and panels are added in separate steps
        warn(`buttons (${buttons.length}) and tabs (${tabs.length}) length mismatch`, parent);

        return id;
      }

      if (!Number.isInteger(zeroIndex) || zeroIndex < 0 || zeroIndex >= buttons.length) {
        throw th(`zeroIndex ${zeroIndex} is not an integer from 0 to ${buttons.length - 1}`, zeroIndex, parent);
      }

      const list = tabs;

      const button = buttons[zeroIndex];

      const tab = list[zeroIndex];

      const previousIndex = buttons.findIndex((b, i) => i !== zeroIndex && b.classList.contains("active"));

      const changed = !button.classList.contains("active") || !tab.classList.contains("active");

      buttons.forEach(function (b, i) {
        b.classList.toggle("active", i === zeroIndex);

        list[i].classList.toggle("active", i === zeroIndex);
      });

      accessibility(parent, buttons, list, zeroIndex);

      tool.scrollToButton(button);

      if (changed) {
        const detail: VanillaTabsChangeDetail = { parent, button, tab, index: zeroIndex, previousIndex };

        tab.dispatchEvent(new CustomEvent(changeEventName, { bubbles: true, detail }));

        const callback = onChangeEvents.get(parent);

        if (callback) {
          callback({ button, tab, index: zeroIndex });
        }
      }

      return id;
    },
    bind: function () {
      if (unbind) {
        return unbind;
      }

      const click = (e: MouseEvent) => {
        const target = e.target;

        if (!isElement(target)) {
          return;
        }

        const nav = target.closest(navSelector);

        if (nav) {
          const buttons = nav.parentElement?.querySelector(":scope > [data-buttons]");

          if (buttons) {
            const direction = nav.getAttribute("data-vanilla-tabs-nav") === "prev" ? -1 : 1;

            buttons.scrollBy({
              left: direction * Math.max(buttons.clientWidth * 0.7, 50),
              behavior: "smooth",
            });
          }

          return;
        }

        // closest: the click might land on an element nested in the button (icon, <b>...)
        const button = target.closest(buttonSelector);

        const parent = button?.parentElement?.parentElement;

        if (!button || !parent) {
          return;
        }

        // <a href="#"> used as a button must not navigate
        if (button.matches("a[href]")) {
          e.preventDefault();
        }

        const buttons = children(parent, "[data-buttons]");

        request(parent, buttons, buttons.indexOf(button));
      };

      const keydown = (e: KeyboardEvent) => {
        const button = e.target;

        // only when the button itself has focus, not something inside of a panel or of the button
        if (!isElement(button) || !button.matches(buttonSelector) || e.altKey || e.ctrlKey || e.metaKey) {
          return;
        }

        const parent = button.parentElement?.parentElement;

        if (!parent) {
          return;
        }

        const buttons = children(parent, "[data-buttons]");

        const current = buttons.indexOf(button);

        const last = buttons.length - 1;

        let index: number;

        switch (e.key) {
          case "ArrowRight":
            index = current === last ? 0 : current + 1;
            break;
          case "ArrowLeft":
            index = current === 0 ? last : current - 1;
            break;
          case "Home":
            index = 0;
            break;
          case "End":
            index = last;
            break;
          case "Enter":
          case " ":
            index = current;
            break;
          default:
            return;
        }

        e.preventDefault();

        if (request(parent, buttons, index)) {
          (buttons[index] as HTMLElement).focus();
        }
      };

      // document (not document.body): it exists also when the script is loaded in <head>
      document.addEventListener("click", click);

      document.addEventListener("keydown", keydown);

      unbind = () => {
        document.removeEventListener("click", click);

        document.removeEventListener("keydown", keydown);

        unbind = undefined;
      };

      return unbind;
    },
    on: function (parent, callback) {
      if (!isElement(parent)) {
        throw th(`on(): parent argument is not valid DOM element`, parent);
      }

      const handler = (e: Event) => {
        const detail = (e as CustomEvent<VanillaTabsChangeDetail>).detail;

        // skip events bubbling from tabs nested inside this one
        if (detail && detail.parent === parent) {
          callback(detail, e);
        }
      };

      parent.addEventListener(changeEventName, handler);

      return () => {
        parent.removeEventListener(changeEventName, handler);
      };
    },
    watchMutationsEnable: function () {
      if (observer) {
        return;
      }

      observer = new MutationObserver(function (mutations) {
        // only [data-vanilla-tabs] elements touched by the mutations are processed, not the whole document
        const changed = new Set<HTMLElement>();

        const collect = (node: Node, deep: boolean) => {
          if (!isElement(node) || node.matches(navSelector)) {
            return;
          }

          // element added to / removed from existing tabs: button, panel, [data-buttons], [data-tabs]
          const root = node.closest<HTMLElement>(rootSelector);

          if (root) {
            changed.add(root);
          }

          // added element contains tabs
          if (deep) {
            node.querySelectorAll<HTMLElement>(rootSelector).forEach((el) => changed.add(el));
          }
        };

        mutations.forEach(function (mutation) {
          const target = mutation.target;

          if (mutation.type === "attributes") {
            if (target instanceof HTMLElement && target.matches(rootSelector)) {
              applyColors(target, true);
            }

            return;
          }

          mutation.addedNodes.forEach((node) => collect(node, true));

          // removed nodes are detached, so the place they were removed from is checked instead
          if (mutation.removedNodes.length > 0 && isElement(target) && target.matches("[data-buttons], [data-tabs]")) {
            const removed = Array.from(mutation.removedNodes).some((node) => isElement(node));

            if (removed) {
              collect(target, false);
            }
          }
        });

        changed.forEach(function (parent) {
          if (!parent.isConnected) {
            return;
          }

          try {
            activate(parent, undefined, true);
          } catch (e) {
            warn(e, parent);
          }
        });
      });

      // document (not document.body): it exists also when the script is loaded in <head>
      observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: colors.map(([attr]) => attr),
      });
    },
    watchMutationsDisable: function () {
      if (observer) {
        observer.disconnect();
      }

      observer = undefined;
    },
    autoenable: function () {
      if (tool.autoenableUnbind) {
        return;
      }

      const off = tool.bind();

      tool.active();

      tool.watchMutationsEnable();

      tool.autoenableUnbind = function () {
        tool.watchMutationsDisable();

        off();

        delete tool.autoenableUnbind;
      };
    },
    destroy: function () {
      tool.autoenableUnbind?.();

      unbind?.();

      tool.watchMutationsDisable();

      resizeObserver?.disconnect();

      resizeObserver = undefined;

      listeners?.abort();

      listeners = undefined;

      prepared = new WeakSet();

      onChangeEvents = new WeakMap();

      ids = new WeakMap();
    },
  };

  // autoenable when certain condition met

  // no DOM (module imported on the server) - nothing to detect
  if (typeof document !== "undefined") {
    // ?vanilla-tabs-autoenable in the url of the classic script which is executing right now.
    // (ES module: document.currentScript is null, generated vanilla-tabs.esm.js checks import.meta.url itself)
    const src = document.currentScript?.getAttribute("src");

    const byUrl =
      typeof src === "string" &&
      src.length > 0 &&
      new URL(src, window.location.href).searchParams.has("vanilla-tabs-autoenable");

    const byClass = () => Boolean(document.body?.classList.contains("vanilla-tabs-autoenable"));

    if (byUrl || byClass()) {
      tool.autoenable();
    } else if (!document.body) {
      // script in <head>: class of <body> is not known yet
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          if (byClass()) {
            tool.autoenable();
          }
        },
        { once: true },
      );
    }
  }

  return tool;
})();

if (typeof window !== "undefined") {
  window.vanillaTabs = vanillaTabs;
}

export { vanillaTabs };

export default vanillaTabs;

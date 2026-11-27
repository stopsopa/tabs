/**
 * React version of https://github.com/stopsopa/tabs
 *
 * This file is self-contained: it imports only "react". To use it in a project copy two files
 * (this one and vanilla-tabs.css from the same directory) - see "React" in README.md
 *
 *   import { Tabs, Tab } from "./Tabs";
 *   import "./vanilla-tabs.css";
 *
 *   <Tabs defaultIndex={1} onChange={(index) => {}} backgroundColor="white" linesColor="navy">
 *     <Tab label="first">content of first</Tab>
 *     <Tab label="second" onShow={({ tab }) => {}}>content of second</Tab>
 *     <Tab label="third" lazy>rendered when opened for the first time</Tab>
 *   </Tabs>
 *
 * Three ways to react to a change of the tab:
 *  - onChange(index)  - user picked another tab (not called for the initial one). Pair of the "index" prop.
 *  - onShow(detail)   - a tab became visible, for any reason, including the initial one. On <Tabs> (all tabs)
 *                       and on <Tab> (that tab). Place for imperative js: charts, focus, measuring, fetching...
 *  - <Tab lazy>       - content of the tab is not rendered until the tab is opened for the first time
 *                       (<Tab unmountOnHide>: it is rendered only while the tab is visible)
 *
 * Together with onShow the bubbling DOM event "vanilla-tabs:change" (detail = argument of onShow) is dispatched on
 * the panel, exactly like in the vanilla version - one listener on document can serve both.
 *
 * Keyboard (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): only active button is in the tab order,
 * ArrowLeft / ArrowRight / Home / End move to another tab and open it, Enter / Space open focused one.
 *
 * Important:
 *  - It is implemented in React itself, it does NOT run the vanilla library (vanilla-tabs.ts): state lives
 *    in React, nothing touches window/document during render, so it is safe for SSR.
 *  - It renders exactly the same markup ([data-vanilla-tabs] > [data-buttons] + [data-tabs]) as the vanilla
 *    version, so the look comes from the same vanilla-tabs.css - the stylesheet has to be loaded by the app.
 *  - All panels are rendered all the time (inactive ones are hidden with css), so the state of components
 *    inside inactive tabs is preserved.
 *  - Don't run vanillaTabs.autoenable() / vanillaTabs.bind() on a page with this component: the vanilla
 *    click handler would switch classes of the same elements behind React's back (matters in controlled mode).
 */
import {
  Children,
  Fragment,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

/**
 * Argument of onShow. The same shape as detail of the "vanilla-tabs:change" event of the vanilla version.
 */
export type TabsShowDetail = {
  /**
   * Root [data-vanilla-tabs] element
   */
  parent: HTMLDivElement;
  /**
   * Button of the tab which became visible (child of [data-buttons])
   */
  button: HTMLElement;
  /**
   * Panel which became visible (child of [data-tabs]) - already displayed, can be measured
   */
  tab: HTMLDivElement;
  /**
   * Zero based index of the tab
   */
  index: number;
  /**
   * Zero based index of the tab which was visible before, -1 for the initial tab
   */
  previousIndex: number;
};

export type TabProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /**
   * Content of the button
   */
  label: ReactNode;
  /**
   * Content of the panel
   */
  children?: ReactNode;
  /**
   * Called every time this tab becomes visible (also when it is the initially active one).
   * Runs after the panel is displayed, so its content can be measured.
   */
  onShow?: (detail: TabsShowDetail) => void;
  /**
   * true: children are not rendered until the tab is opened for the first time (then they stay mounted).
   * Default: false - all panels are rendered from the beginning
   */
  lazy?: boolean;
  /**
   * true: children are rendered only while the tab is visible - they are unmounted (their state is lost)
   * when another tab is opened. Default: false - they stay mounted, hidden with css
   */
  unmountOnHide?: boolean;
};

/**
 * Describes one tab: its button (label) and its panel (children).
 * Other props (className, style, data-*...) land on the panel <div>.
 * It renders nothing on its own - <Tabs> reads its props, so it has to be a direct child of <Tabs>.
 */
export function Tab(_props: TabProps): ReactElement | null {
  return null;
}

export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> & {
  /**
   * <Tab> elements: direct children, or in fragments / arrays (not wrapped in another component)
   */
  children?: ReactNode;
  /**
   * Zero based index of active tab - controlled mode: the tab changes only when this prop changes,
   * use together with onChange
   */
  index?: number;
  /**
   * Zero based index of initially active tab - uncontrolled mode. Default: 0
   */
  defaultIndex?: number;
  /**
   * Called when user picks another tab (click or keyboard).
   * Not called for the initial tab and not called when already active tab is picked again.
   */
  onChange?: (index: number) => void;
  /**
   * Called every time any tab becomes visible: the initial one after mount, then after every change, no matter
   * whether it was the user (click, keyboard) or the "index" prop. For single tab use <Tab onShow>.
   */
  onShow?: (detail: TabsShowDetail) => void;
  /**
   * Background of active button and panel (css variable --vanilla-tabs-background-color). Default: transparent
   */
  backgroundColor?: string;
  /**
   * Color of borders, text of the buttons and arrows (css variable --vanilla-tabs-lines-color). Default: #565656
   */
  linesColor?: string;
};

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function cls(...list: (string | false | undefined)[]): string | undefined {
  return list.filter(Boolean).join(" ") || undefined;
}

type Item = { key: string; props: TabProps };

/**
 * List of tabs from children: fragments are flattened, everything what is not an element is ignored
 */
function collect(children: ReactNode, prefix = ""): Item[] {
  const list: Item[] = [];

  Children.toArray(children).forEach((child) => {
    if (!isValidElement(child)) {
      return;
    }

    // Children.toArray gives every element a key unique among its siblings
    const key = `${prefix}${child.key}`;

    if (child.type === Fragment) {
      list.push(...collect((child.props as { children?: ReactNode }).children, `${key}/`));
    } else {
      list.push({ key, props: child.props as TabProps });
    }
  });

  return list;
}

// forwardRef (deprecated in React 19, where ref is a regular prop) is what keeps this file working in React 18
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(props, ref) {
  const { children, index, defaultIndex = 0, onChange, onShow, backgroundColor, linesColor, style, ...rest } = props;

  const tabs = collect(children);

  const controlled = typeof index === "number";

  const [internal, setInternal] = useState(defaultIndex);

  const wanted = controlled ? index : internal;

  // index out of range (tab removed, wrong prop) falls to the closest existing tab
  const active = Math.min(Math.max(Number.isInteger(wanted) ? wanted : 0, 0), Math.max(tabs.length - 1, 0));

  const id = useId();

  const rootRef = useRef<HTMLDivElement | null>(null);

  const buttonsRef = useRef<HTMLDivElement | null>(null);

  const panelsRef = useRef<HTMLDivElement | null>(null);

  const activeKey = tabs[active]?.key ?? null;

  // keys of tabs which were active at least once - for <Tab lazy>
  const visited = useRef(new Set<string>());

  if (activeKey !== null) {
    visited.current.add(activeKey);
  }

  // onShow: effects don't depend on the identity of callbacks, the newest ones are always called
  const callbacks = useRef({ onShow, tabOnShow: tabs[active]?.props.onShow });

  callbacks.current = { onShow, tabOnShow: tabs[active]?.props.onShow };

  const shownIndex = useRef(-1);

  // key (not index) of the tab reported last time: removing a tab before the active one doesn't report anything,
  // replacing the active one does. It also swallows the second run of effects in <StrictMode>.
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (activeKey === null || shown.current === activeKey) {
      return;
    }

    const parent = rootRef.current;

    const button = buttonsRef.current?.children[active];

    const tab = panelsRef.current?.children[active];

    if (!parent || !(button instanceof HTMLElement) || !(tab instanceof HTMLDivElement)) {
      return;
    }

    shown.current = activeKey;

    const detail: TabsShowDetail = { parent, button, tab, index: active, previousIndex: shownIndex.current };

    shownIndex.current = active;

    callbacks.current.tabOnShow?.(detail);

    callbacks.current.onShow?.(detail);

    // the same event as in the vanilla version
    tab.dispatchEvent(new CustomEvent("vanilla-tabs:change", { bubbles: true, detail }));
  }, [active, activeKey]);

  const [overflow, setOverflow] = useState(false);

  const [prevDisabled, setPrevDisabled] = useState(true);

  const [nextDisabled, setNextDisabled] = useState(true);

  const setRoot = useCallback(
    (element: HTMLDivElement | null) => {
      rootRef.current = element;

      setRef(ref, element);
    },
    [ref],
  );

  // the same logic as updateOverflow() in vanilla-tabs.ts
  const updateOverflow = useCallback(() => {
    const root = rootRef.current;

    const buttons = buttonsRef.current;

    if (!root || !buttons) {
      return;
    }

    // comparing with width of root (not buttons) because that width doesn't depend on
    // visibility of arrows - otherwise it could flip back and forth forever
    setOverflow(buttons.scrollWidth > root.clientWidth);

    const max = buttons.scrollWidth - buttons.clientWidth;

    setPrevDisabled(buttons.scrollLeft <= 1);

    setNextDisabled(buttons.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    const buttons = buttonsRef.current;

    if (!buttons) {
      return;
    }

    buttons.addEventListener("scroll", updateOverflow, { passive: true });

    const resize = typeof ResizeObserver === "function" ? new ResizeObserver(updateOverflow) : undefined;

    resize?.observe(buttons);

    // buttons added / removed, labels changed: width of the content of the row changes without resizing the row
    const mutation = typeof MutationObserver === "function" ? new MutationObserver(updateOverflow) : undefined;

    mutation?.observe(buttons, { childList: true, subtree: true, characterData: true });

    updateOverflow();

    return () => {
      buttons.removeEventListener("scroll", updateOverflow);

      resize?.disconnect();

      mutation?.disconnect();
    };
  }, [updateOverflow]);

  // scrolls only the row of buttons (never the page) to make active button fully visible
  useEffect(() => {
    const buttons = buttonsRef.current;

    const button = buttons?.children[active];

    if (!buttons || !button) {
      return;
    }

    const c = buttons.getBoundingClientRect();

    const b = button.getBoundingClientRect();

    if (b.left < c.left) {
      buttons.scrollLeft -= c.left - b.left;
    } else if (b.right > c.right) {
      buttons.scrollLeft += b.right - c.right;
    }
  }, [active, overflow]);

  function select(i: number): void {
    if (i === active) {
      return;
    }

    if (!controlled) {
      setInternal(i);
    }

    onChange?.(i);
  }

  function keyDown(e: KeyboardEvent<HTMLSpanElement>, i: number): void {
    // only when the button itself has focus, not something inside of its label
    if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    const last = tabs.length - 1;

    let target: number;

    switch (e.key) {
      case "ArrowRight":
        target = i === last ? 0 : i + 1;
        break;
      case "ArrowLeft":
        target = i === 0 ? last : i - 1;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = last;
        break;
      case "Enter":
      case " ":
        target = i;
        break;
      default:
        return;
    }

    e.preventDefault();

    select(target);

    // also when controlled parent refuses the change: focus shows where Enter would try again
    const button = buttonsRef.current?.children[target];

    if (button instanceof HTMLElement) {
      button.focus();
    }
  }

  function scroll(direction: -1 | 1): void {
    const buttons = buttonsRef.current;

    if (buttons) {
      buttons.scrollBy({
        left: direction * Math.max(buttons.clientWidth * 0.7, 50),
        behavior: "smooth",
      });
    }
  }

  const variables: Record<string, string> = {};

  if (backgroundColor) {
    variables["--vanilla-tabs-background-color"] = backgroundColor;
  }

  if (linesColor) {
    variables["--vanilla-tabs-lines-color"] = linesColor;
  }

  return (
    <div
      {...rest}
      ref={setRoot}
      data-vanilla-tabs=""
      data-overflow={overflow ? "" : undefined}
      style={{ ...style, ...variables } as CSSProperties}
    >
      <div data-buttons="" role="tablist" ref={buttonsRef}>
        {tabs.map((tab, i) => (
          <span
            key={tab.key}
            role="tab"
            id={`${id}-button-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-tab-${i}`}
            tabIndex={i === active ? 0 : -1}
            className={cls(i === active && "active")}
            onClick={() => select(i)}
            onKeyDown={(e) => keyDown(e, i)}
          >
            {tab.props.label}
          </span>
        ))}
      </div>
      <div data-tabs="" ref={panelsRef}>
        {tabs.map((tab, i) => {
          const {
            label: _label,
            children: content,
            className,
            onShow: _onShow,
            lazy,
            unmountOnHide,
            ...panel
          } = tab.props;

          const hidden = (unmountOnHide && i !== active) || (lazy && !visited.current.has(tab.key));

          return (
            <div
              key={tab.key}
              {...panel}
              role="tabpanel"
              id={`${id}-tab-${i}`}
              aria-labelledby={`${id}-button-${i}`}
              className={cls(className, i === active && "active")}
            >
              {hidden ? null : content}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        data-vanilla-tabs-nav="prev"
        aria-label="previous tabs"
        tabIndex={-1}
        disabled={prevDisabled}
        onClick={() => scroll(-1)}
      >
        ‹
      </button>
      <button
        type="button"
        data-vanilla-tabs-nav="next"
        aria-label="next tabs"
        tabIndex={-1}
        disabled={nextDisabled}
        onClick={() => scroll(1)}
      >
        ›
      </button>
    </div>
  );
});

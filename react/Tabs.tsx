/**
 * React version of https://github.com/stopsopa/tabs
 *
 *   import { Tabs, Tab } from "@stopsopa/tabs/react";
 *   import "@stopsopa/tabs/vanilla-tabs.css";
 *
 *   <Tabs defaultIndex={1} onChange={(index) => {}} backgroundColor="white" linesColor="navy">
 *     <Tab label="first">content of first</Tab>
 *     <Tab label="second">content of second</Tab>
 *   </Tabs>
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

export type TabProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /**
   * Content of the button
   */
  label: ReactNode;
  /**
   * Content of the panel
   */
  children?: ReactNode;
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
   * <Tab> elements, direct children (not wrapped in a fragment or another component)
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
   * Called when user picks another tab (click, Enter or Space on the button).
   * Not called for the initial tab and not called when already active tab is picked again.
   */
  onChange?: (index: number) => void;
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

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(props, ref) {
  const { children, index, defaultIndex = 0, onChange, backgroundColor, linesColor, style, ...rest } = props;

  const tabs = Children.toArray(children).filter((child): child is ReactElement<TabProps> => isValidElement(child));

  const controlled = typeof index === "number";

  const [internal, setInternal] = useState(defaultIndex);

  const wanted = controlled ? index : internal;

  // index out of range (tab removed, wrong prop) falls to the closest existing tab
  const active = Math.min(Math.max(Number.isInteger(wanted) ? wanted : 0, 0), Math.max(tabs.length - 1, 0));

  const id = useId();

  const rootRef = useRef<HTMLDivElement | null>(null);

  const buttonsRef = useRef<HTMLDivElement | null>(null);

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

    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(updateOverflow) : undefined;

    observer?.observe(buttons);

    return () => {
      buttons.removeEventListener("scroll", updateOverflow);

      observer?.disconnect();
    };
  }, [updateOverflow]);

  // after every render: number of buttons or their labels might have changed.
  // It ends up in setState with the same values most of the time, which React ignores.
  useEffect(updateOverflow);

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
            tabIndex={0}
            className={cls(i === active && "active")}
            onClick={() => select(i)}
            onKeyDown={(e: KeyboardEvent<HTMLSpanElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();

                select(i);
              }
            }}
          >
            {tab.props.label}
          </span>
        ))}
      </div>
      <div data-tabs="">
        {tabs.map((tab, i) => {
          const { label: _label, children: content, className, ...panel } = tab.props;

          return (
            <div
              key={tab.key}
              {...panel}
              role="tabpanel"
              id={`${id}-tab-${i}`}
              aria-labelledby={`${id}-button-${i}`}
              className={cls(className, i === active && "active")}
            >
              {content}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        data-vanilla-tabs-nav="prev"
        aria-label="previous tabs"
        disabled={prevDisabled}
        onClick={() => scroll(-1)}
      >
        ‹
      </button>
      <button
        type="button"
        data-vanilla-tabs-nav="next"
        aria-label="next tabs"
        disabled={nextDisabled}
        onClick={() => scroll(1)}
      >
        ›
      </button>
    </div>
  );
});

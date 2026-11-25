/**
 * Tests of the React component react/Tabs.tsx (vitest + jsdom + @testing-library/react).
 *
 *   npm test          (or: xx test)
 *
 * jsdom has no layout: scrollWidth/clientWidth are always 0 and element.scrollBy() doesn't exist,
 * so tests of the overflow arrows define them by hand.
 */
import { createRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";

import { Tab, Tabs } from "../react/index.js";

afterEach(() => {
  cleanup();

  vi.restoreAllMocks();
});

function state(container: HTMLElement) {
  const root = container.querySelector<HTMLElement>("[data-vanilla-tabs]")!;

  const buttons = Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-buttons] > *"));

  const panels = Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-tabs] > div"));

  return {
    root,
    buttons,
    panels,
    activeButtons: buttons.map((b) => b.classList.contains("active")),
    activePanels: panels.map((p) => p.classList.contains("active")),
  };
}

function three(props?: Parameters<typeof Tabs>[0]) {
  return (
    <Tabs {...props}>
      <Tab label="first">content of first</Tab>
      <Tab label="second">content of second</Tab>
      <Tab label="third">content of third</Tab>
    </Tabs>
  );
}

describe("markup", () => {
  it("renders the markup vanilla-tabs.css expects", () => {
    const { container } = render(three());

    const { root, buttons, panels } = state(container);

    expect(root.children).toHaveLength(4);

    expect(root.querySelector(":scope > [data-buttons]")).not.toBeNull();

    expect(root.querySelector(":scope > [data-tabs]")).not.toBeNull();

    expect(root.querySelector(':scope > button[data-vanilla-tabs-nav="prev"]')).not.toBeNull();

    expect(root.querySelector(':scope > button[data-vanilla-tabs-nav="next"]')).not.toBeNull();

    expect(buttons.map((b) => b.textContent)).toEqual(["first", "second", "third"]);

    expect(panels.map((p) => p.textContent)).toEqual(["content of first", "content of second", "content of third"]);
  });

  it("activates first tab by default", () => {
    const { container } = render(three());

    const { activeButtons, activePanels } = state(container);

    expect(activeButtons).toEqual([true, false, false]);

    expect(activePanels).toEqual([true, false, false]);
  });

  it("connects buttons and panels with aria attributes", () => {
    const { container } = render(three({ defaultIndex: 1 }));

    const { buttons, panels } = state(container);

    expect(buttons.map((b) => b.getAttribute("aria-selected"))).toEqual(["false", "true", "false"]);

    buttons.forEach((button, i) => {
      expect(button.getAttribute("role")).toBe("tab");

      expect(panels[i].getAttribute("role")).toBe("tabpanel");

      expect(button.getAttribute("aria-controls")).toBe(panels[i].id);

      expect(panels[i].getAttribute("aria-labelledby")).toBe(button.id);
    });
  });

  it("passes props to the root element and forwards ref", () => {
    const ref = createRef<HTMLDivElement>();

    const { container } = render(three({ ref, className: "custom", id: "my-tabs", "data-test": "x" } as never));

    const { root } = state(container);

    expect(ref.current).toBe(root);

    expect(root.className).toBe("custom");

    expect(root.id).toBe("my-tabs");

    expect(root.getAttribute("data-test")).toBe("x");
  });

  it("passes props of <Tab> to the panel and keeps its className next to 'active'", () => {
    const { container } = render(
      <Tabs>
        <Tab label="first" className="panel-one" data-test="one">
          1
        </Tab>
        <Tab label="second" className="panel-two">
          2
        </Tab>
      </Tabs>,
    );

    const { panels } = state(container);

    expect(panels[0].className).toBe("panel-one active");

    expect(panels[0].getAttribute("data-test")).toBe("one");

    expect(panels[1].className).toBe("panel-two");
  });

  it("accepts any node as a label", () => {
    const { container } = render(
      <Tabs>
        <Tab label={<b data-test="bold">first</b>}>1</Tab>
        <Tab label="second">2</Tab>
      </Tabs>,
    );

    // click on the element nested in the button works (vanilla version doesn't recognise it)
    fireEvent.click(container.querySelector('[data-test="bold"]')!);

    expect(state(container).activeButtons).toEqual([true, false]);

    fireEvent.click(state(container).buttons[1]);

    fireEvent.click(container.querySelector('[data-test="bold"]')!);

    expect(state(container).activeButtons).toEqual([true, false]);
  });

  it("ignores children which are not elements and renders no tabs without crashing", () => {
    const { container } = render(
      <Tabs>
        {null}
        {false}
        text
      </Tabs>,
    );

    const { buttons, panels } = state(container);

    expect(buttons).toHaveLength(0);

    expect(panels).toHaveLength(0);
  });

  it("sets colors as css variables and keeps other styles", () => {
    const { container } = render(three({ backgroundColor: "white", linesColor: "navy", style: { margin: "5px" } }));

    const { root } = state(container);

    expect(root.style.getPropertyValue("--vanilla-tabs-background-color")).toBe("white");

    expect(root.style.getPropertyValue("--vanilla-tabs-lines-color")).toBe("navy");

    expect(root.style.margin).toBe("5px");
  });

  it("doesn't set css variables when colors are not given", () => {
    const { container } = render(three());

    expect(state(container).root.getAttribute("style")).toBeNull();
  });
});

describe("uncontrolled mode", () => {
  it("respects defaultIndex", () => {
    const { container } = render(three({ defaultIndex: 2 }));

    expect(state(container).activeButtons).toEqual([false, false, true]);

    expect(state(container).activePanels).toEqual([false, false, true]);
  });

  it("switches tab on click and calls onChange with the index", () => {
    const onChange = vi.fn();

    const { container } = render(three({ onChange }));

    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(state(container).buttons[1]);

    expect(state(container).activeButtons).toEqual([false, true, false]);

    expect(state(container).activePanels).toEqual([false, true, false]);

    expect(onChange).toHaveBeenCalledTimes(1);

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("doesn't call onChange when already active tab is clicked", () => {
    const onChange = vi.fn();

    const { container } = render(three({ onChange }));

    fireEvent.click(state(container).buttons[0]);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("switches tab with Enter and Space, ignores other keys", () => {
    const { container } = render(three());

    fireEvent.keyDown(state(container).buttons[1], { key: "Enter" });

    expect(state(container).activeButtons).toEqual([false, true, false]);

    fireEvent.keyDown(state(container).buttons[2], { key: " " });

    expect(state(container).activeButtons).toEqual([false, false, true]);

    fireEvent.keyDown(state(container).buttons[0], { key: "a" });

    expect(state(container).activeButtons).toEqual([false, false, true]);
  });

  it("falls to the last tab when active one is removed", () => {
    function Dynamic() {
      const [count, setCount] = useState(3);

      return (
        <>
          <button data-test="remove" onClick={() => setCount(count - 1)} />
          <Tabs defaultIndex={2}>
            {Array.from({ length: count }, (_, i) => (
              <Tab key={i} label={`button ${i}`}>
                {`content ${i}`}
              </Tab>
            ))}
          </Tabs>
        </>
      );
    }

    const { container } = render(<Dynamic />);

    expect(state(container).activeButtons).toEqual([false, false, true]);

    fireEvent.click(container.querySelector('[data-test="remove"]')!);

    expect(state(container).activeButtons).toEqual([false, true]);

    expect(state(container).activePanels).toEqual([false, true]);
  });

  it("keeps state of components in inactive tabs", () => {
    function Counter() {
      const [count, setCount] = useState(0);

      return (
        <button data-test="counter" onClick={() => setCount(count + 1)}>
          {count}
        </button>
      );
    }

    const { container } = render(
      <Tabs>
        <Tab label="first">
          <Counter />
        </Tab>
        <Tab label="second">2</Tab>
      </Tabs>,
    );

    const counter = () => container.querySelector('[data-test="counter"]')!;

    fireEvent.click(counter());

    fireEvent.click(counter());

    fireEvent.click(state(container).buttons[1]);

    fireEvent.click(state(container).buttons[0]);

    expect(counter().textContent).toBe("2");
  });

  it("keeps nested tabs independent", () => {
    const outer = vi.fn();

    const inner = vi.fn();

    const { container } = render(
      <Tabs onChange={outer} data-test="outer">
        <Tab label="outer first">
          <Tabs onChange={inner} data-test="inner">
            <Tab label="inner first">a</Tab>
            <Tab label="inner second">b</Tab>
          </Tabs>
        </Tab>
        <Tab label="outer second">2</Tab>
      </Tabs>,
    );

    const innerRoot = container.querySelector<HTMLElement>('[data-test="inner"]')!;

    fireEvent.click(innerRoot.querySelectorAll(":scope > [data-buttons] > *")[1]);

    expect(inner).toHaveBeenCalledWith(1);

    expect(outer).not.toHaveBeenCalled();

    // state() reads the first (outer) [data-vanilla-tabs]
    expect(state(container).activeButtons).toEqual([true, false]);

    expect(
      Array.from(innerRoot.querySelectorAll(":scope > [data-tabs] > div")).map((p) => p.classList.contains("active")),
    ).toEqual([false, true]);
  });
});

describe("controlled mode", () => {
  it("doesn't switch on its own, only calls onChange", () => {
    const onChange = vi.fn();

    const { container } = render(three({ index: 0, onChange }));

    fireEvent.click(state(container).buttons[2]);

    expect(onChange).toHaveBeenCalledWith(2);

    expect(state(container).activeButtons).toEqual([true, false, false]);
  });

  it("follows index prop", () => {
    const { container, rerender } = render(three({ index: 0 }));

    rerender(three({ index: 2 }));

    expect(state(container).activeButtons).toEqual([false, false, true]);

    expect(state(container).activePanels).toEqual([false, false, true]);
  });

  it("works as usual when parent keeps the state", () => {
    function Parent() {
      const [index, setIndex] = useState(1);

      return three({ index, onChange: setIndex });
    }

    const { container } = render(<Parent />);

    expect(state(container).activeButtons).toEqual([false, true, false]);

    fireEvent.click(state(container).buttons[0]);

    expect(state(container).activeButtons).toEqual([true, false, false]);
  });

  it("clamps index out of range", () => {
    const { container, rerender } = render(three({ index: 10 }));

    expect(state(container).activeButtons).toEqual([false, false, true]);

    rerender(three({ index: -5 }));

    expect(state(container).activeButtons).toEqual([true, false, false]);
  });
});

describe("overflow arrows", () => {
  /**
   * Fakes the layout: [data-buttons] has content 600px wide in the box of given width,
   * the root element is "root" px wide
   */
  function layout({ root, buttons, scrollLeft = 0 }: { root: number; buttons: number; scrollLeft?: number }) {
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(function (this: HTMLElement) {
      return this.hasAttribute("data-buttons") ? 600 : 0;
    });

    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
      if (this.hasAttribute("data-buttons")) {
        return buttons;
      }

      return this.hasAttribute("data-vanilla-tabs") ? root : 0;
    });

    vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockImplementation(function (this: HTMLElement) {
      return this.hasAttribute("data-buttons") ? scrollLeft : 0;
    });
  }

  function arrows(container: HTMLElement) {
    return {
      prev: container.querySelector<HTMLButtonElement>('[data-vanilla-tabs-nav="prev"]')!,
      next: container.querySelector<HTMLButtonElement>('[data-vanilla-tabs-nav="next"]')!,
    };
  }

  it("are not announced when buttons fit (jsdom: all widths are 0)", () => {
    const { container } = render(three());

    const { root } = state(container);

    const { prev, next } = arrows(container);

    expect(root.hasAttribute("data-overflow")).toBe(false);

    expect(prev.disabled).toBe(true);

    expect(next.disabled).toBe(true);
  });

  it("show up when buttons don't fit, only 'next' is enabled at the beginning", () => {
    layout({ root: 300, buttons: 224 });

    const { container } = render(three());

    const { prev, next } = arrows(container);

    expect(state(container).root.hasAttribute("data-overflow")).toBe(true);

    expect(prev.disabled).toBe(true);

    expect(next.disabled).toBe(false);
  });

  it("only 'prev' is enabled at the end", () => {
    layout({ root: 300, buttons: 224, scrollLeft: 376 });

    const { container } = render(three());

    const { prev, next } = arrows(container);

    expect(prev.disabled).toBe(false);

    expect(next.disabled).toBe(true);
  });

  it("are updated when the row of buttons is scrolled", () => {
    layout({ root: 300, buttons: 224 });

    const { container } = render(three());

    const { prev, next } = arrows(container);

    expect(prev.disabled).toBe(true);

    vi.restoreAllMocks();

    layout({ root: 300, buttons: 224, scrollLeft: 100 });

    fireEvent.scroll(container.querySelector("[data-buttons]")!);

    expect(prev.disabled).toBe(false);

    expect(next.disabled).toBe(false);
  });

  it("scroll the row of buttons by 70% of its width and don't switch tabs", () => {
    layout({ root: 300, buttons: 200, scrollLeft: 100 });

    const onChange = vi.fn();

    const { container } = render(three({ onChange }));

    const scrollBy = vi.fn();

    (container.querySelector("[data-buttons]") as HTMLElement).scrollBy = scrollBy;

    const { prev, next } = arrows(container);

    fireEvent.click(next);

    expect(scrollBy).toHaveBeenLastCalledWith({ left: 140, behavior: "smooth" });

    fireEvent.click(prev);

    expect(scrollBy).toHaveBeenLastCalledWith({ left: -140, behavior: "smooth" });

    expect(onChange).not.toHaveBeenCalled();

    expect(state(container).activeButtons).toEqual([true, false, false]);
  });
});

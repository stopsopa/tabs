import { useRef, useState } from "react";
import { Tabs, Tab, type TabsShowDetail } from "../../../skills/vanilla-tabs/Tabs.tsx";

/**
 * onShow: run javascript every time a tab becomes visible - the initial one too, and no matter
 * whether the user clicked or the "index" prop changed. The panel is already displayed, so it can be measured.
 *
 *   <Tabs onShow>  - every tab
 *   <Tab onShow>   - that one tab
 */
export default function OnShow() {
  const [log, setLog] = useState<string[]>([]);

  const canvas = useRef<HTMLCanvasElement>(null);

  const input = useRef<HTMLInputElement>(null);

  function all({ index, button, tab }: TabsShowDetail) {
    setLog((list) => [...list, `<Tabs onShow> index: ${index}, button: "${button.textContent}", ${tab.offsetWidth}px`]);
  }

  // imperative code which needs visible element: a hidden canvas has no size
  function draw({ tab }: TabsShowDetail) {
    const element = canvas.current;

    const ctx = element?.getContext("2d");

    if (!element || !ctx) {
      return;
    }

    element.width = tab.clientWidth - 20;

    for (let x = 0; x < element.width; x += 12) {
      const height = 10 + Math.random() * 70;

      ctx.fillStyle = `hsl(${Math.round(Math.random() * 360)} 60% 50%)`;

      ctx.fillRect(x, element.height - height, 10, height);
    }
  }

  return (
    <>
      <Tabs onShow={all}>
        <Tab label="first">click other tabs and watch the log below</Tab>
        <Tab label="chart (redrawn every time)" onShow={draw}>
          <canvas ref={canvas} height={90} style={{ display: "block" }} />
        </Tab>
        <Tab label="focus the input" onShow={() => input.current?.focus()}>
          <input ref={input} placeholder="focused when the tab opens" size={30} />
        </Tab>
      </Tabs>
      <pre style={{ maxHeight: 110, overflow: "auto" }}>{log.join("\n")}</pre>
    </>
  );
}

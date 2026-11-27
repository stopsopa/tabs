import { useState } from "react";
import { Tabs, Tab } from "../../../skills/vanilla-tabs/Tabs.tsx";

/**
 * Tabs from a list (give every <Tab> a stable key), added and removed at runtime.
 * When buttons don't fit, prev/next arrows show up. Colors via props, tabs nested in a tab.
 */
export default function Dynamic() {
  const [ids, setIds] = useState([1, 2, 3]);

  const [next, setNext] = useState(4);

  const [index, setIndex] = useState(0);

  function add() {
    setIds([...ids, next]);

    setIndex(ids.length);

    setNext(next + 1);
  }

  return (
    <>
      <p>
        <button onClick={add}>add tab</button>{" "}
        <button
          onClick={() => {
            setIds([...ids, ...Array.from({ length: 10 }, (_, i) => next + i)]);

            setNext(next + 10);
          }}
        >
          add 10 tabs
        </button>
      </p>
      <Tabs index={index} onChange={setIndex} backgroundColor="white" linesColor="navy">
        {ids.map((id) => (
          <Tab key={id} label={`tab number ${id}`}>
            <p>
              content {id} <button onClick={() => setIds(ids.filter((i) => i !== id))}>remove this tab</button>
            </p>
            <Tabs backgroundColor="#d9f2d9">
              <Tab label="nested">nested tabs of tab {id} keep their own state</Tab>
              <Tab label="second">second</Tab>
            </Tabs>
          </Tab>
        ))}
      </Tabs>
    </>
  );
}

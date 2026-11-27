import { useState } from "react";
import { Tabs, Tab } from "../../../skills/vanilla-tabs/Tabs.tsx";

const names = ["first", "second", "third", "fourth"];

/**
 * Controlled: active tab lives in your state (or url, store...).
 * The tab changes only when the "index" prop changes, so onChange can also refuse the change.
 */
export default function Controlled() {
  const [index, setIndex] = useState(0);

  const [locked, setLocked] = useState(false);

  return (
    <>
      <p>
        <button onClick={() => setIndex((index + names.length - 1) % names.length)}>‹ previous</button>{" "}
        <button onClick={() => setIndex((index + 1) % names.length)}>next ›</button>{" "}
        <select value={index} onChange={(e) => setIndex(Number(e.target.value))}>
          {names.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>{" "}
        <label>
          <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} /> ignore clicks on tabs
        </label>
      </p>
      <Tabs
        index={index}
        onChange={(next) => {
          if (!locked) {
            setIndex(next);
          }
        }}
      >
        {names.map((name) => (
          <Tab key={name} label={name}>
            content of {name}
          </Tab>
        ))}
      </Tabs>
      <p>
        state: index = {index} ({names[index]})
      </p>
    </>
  );
}

import { useState } from "react";
import { Tabs, Tab } from "../../../skills/vanilla-tabs/Tabs.tsx";

/**
 * Uncontrolled: the component keeps the active tab on its own.
 * defaultIndex picks the initial tab, onChange tells when the user picked another one.
 */
export default function Basic() {
  const [last, setLast] = useState<number | null>(null);

  return (
    <>
      <Tabs defaultIndex={1} onChange={(index) => setLast(index)}>
        <Tab label="first">content of first</Tab>
        <Tab label="second">content of second (defaultIndex={"{1}"})</Tab>
        <Tab label={<b>third</b>}>label can be any node</Tab>
      </Tabs>
      <p>onChange: {last === null ? "not called yet (it is not called for the initial tab)" : `index ${last}`}</p>
    </>
  );
}

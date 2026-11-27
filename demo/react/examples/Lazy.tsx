import { useEffect, useState } from "react";
import { Tabs, Tab } from "../../../skills/vanilla-tabs/Tabs.tsx";

/**
 * <Tab lazy>: children are not rendered (so their effects don't run) until the tab is opened
 * for the first time. After that they stay mounted like in any other tab.
 *
 * <Tab unmountOnHide>: children are rendered only while the tab is visible.
 */
export default function Lazy() {
  return (
    <Tabs>
      <Tab label="first">nothing was loaded for the other tabs yet</Tab>
      <Tab label="lazy" lazy>
        <Loader name="lazy" />
      </Tab>
      <Tab label="not lazy">
        <Loader name="not lazy" />
      </Tab>
      <Tab label="unmountOnHide" unmountOnHide>
        <Loader name="unmountOnHide" /> (loaded again on every visit)
      </Tab>
    </Tabs>
  );
}

function Loader({ name }: { name: string }) {
  const [data, setData] = useState<string | null>(null);

  // pretends to fetch something
  useEffect(() => {
    const started = new Date().toLocaleTimeString();

    const handler = setTimeout(() => setData(`"${name}" started loading at ${started}`), 600);

    return () => clearTimeout(handler);
  }, [name]);

  return <>{data ?? "loading..."}</>;
}

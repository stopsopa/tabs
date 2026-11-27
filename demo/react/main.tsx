/**
 * Demo of the React component skills/vanilla-tabs/Tabs.tsx: demo/react/index.html
 *
 * Bundled (together with react) by transpile.sh to demo/react/main.js, which is generated and not stored in git.
 * Every example is one file in demo/react/examples/ - the page shows its result and (fetched at runtime) its source.
 */
import { useEffect, useState, type ComponentType, type HTMLAttributes } from "react";
import { createRoot } from "react-dom/client";

import { Tabs, Tab } from "../../skills/vanilla-tabs/Tabs.tsx";

import Basic from "./examples/Basic.tsx";
import Controlled from "./examples/Controlled.tsx";
import OnShow from "./examples/OnShow.tsx";
import Lazy from "./examples/Lazy.tsx";
import Dynamic from "./examples/Dynamic.tsx";

// https://github.com/stopsopa/ace-editor-webcomponent - loaded by index.html
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ace-editor": HTMLAttributes<HTMLElement> & { lang?: string; value?: string; readonly?: boolean };
    }
  }
}

const examples: { file: string; title: string; Component: ComponentType }[] = [
  { file: "Basic.tsx", title: "Basic (uncontrolled) + onChange", Component: Basic },
  { file: "Controlled.tsx", title: "Controlled - active tab in your state", Component: Controlled },
  { file: "OnShow.tsx", title: "onShow - run javascript when a tab becomes visible", Component: OnShow },
  { file: "Lazy.tsx", title: "lazy, unmountOnHide - render content only when it is needed", Component: Lazy },
  { file: "Dynamic.tsx", title: "Dynamic list, overflow arrows, colors, nested tabs", Component: Dynamic },
];

function Source({ file }: { file: string }) {
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    fetch(`./examples/${file}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }

        return response.text();
      })
      // in the examples the component is imported from this repository, in a project it is a copied file
      .then((text) => setSource(text.replace("../../../skills/vanilla-tabs/Tabs.tsx", "./Tabs")))
      .catch((e) => setSource(`// can't load ./examples/${file}: ${e}`));
  }, [file]);

  if (source === null) {
    return <>loading...</>;
  }

  return <ace-editor lang="tsx" readonly value={source} />;
}

function App() {
  return (
    <>
      {examples.map(({ file, title, Component }) => (
        <section key={file} className="spacer">
          <h3>{title}</h3>
          <Tabs backgroundColor="#fdf6ec">
            <Tab label="result">
              <Component />
            </Tab>
            <Tab label={`source (${file})`} lazy>
              <Source file={file} />
            </Tab>
          </Tabs>
        </section>
      ))}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

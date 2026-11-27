// @vitest-environment node

/**
 * Proves that the package can be imported and rendered without DOM (SSR: Next.js, Remix, Astro...).
 * The comment in the first line switches this file from jsdom to plain node: no window, no document.
 *
 *   npm test          (or: xx test)
 */
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Tab, Tabs } from "../skills/vanilla-tabs/Tabs.tsx";
import vanillaTabs from "../skills/vanilla-tabs/vanilla-tabs.ts";

describe("without DOM", () => {
  it("there is really no DOM in this file", () => {
    expect(typeof window).toBe("undefined");

    expect(typeof document).toBe("undefined");
  });

  it("vanilla module can be imported (methods need DOM, importing doesn't)", () => {
    expect(typeof vanillaTabs.autoenable).toBe("function");
  });

  it("<Tabs> renders to string with active tab marked", () => {
    const html = renderToString(
      <Tabs defaultIndex={1} linesColor="navy">
        <Tab label="first">content of first</Tab>
        <Tab label="second">content of second</Tab>
      </Tabs>,
    );

    expect(html).toContain("data-vanilla-tabs");

    expect(html).toContain("--vanilla-tabs-lines-color:navy");

    expect(html).toMatch(/<span[^>]*class="active"[^>]*>second<\/span>/);

    expect(html).toMatch(/<div[^>]*class="active"[^>]*>content of second<\/div>/);

    expect(html).not.toMatch(/<span[^>]*class="active"[^>]*>first<\/span>/);
  });
});

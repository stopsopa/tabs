/**
 * Smoke test of the examples shown on demo/react/index.html: every one renders and survives clicking its tabs.
 *
 *   npm test          (or: xx test)
 */
import { StrictMode, type ComponentType } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";

import Basic from "../demo/react/examples/Basic.tsx";
import Controlled from "../demo/react/examples/Controlled.tsx";
import OnShow from "../demo/react/examples/OnShow.tsx";
import Lazy from "../demo/react/examples/Lazy.tsx";
import Dynamic from "../demo/react/examples/Dynamic.tsx";

afterEach(cleanup);

const examples: Record<string, ComponentType> = { Basic, Controlled, OnShow, Lazy, Dynamic };

describe("demo/react/examples", () => {
  Object.entries(examples).forEach(([name, Component]) => {
    it(name, () => {
      const { container } = render(
        <StrictMode>
          <Component />
        </StrictMode>,
      );

      const buttons = () => Array.from(container.querySelectorAll<HTMLElement>("[data-buttons] > *"));

      expect(buttons().length).toBeGreaterThan(1);

      buttons().forEach((_, i) => fireEvent.click(buttons()[i]));

      Array.from(container.querySelectorAll("button:not([data-vanilla-tabs-nav])")).forEach((button) => {
        if (button.isConnected) {
          fireEvent.click(button);
        }
      });

      expect(container.querySelectorAll("[data-vanilla-tabs] > [data-buttons] > .active").length).toBeGreaterThan(0);
    });
  });
});

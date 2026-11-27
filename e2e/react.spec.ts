/**
 * Browser tests of the React component on its demo page (demo/react/index.html): every example is used the way
 * a user would use it - mouse, keyboard and the controls which drive the component through its props.
 *
 *   npm run e2e       (or: xx e2e)
 */
import { expect, test, type Locator, type Page } from "@playwright/test";

import { expectActive, parts, watchErrors } from "./helpers.ts";

let errors: string[];

test.beforeEach(async ({ page }) => {
  errors = watchErrors(page);

  await page.goto("/demo/react/index.html");

  await expect(page.locator("#root section")).toHaveCount(5);
});

test.afterEach(() => {
  expect(errors).toEqual([]);
});

/**
 * Section of one example: "wrapper" are the tabs result/source of the page, "result" is the panel with the example
 */
function example(page: Page, title: string) {
  const section = page.locator("#root section").filter({ has: page.getByRole("heading", { name: title }) });

  const wrapper = section.locator(":scope > [data-vanilla-tabs]");

  const result = parts(wrapper).panels.nth(0);

  return { section, wrapper, result, tabs: result.locator(":scope > [data-vanilla-tabs]") };
}

test.describe("Basic", () => {
  test("defaultIndex, click, onChange", async ({ page }) => {
    const { result, tabs } = example(page, "Basic");

    await expectActive(tabs, 1);

    await expect(result).toContainText("onChange: not called yet");

    await parts(tabs).buttons.nth(2).click();

    await expectActive(tabs, 2);

    await expect(parts(tabs).panels.nth(2)).toHaveText("label can be any node");

    await expect(result).toContainText("onChange: index 2");
  });

  test("keyboard: arrows with wrapping, Home, End, focus follows and is visible", async ({ page }) => {
    const { result, tabs } = example(page, "Basic");

    const { buttons } = parts(tabs);

    await buttons.nth(1).focus();

    const steps: [string, number][] = [
      ["ArrowRight", 2],
      ["ArrowRight", 0],
      ["ArrowLeft", 2],
      ["Home", 0],
      ["End", 2],
    ];

    for (const [key, index] of steps) {
      await page.keyboard.press(key);

      await expectActive(tabs, index);

      await expect(buttons.nth(index)).toBeFocused();
    }

    expect(await buttons.nth(2).evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");

    await expect(result).toContainText("onChange: index 2");
  });

  test("dispatches the same DOM event as the vanilla version", async ({ page }) => {
    const { tabs } = example(page, "Basic");

    await page.evaluate(() => {
      const store = ((window as unknown as { seen: string[] }).seen = [] as string[]);

      document.addEventListener("vanilla-tabs:change", (e) => {
        const { index, previousIndex, button } = (e as CustomEvent).detail;

        store.push(`${previousIndex}>${index}:${button.textContent}`);
      });
    });

    await parts(tabs).buttons.nth(0).click();

    expect(await page.evaluate(() => (window as unknown as { seen: string[] }).seen)).toEqual(["1>0:first"]);
  });
});

test.describe("Controlled", () => {
  test("follows the state changed outside, clicks go through onChange", async ({ page }) => {
    const { result, tabs } = example(page, "Controlled - active tab");

    await expectActive(tabs, 0);

    await result.getByRole("button", { name: "next ›" }).click();

    await expectActive(tabs, 1);

    await result.getByRole("button", { name: "‹ previous" }).click();

    await result.getByRole("button", { name: "‹ previous" }).click();

    await expectActive(tabs, 3);

    await result.locator("select").selectOption("2");

    await expectActive(tabs, 2);

    await parts(tabs).buttons.nth(1).click();

    await expectActive(tabs, 1);

    await expect(result).toContainText("state: index = 1 (second)");
  });

  test("the parent can refuse the change: clicks and keys do nothing, the state still works", async ({ page }) => {
    const { result, tabs } = example(page, "Controlled - active tab");

    await result.getByRole("checkbox").check();

    await parts(tabs).buttons.nth(2).click();

    await expectActive(tabs, 0);

    await parts(tabs).buttons.nth(0).focus();

    await page.keyboard.press("ArrowRight");

    await expectActive(tabs, 0);

    await result.getByRole("button", { name: "next ›" }).click();

    await expectActive(tabs, 1);
  });
});

test.describe("onShow", () => {
  test("is called for the initial tab and for every change with measurable panel", async ({ page }) => {
    const { result, tabs } = example(page, "onShow");

    const log = result.locator("pre");

    await expect(log).toHaveText(/^<Tabs onShow> index: 0, button: "first", [1-9]\d*px$/);

    await parts(tabs).buttons.nth(1).click();

    const canvas = result.locator("canvas");

    await expect(canvas).toBeVisible();

    // drawn by <Tab onShow> with the width of visible panel
    expect(await canvas.evaluate((el: HTMLCanvasElement) => el.width)).toBeGreaterThan(100);

    const painted = await canvas.evaluate((el: HTMLCanvasElement) => {
      const { data } = el.getContext("2d")!.getImageData(0, 0, el.width, el.height);

      return data.some((value) => value !== 0);
    });

    expect(painted).toBe(true);

    await parts(tabs).buttons.nth(2).click();

    await expect(result.locator("input")).toBeFocused();

    await expect(log).toContainText('index: 2, button: "focus the input"');

    expect((await log.textContent())!.split("\n")).toHaveLength(3);
  });
});

test.describe("lazy", () => {
  test("lazy tab is rendered on the first visit, the other one from the beginning", async ({ page }) => {
    const { tabs } = example(page, "lazy");

    const { buttons, panels } = parts(tabs);

    await expect(panels.nth(1)).toBeEmpty();

    // not lazy: mounted (and "loaded") although it was never visible
    await expect(panels.nth(2)).toHaveText(/"not lazy" started loading at/);

    await buttons.nth(1).click();

    await expect(panels.nth(1)).toHaveText("loading...");

    await expect(panels.nth(1)).toHaveText(/"lazy" started loading at/);

    const text = await panels.nth(1).textContent();

    await buttons.nth(0).click();

    await buttons.nth(1).click();

    // stays mounted: not loaded again
    await expect(panels.nth(1)).toHaveText(text!);
  });

  test("unmountOnHide tab is rendered only while it is visible", async ({ page }) => {
    const { tabs } = example(page, "lazy");

    const { buttons, panels } = parts(tabs);

    await expect(panels.nth(3)).toBeEmpty();

    await buttons.nth(3).click();

    await expect(panels.nth(3)).toContainText("loading...");

    await expect(panels.nth(3)).toContainText('"unmountOnHide" started loading at');

    await buttons.nth(0).click();

    await expect(panels.nth(3)).toBeEmpty();

    // mounted from scratch
    await buttons.nth(3).click();

    await expect(panels.nth(3)).toContainText("loading...");
  });
});

test.describe("Dynamic", () => {
  async function overflowing(tabs: Locator): Promise<boolean> {
    return tabs.evaluate((el) => el.hasAttribute("data-overflow"));
  }

  test("add and remove tabs, nested tabs keep their own state", async ({ page }) => {
    const { result, tabs } = example(page, "Dynamic");

    const { buttons, panels } = parts(tabs);

    await expect(buttons).toHaveCount(3);

    await result.getByRole("button", { name: "add tab", exact: true }).click();

    await expect(buttons).toHaveCount(4);

    await expectActive(tabs, 3);

    const nested = panels.nth(3).locator("[data-vanilla-tabs]");

    await parts(nested).buttons.nth(1).click();

    await expectActive(nested, 1);

    await expectActive(tabs, 3);

    await buttons.nth(0).click();

    await buttons.nth(3).click();

    await expectActive(nested, 1);

    await panels.nth(3).getByRole("button", { name: "remove this tab" }).click();

    await expect(buttons).toHaveCount(3);

    await expectActive(tabs, 2);

    await expect(buttons).toHaveText(["tab number 1", "tab number 2", "tab number 3"]);
  });

  test("overflow arrows appear when tabs don't fit and scroll the row", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 700 });

    const { result, tabs } = example(page, "Dynamic");

    const { buttons, prev, next } = parts(tabs);

    expect(await overflowing(tabs)).toBe(false);

    await expect(next).toBeHidden();

    await result.getByRole("button", { name: "add 10 tabs" }).click();

    await expect(buttons).toHaveCount(13);

    await expect.poll(() => overflowing(tabs)).toBe(true);

    await expect(prev).toBeDisabled();

    await expect(next).toBeEnabled();

    await next.click();

    await expect(prev).toBeEnabled();

    await expectActive(tabs, 0);

    // new tab is opened by the state: the row scrolls to it
    await result.getByRole("button", { name: "add tab", exact: true }).click();

    await expectActive(tabs, 13);

    await expect(buttons.nth(13)).toBeInViewport({ ratio: 0.98 });

    // colors from props
    expect(
      await parts(tabs)
        .panels.nth(13)
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(255, 255, 255)");
  });
});

test.describe("page", () => {
  test("source of every example is shown in its second tab, loaded on the first visit", async ({ page }) => {
    const { wrapper } = example(page, "Basic");

    await expectActive(wrapper, 0);

    await expect(parts(wrapper).panels.nth(1)).toBeEmpty();

    await parts(wrapper).buttons.nth(1).click();

    await expectActive(wrapper, 1);

    const editor = parts(wrapper).panels.nth(1).locator("ace-editor");

    await expect(editor).toHaveCount(1);

    const source = await editor.evaluate((el) => (el as HTMLInputElement).value ?? el.getAttribute("value"));

    expect(source).toContain('import { Tabs, Tab } from "./Tabs";');

    expect(source).toContain("export default function Basic()");
  });

  test("link to the vanilla demo and back", async ({ page }) => {
    await page.getByRole("link", { name: "vanilla version" }).click();

    await expect(page).toHaveURL(/\/index\.html$/);

    await page.getByRole("link", { name: /React component/ }).click();

    await expect(page).toHaveURL(/\/demo\/react\/index\.html$/);
  });
});

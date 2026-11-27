/**
 * Browser tests of the vanilla library on the real demo page (index.html) and on pages from e2e/fixtures/:
 * interaction through the UI (mouse, keyboard) and through the api (window.vanillaTabs).
 *
 *   npm run e2e       (or: xx e2e)
 */
import { expect, test, type Page } from "@playwright/test";

import { expectActive, parts, watchErrors } from "./helpers.ts";

let errors: string[];

test.beforeEach(({ page }) => {
  errors = watchErrors(page);
});

test.afterEach(() => {
  expect(errors).toEqual([]);
});

async function open(page: Page, url = "/index.html") {
  await page.goto(url);

  await page.waitForFunction(() => typeof window.vanillaTabs?.autoenableUnbind === "function");
}

test.describe("index.html - mouse", () => {
  test("initial tabs: first one, or the one with class active", async ({ page }) => {
    await open(page);

    const main = page.locator("body > [data-vanilla-tabs]").first();

    await expectActive(main, 0);

    await parts(main).buttons.nth(3).click();

    await expectActive(main, 3);

    // nested tabs with <span class="active">javascript</span>
    await expectActive(parts(main).panels.nth(3).locator("[data-vanilla-tabs]"), 1);
  });

  test("click switches tabs, nested tabs don't switch the outer ones", async ({ page }) => {
    await open(page);

    const main = page.locator("body > [data-vanilla-tabs]").first();

    await parts(main).buttons.nth(3).click();

    const nested = parts(main).panels.nth(3).locator("[data-vanilla-tabs]");

    await parts(nested).buttons.nth(2).click();

    await expectActive(nested, 2);

    await expectActive(main, 3);

    await expect(parts(nested).panels.nth(2)).toContainText("my stuff for tab 3");
  });

  test("click on an element nested in a button, and on a <button> used as a tab", async ({ page }) => {
    await open(page);

    const root = page.locator("#guard-demo");

    await parts(root).buttons.nth(2).locator("b").click();

    await expectActive(root, 2);
  });

  test("events: every time, only once, previousIndex", async ({ page }) => {
    await open(page);

    const root = page.locator("#events-demo");

    const log = page.locator("#events-log");

    // the listener was registered before the library was loaded: initial tab is reported
    await expect(log).toHaveText(/^vanilla-tabs:change index: 0, previousIndex: -1, button: "first"\s*$/);

    await parts(root).buttons.nth(1).click();

    await parts(root).buttons.nth(2).click();

    const lazy = await page.locator("#lazy").textContent();

    expect(lazy).toContain("loaded only once at");

    await parts(root).buttons.nth(1).click();

    await parts(root).buttons.nth(1).click(); // already active: no event

    await parts(root).buttons.nth(2).click();

    await expect(page.locator("#stats b")).toHaveText("2");

    await expect(page.locator("#lazy")).toHaveText(lazy!);

    expect((await log.textContent())!.trim().split("\n")).toHaveLength(5);

    await expect(log).toContainText('index: 2, previousIndex: 1, button: "lazy (only once)"');
  });

  test("tabs created later work without any call, tabs added to existing ones too", async ({ page }) => {
    await open(page);

    await page.locator("body > button.create").click();

    const created = page.locator("body > .spacer > [data-vanilla-tabs]").last();

    await expectActive(created, 1);

    await parts(created).buttons.nth(2).click();

    await expectActive(created, 2);

    await created.locator(".add_tab").click();

    await expect(parts(created).buttons).toHaveCount(4);

    await expect(parts(created).buttons.nth(3)).toHaveAttribute("role", "tab");

    await parts(created).buttons.nth(3).click();

    await expectActive(created, 3);

    await expect(parts(created).panels.nth(3)).toHaveText("content 1");
  });
});

test.describe("index.html - keyboard", () => {
  test("arrows, Home, End, Enter, Space; focus follows", async ({ page }) => {
    await open(page);

    const root = page.locator("#guard-demo");

    const { buttons } = parts(root);

    await buttons.nth(0).focus();

    const steps: [string, number][] = [
      ["ArrowRight", 1],
      ["ArrowRight", 2],
      ["ArrowRight", 0],
      ["ArrowLeft", 2],
      ["Home", 0],
      ["End", 2],
    ];

    for (const [key, index] of steps) {
      await page.keyboard.press(key);

      await expectActive(root, index);

      await expect(buttons.nth(index)).toBeFocused();
    }

    await page.evaluate(() => (document.querySelector("#guard-demo > [data-buttons] > *") as HTMLElement).focus());

    await page.keyboard.press("Enter");

    await expectActive(root, 0);

    await buttons.nth(1).focus();

    await page.keyboard.press("Space");

    await expectActive(root, 1);
  });

  test("Tab key enters the row on active button only and leaves it with the next press", async ({ page }) => {
    await open(page);

    const root = page.locator("#guard-demo");

    await page.locator(".go").last().focus();

    await page.keyboard.press("Tab");

    await expect(parts(root).buttons.nth(0)).toBeFocused();

    await page.keyboard.press("Tab");

    // not another button, not an arrow
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest("#guard-demo")))).toBe(false);
  });

  test("keyboard focus is visible, focus after a mouse click is not", async ({ page }) => {
    await open(page);

    const { buttons } = parts(page.locator("#guard-demo"));

    const outline = (index: number) => buttons.nth(index).evaluate((el) => getComputedStyle(el).outlineStyle);

    await buttons.nth(1).click();

    expect(await outline(1)).toBe("none");

    await page.keyboard.press("ArrowLeft");

    await expect(buttons.nth(0)).toBeFocused();

    expect(await outline(0)).toBe("solid");
  });
});

test.describe("index.html - vanilla-tabs:before-change", () => {
  test("stops changes made by the user (mouse and keyboard), not the ones made from code", async ({ page }) => {
    await open(page);

    const root = page.locator("#guard-demo");

    const { buttons } = parts(root);

    await page.locator("#guard").check();

    await buttons.nth(1).click();

    await expectActive(root, 0);

    await buttons.nth(0).focus();

    await page.keyboard.press("ArrowRight");

    await expectActive(root, 0);

    await expect(buttons.nth(0)).toBeFocused();

    await page.locator('.go[data-index="2"]').click();

    await expectActive(root, 2);

    await page.locator("#guard").uncheck();

    await buttons.nth(1).click();

    await expectActive(root, 1);
  });
});

test.describe("index.html - api (window.vanillaTabs)", () => {
  test("activeByIndex(), activeByButtonElement(), on(), errors", async ({ page }) => {
    await open(page);

    const root = page.locator("#guard-demo");

    const result = await page.evaluate(() => {
      const element = document.querySelector<HTMLElement>("#guard-demo")!;

      const calls: string[] = [];

      const unbind = window.vanillaTabs.on(element, ({ index, previousIndex, tab }) => {
        calls.push(`${previousIndex}>${index}:${getComputedStyle(tab).display}`);
      });

      window.vanillaTabs.activeByIndex(element, 2);

      window.vanillaTabs.activeByIndex(element, 2);

      window.vanillaTabs.activeByButtonElement(element, element.querySelector(":scope > [data-buttons] > *")!);

      unbind();

      window.vanillaTabs.activeByIndex(element, 1);

      const errors: string[] = [];

      [
        () => window.vanillaTabs.activeByIndex(element, 3),
        () => window.vanillaTabs.activeByButtonElement(element, document.body),
      ].forEach((fn) => {
        try {
          fn();
        } catch (e) {
          errors.push(String(e));
        }
      });

      return { calls, errors, id: element.getAttribute("data-vanilla-tab-id") };
    });

    expect(result.calls).toEqual(["0>2:block", "2>0:block"]);

    expect(result.errors).toHaveLength(2);

    expect(result.errors[0]).toContain("zeroIndex 3 is not an integer from 0 to 2");

    expect(result.errors[1]).toContain("target is not a button");

    expect(result.id).toMatch(/^vanilla-tabs-\d+$/);

    // wrong calls changed nothing
    await expectActive(root, 1);
  });

  test("bind() / unbind / bind() again, destroy(), manual mode with active({ root })", async ({ page }) => {
    await open(page);

    const root = page.locator("#guard-demo");

    const { buttons } = parts(root);

    await page.evaluate(() => window.vanillaTabs.destroy());

    await buttons.nth(1).click();

    await expectActive(root, 0);

    // tabs created now are not picked up: nothing watches the page
    await page.evaluate(() => {
      const wrapper = document.createElement("section");

      wrapper.id = "manual";

      wrapper.innerHTML = `
        <div data-vanilla-tabs>
          <div data-buttons><span>a</span><span class="active">b</span></div>
          <div data-tabs><div>A</div><div>B</div></div>
        </div>`;

      document.body.appendChild(wrapper);
    });

    const manual = page.locator("#manual > [data-vanilla-tabs]");

    await expect(parts(manual).panels.nth(1)).toBeHidden();

    const ids = await page.evaluate(() => window.vanillaTabs.active({ root: document.querySelector("#manual")! }));

    expect(ids).toHaveLength(1);

    await expectActive(manual, 1);

    const same = await page.evaluate(() => {
      const unbind = window.vanillaTabs.bind();

      const again = window.vanillaTabs.bind();

      unbind();

      (window as unknown as { rebound: () => void }).rebound = window.vanillaTabs.bind();

      return unbind === again;
    });

    expect(same).toBe(true);

    await parts(manual).buttons.nth(0).click();

    await expectActive(manual, 0);

    await buttons.nth(1).click();

    await expectActive(root, 1);

    await page.evaluate(() => (window as unknown as { rebound: () => void }).rebound());

    await buttons.nth(2).click();

    await expectActive(root, 1);
  });
});

test.describe("index.html - overflow arrows", () => {
  test("show up when buttons don't fit, scroll the row, follow active tab, hide when there is room", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 700 });

    await open(page);

    const root = page.locator("#overflow-demo");

    const { buttons, prev, next } = parts(root);

    const scrollLeft = () => root.locator(":scope > [data-buttons]").evaluate((el) => el.scrollLeft);

    await expect(root).toHaveAttribute("data-overflow", "");

    await expect(prev).toBeVisible();

    await expect(prev).toBeDisabled();

    await expect(next).toBeEnabled();

    // tabs which fit don't have arrows
    await expect(parts(page.locator("#guard-demo")).next).toBeHidden();

    await next.click();

    await expect.poll(scrollLeft).toBeGreaterThan(100);

    await expect(prev).toBeEnabled();

    await expectActive(root, 0);

    await prev.click();

    await expect.poll(scrollLeft).toBe(0);

    await expect(prev).toBeDisabled();

    // from code: the row is scrolled to show active button
    await page.evaluate(() => window.vanillaTabs.activeByIndex(document.querySelector("#overflow-demo")!, 29));

    await expectActive(root, 29);

    await expect(buttons.nth(29)).toBeInViewport({ ratio: 0.98 });

    await expect(next).toBeDisabled();

    // keyboard: the row follows
    await buttons.nth(29).focus();

    await page.keyboard.press("Home");

    await expectActive(root, 0);

    await expect(buttons.nth(0)).toBeInViewport({ ratio: 0.98 });

    await expect.poll(scrollLeft).toBe(0);

    await page.setViewportSize({ width: 4500, height: 700 });

    await expect(root).not.toHaveAttribute("data-overflow", "");

    await expect(next).toBeHidden();
  });

  test("removing buttons hides the arrows (watch mode)", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 700 });

    await open(page);

    const root = page.locator("#overflow-demo");

    await expect(root).toHaveAttribute("data-overflow", "");

    await page.evaluate(() => {
      const element = document.querySelector("#overflow-demo")!;

      [":scope > [data-buttons] > *", ":scope > [data-tabs] > *"].forEach((selector) => {
        Array.from(element.querySelectorAll(selector))
          .slice(3)
          .forEach((el) => el.remove());
      });
    });

    await expect(parts(root).buttons).toHaveCount(3);

    await expect(root).not.toHaveAttribute("data-overflow", "");

    await expectActive(root, 0);
  });
});

test.describe("index.html - colors", () => {
  test("attributes set css variables, also when changed later; panels are transparent by default", async ({ page }) => {
    await open(page);

    const root = page.locator('[data-vanilla-tabs][data-lines-color="navy"]');

    const panel = parts(root).panels.nth(0);

    const css = (property: string) => panel.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);

    expect(await css("background-color")).toBe("rgb(255, 255, 255)");

    expect(await css("border-bottom-color")).toBe("rgb(0, 0, 128)");

    await root.evaluate((el) => el.setAttribute("data-background-color", "rgb(1, 2, 3)"));

    await expect.poll(() => css("background-color")).toBe("rgb(1, 2, 3)");

    const plain = parts(page.locator("#events-demo")).panels.nth(0);

    expect(await plain.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
  });
});

test.describe("ways of loading", () => {
  test("classic script in <head> with ?vanilla-tabs-autoenable", async ({ page }) => {
    await open(page, "/e2e/fixtures/head.html");

    const root = page.locator("#tabs");

    await expectActive(root, 1);

    await parts(root).buttons.nth(2).click();

    await expectActive(root, 2);
  });

  test("classic script in <head> + <body class='vanilla-tabs-autoenable'>", async ({ page }) => {
    await open(page, "/e2e/fixtures/body-class.html");

    const root = page.locator("#tabs");

    await expectActive(root, 0);

    await parts(root).buttons.nth(1).click();

    await expectActive(root, 1);
  });

  test("ES module imported with ?vanilla-tabs-autoenable", async ({ page }) => {
    await open(page, "/e2e/fixtures/esm.html");

    const root = page.locator("#tabs");

    await expectActive(root, 1);

    expect(await page.evaluate(() => (window as unknown as { sameObject: boolean }).sameObject)).toBe(true);

    await parts(root).buttons.nth(0).click();

    await page.keyboard.press("End");

    await expectActive(root, 2);

    // on() was bound after autoenable, so it doesn't see the initial tab
    await expect(page.locator("#log")).toHaveText("1>0 0>2");
  });
});

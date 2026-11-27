import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Fails the test when the page throws or prints console.error (resources from other hosts are not our errors)
 */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("pageerror", (error) => errors.push(String(error)));

  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
      errors.push(message.text());
    }
  });

  return errors;
}

/**
 * Buttons and panels of one [data-vanilla-tabs] element (not of tabs nested in it)
 */
export function parts(root: Locator) {
  return {
    buttons: root.locator(":scope > [data-buttons] > *"),
    panels: root.locator(":scope > [data-tabs] > *"),
    prev: root.locator(':scope > [data-vanilla-tabs-nav="prev"]'),
    next: root.locator(':scope > [data-vanilla-tabs-nav="next"]'),
  };
}

/**
 * Checks everything what says which tab is open: classes, visibility of panels, aria and tabindex
 */
export async function expectActive(root: Locator, index: number): Promise<void> {
  const { buttons, panels } = parts(root);

  const count = await buttons.count();

  await expect(panels).toHaveCount(count);

  await expect(buttons.nth(index)).toHaveClass(/(^|\s)active(\s|$)/);

  for (let i = 0; i < count; i += 1) {
    const active = i === index;

    await expect(buttons.nth(i)).toHaveAttribute("aria-selected", String(active));

    await expect(buttons.nth(i)).toHaveAttribute("tabindex", active ? "0" : "-1");

    if (active) {
      await expect(panels.nth(i)).toBeVisible();
    } else {
      await expect(panels.nth(i)).toBeHidden();

      await expect(buttons.nth(i)).not.toHaveClass(/(^|\s)active(\s|$)/);
    }
  }
}

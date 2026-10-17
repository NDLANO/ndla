/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Selects all text in the focused editor and waits for the given toolbar button.
 * Slate drops a native select-all if the editor re-renders before it has read the new DOM selection
 * (e.g. from the debounced form update right after typing), so the select-all is retried until the toolbar shows.
 */
export const selectAllAndWaitForButton = async (page: Page, toolbarButton: Locator) => {
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+A");
    await expect(toolbarButton).toBeVisible({ timeout: 1_000 });
  }).toPass();
};

/**
 * Drags `source` onto `target` with the mouse.
 * dnd-kit handles pointer moves once per animation frame, so the mouse is released after the last move has been handled.
 */
export const dragAndDrop = async (page: Page, source: Locator, target: Locator) => {
  const from = (await source.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.mouse.up();
};

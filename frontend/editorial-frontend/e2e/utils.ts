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

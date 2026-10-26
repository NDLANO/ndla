/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect, type Page } from "@playwright/test";
import { test } from "../apiMock";

const paragraphs = (page: Page) => page.getByTestId("slate-editor").locator("p").allInnerTexts();

const pickUp = async (page: Page, text: string) => {
  const block = page.locator("[data-drag-wrapper]").filter({ has: page.getByText(text, { exact: true }) });
  const handle = block.locator(":scope > [data-drag-button]");
  await block.hover();
  await expect(handle).toBeVisible();
  await handle.focus();
  await expect(handle).toBeFocused();
  await page.keyboard.press("Space");
};

test.beforeEach(async ({ page }) => {
  await page.goto("/subject-matter/learning-resource/new");
  await page.getByTestId("slate-editor").click();
  await page.keyboard.type("Blokk A");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Blokk B");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Blokk C");
  await expect.poll(() => paragraphs(page)).toEqual(["Blokk A", "Blokk B", "Blokk C"]);
});

test("can move a block down with the keyboard", async ({ page }) => {
  await pickUp(page, "Blokk A");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect.poll(() => paragraphs(page)).toEqual(["Blokk B", "Blokk C", "Blokk A"]);
});

test("can move a block back to where it was with the keyboard", async ({ page }) => {
  await pickUp(page, "Blokk A");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  // Dropping the block where it was changes nothing to wait for, so it is moved down again from there
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect.poll(() => paragraphs(page)).toEqual(["Blokk B", "Blokk A", "Blokk C"]);
});

test("can move a block up with the keyboard", async ({ page }) => {
  await pickUp(page, "Blokk B");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");
  await expect.poll(() => paragraphs(page)).toEqual(["Blokk B", "Blokk A", "Blokk C"]);
});

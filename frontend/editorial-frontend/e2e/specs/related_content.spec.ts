/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect, type Page } from "@playwright/test";
import { test } from "../apiMock";
import { dragAndDrop } from "../utils";

const relatedDialog = (page: Page) => page.getByTestId("editRelated");

const relatedTitles = (page: Page) => relatedDialog(page).getByRole("article").getByRole("link").allInnerTexts();

const dropFinished = (page: Page) => expect(page.locator("[data-dnd-dragging], [data-dnd-placeholder]")).toHaveCount(0);

const dragHandle = (page: Page, title: string) =>
  relatedDialog(page)
    .locator("li")
    .filter({ has: page.getByRole("link", { name: title }) })
    .getByRole("button", { name: "Endre rekkefølge" });

test.beforeEach(async ({ page }) => {
  await page.goto("/subject-matter/learning-resource/new");
  await page.getByTestId("slate-editor").click();
  await page.getByTestId("slate-block-picker").click();
  await page.getByTestId("create-related").click();
  await expect(relatedDialog(page)).toBeVisible();
  await relatedDialog(page).getByRole("tab", { name: "Legg til ekstern artikkel" }).click();
  for (const title of ["Artikkel A", "Artikkel B", "Artikkel C"]) {
    await page.getByTestId("addExternalTitleInput").fill(title);
    await page.getByTestId("addExternalUrlInput").fill(`https://example.com/${title.at(-1)}`);
    await relatedDialog(page).getByRole("button", { name: "Lagre" }).click();
  }
  await expect.poll(() => relatedTitles(page)).toEqual(["Artikkel A", "Artikkel B", "Artikkel C"]);
});

test("can reorder related content by dragging", async ({ page }) => {
  await dragAndDrop(page, dragHandle(page, "Artikkel C"), dragHandle(page, "Artikkel A"));
  await dropFinished(page);
  await expect.poll(() => relatedTitles(page)).toEqual(["Artikkel C", "Artikkel A", "Artikkel B"]);
});

test("shows the new order after moving with the keyboard", async ({ page }) => {
  await dragHandle(page, "Artikkel A").focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await dropFinished(page);
  await expect.poll(() => relatedTitles(page)).toEqual(["Artikkel B", "Artikkel A", "Artikkel C"]);
});

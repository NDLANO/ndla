/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from "@playwright/test";
import { test } from "../apiMock";

test.beforeEach(async ({ page }) => {
  await page.goto("/subject-matter/learning-resource/new");
  await page.getByTestId("slate-editor").click();
  await page.getByTestId("slate-block-picker").click();
  await page.getByTestId("create-table").click();
});

test("can fill table caption", async ({ page }) => {
  await page.locator("caption").click();
  await page.keyboard.type("TITTEL!");
  await expect(page.locator("caption")).toHaveText("TITTEL!");
});

test("can move around and place text in table", async ({ page }) => {
  await expect(page.locator("th")).toHaveCount(2);
  await expect(page.locator("td")).toHaveCount(2);
  await expect(page.locator("tr")).toHaveCount(2);
  await page.locator("tbody > tr > td").first().fill("Cell");
  await page.locator("thead > tr > th").first().click();
  const firstHeader = page.locator("thead > tr > th").first();
  const lastHeader = page.locator("thead > tr > th").last();
  await firstHeader.fill("Header 1");
  await lastHeader.focus();
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowRight");
  await lastHeader.fill("Header 2");
  await expect(page.locator("thead > tr > th").first()).toHaveText("Header 1");
  await expect(page.locator("thead > tr > th").last()).toHaveText("Header 2");
  await page.getByTestId("column-add").click();
  await expect(page.locator("th")).toHaveCount(3);
  await expect(page.locator("td")).toHaveCount(3);

  await page.locator("thead > tr > th").last().click();
  await page.keyboard.type("Test new header");
  await page.keyboard.press("ArrowDown");
  await page.getByTestId("row-add").click();
  await page.locator("tbody > tr > td").last().click();
  await expect(page.locator("tr")).toHaveCount(3);
  await expect(page.locator("td")).toHaveCount(6);
  await page.keyboard.type("Test new row");
  await page.getByTestId("toggle-row-headers").click();
  await expect(page.locator("th")).toHaveCount(5);
  await expect(page.locator("td")).toHaveCount(4);
  await page.getByTestId("column-remove").click();
  await expect(page.locator("th")).toHaveCount(4);
  await expect(page.locator("td")).toHaveCount(2);
  await page.getByTestId("row-remove").click();
  await expect(page.locator("tr")).toHaveCount(2);
});

test("can add rows and columns", async ({ page }) => {
  await page.locator("caption").click();
  await page.keyboard.type("Caption");
  await expect(page.locator("caption")).toHaveText("Caption");
  const locator = page.locator("thead > tr > th").last();
  await locator.click();
  await page.waitForTimeout(1000);
  await page.keyboard.type("Test new header");
  await expect(locator).toHaveText("Test new header");
  await page.keyboard.press("ArrowDown");
  await page.getByTestId("row-add").click();
  await expect(page.locator("tr")).toHaveCount(3);
  await expect(page.locator("td")).toHaveCount(4);
  const lastRowLocator = page.locator("tbody > tr > td").last();
  await lastRowLocator.click();
  await page.waitForTimeout(1000);
  await page.keyboard.type("Test new row");
  await expect(lastRowLocator).toHaveText("Test new row");
  await page.getByTestId("toggle-row-headers").click();
  await expect(page.locator("th")).toHaveCount(4);
  await expect(page.locator("td")).toHaveCount(2);
  await page.getByTestId("column-remove").click();
  await expect(page.locator("th")).toHaveCount(3);
  await expect(page.locator("td")).toHaveCount(0);
  await page.getByTestId("row-remove").click();
  await expect(page.locator("tr")).toHaveCount(2);
});

test("can remove and add table headers", async ({ page }) => {
  await expect(page.locator("th")).toHaveCount(2);
  await expect(page.locator("td")).toHaveCount(2);
  await expect(page.locator("tr")).toHaveCount(2);
  await page.locator("thead > tr > th").first().click();
  await page.getByTestId("row-remove").click();
  await expect(page.locator("th")).toHaveCount(0);
  await expect(page.locator("td")).toHaveCount(2);
  await expect(page.locator("tr")).toHaveCount(1);
  await page.getByTestId("head-add").click();
  await expect(page.locator("th")).toHaveCount(2);
  await expect(page.locator("td")).toHaveCount(2);
  await expect(page.locator("tr")).toHaveCount(2);
});

test("can toggle row headers", async ({ page }) => {
  await expect(page.locator("th")).toHaveCount(2);
  await expect(page.locator("td")).toHaveCount(2);
  await expect(page.locator("tr")).toHaveCount(2);
  await page.locator("tbody > tr > td").first().click();
  await page.getByTestId("toggle-row-headers").click();
  await expect(page.locator("th")).toHaveCount(3);
  await expect(page.locator("td")).toHaveCount(1);
  await expect(page.locator("tr")).toHaveCount(2);
});

test("blockpicker to give limited options in table", async ({ page }) => {
  await page.locator("thead > tr > th").first().click();
  await expect(page.getByTestId("slate-block-picker")).toBeHidden();

  await page.locator("tbody > tr > td").first().click();
  await expect(page.getByTestId("slate-block-picker")).toBeVisible();
  await page.getByTestId("slate-block-picker").click();
  await expect(page.getByTestId("create-image")).toBeVisible();
  await expect(page.getByTestId("slate-block-picker-menu").getByRole("button")).toHaveCount(1);
});

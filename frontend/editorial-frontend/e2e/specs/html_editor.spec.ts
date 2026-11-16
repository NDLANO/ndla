/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect, type Page } from "@playwright/test";
import { test } from "../apiMock";

const collectMonacoErrors = (page: Page) => {
  const errors: string[] = [];
  const collect = (text: string) => {
    if (/UNKNOWN service|reading 'data'/.test(text)) {
      errors.push(text);
    }
  };
  page.on("pageerror", (error) => collect(error.message));
  page.on("console", (message) => collect(message.text()));
  return errors;
};

test("can format then save", async ({ page, harCheckpoint }) => {
  const monacoErrors = collectMonacoErrors(page);
  await page.goto("/edit-markup/800/nb");

  await page.getByRole("presentation").first().click();

  await page.keyboard.press("ControlOrMeta+Shift+F");

  const saveButton = page.getByRole("button", { name: "Lagre" });
  await expect(saveButton).not.toHaveAttribute("disabled");

  await harCheckpoint();
  await saveButton.click();

  await expect(saveButton).toHaveText("Lagre");
  await expect(saveButton).toHaveAttribute("disabled");

  // Saving bumps the revision, which recreates the editor
  await page.getByRole("presentation").first().click();
  await page.waitForTimeout(1000);
  expect(monacoErrors).toEqual([]);
});

test("Open previews", async ({ page }) => {
  await page.goto("/edit-markup/800/nb");
  const previewButton = page.getByRole("button", { name: "Forhåndsvis" });
  await expect(previewButton).not.toHaveAttribute("disabled");

  await previewButton.click();
  await expect(page.getByRole("heading", { name: "Forhåndsvis artikkel" })).toBeVisible();
});

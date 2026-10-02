/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from "@playwright/test";
import { test } from "../apiMock";

test.beforeEach(async ({ page }) => {
  await page.goto("/edit-markup/800/nb");
});

test("can format then save", async ({ page, harCheckpoint }) => {
  await page.getByRole("presentation").first().click();

  await page.keyboard.press("Control+Shift+F");

  const saveButton = page.getByRole("button", { name: "Lagre" });
  await expect(saveButton).not.toHaveAttribute("disabled");

  await harCheckpoint();
  await saveButton.click();

  await expect(saveButton).toHaveText("Lagre");
  await expect(saveButton).toHaveAttribute("disabled");
});

test("Open previews", async ({ page }) => {
  const previewButton = page.getByRole("button", { name: "Forhåndsvis" });
  await expect(previewButton).not.toHaveAttribute("disabled");

  await previewButton.click();
  await expect(page.getByRole("heading", { name: "Forhåndsvis artikkel" })).toBeVisible();
});

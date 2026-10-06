/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect, test } from "@playwright/test";

// These tests only cover routing, so API responses are not needed.
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/api\.test\.ndla\.no\//, (route) => route.abort());
});

test("keeps the locale when navigating from the masthead menu", async ({ page }) => {
  await page.goto("/nn/subject-matter/learning-resource/new");
  await page.getByRole("button", { name: "Åpne meny" }).click();
  await page.getByRole("link", { name: "Strukturredigering", exact: true }).click();
  await expect(page).toHaveURL(/\/nn\/structure$/);
});

test("keeps the locale when searching from the masthead", async ({ page }) => {
  await page.goto("/nn/subject-matter/learning-resource/new");
  await page.getByPlaceholder("Søk etter artikler, aktiviteter eller oppgaver").fill("test");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/nn\/search\/content\?.*query=test/);
});

test("keeps the current page when changing the locale", async ({ page }) => {
  await page.goto("/nn/subject-matter/learning-resource/new");
  await expect(page.locator("html")).toHaveAttribute("lang", "nn");
  await page.locator("#footer").getByRole("combobox").click();
  await page.getByRole("option", { name: "Engelsk" }).click();
  await expect(page).toHaveURL(/\/en\/subject-matter\/learning-resource\/new$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test.describe("when logged out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("redirects to login without losing the locale", async ({ page }) => {
    await page.route(/\/login\?/, (route) => route.fulfill({ body: "login" }));
    await page.goto("/nn/structure");
    await expect(page).toHaveURL(/\/nn\/login\?returnTo=%2Fnn%2Fstructure$/);
  });
});

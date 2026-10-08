/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect, type Page, test } from "@playwright/test";

// These tests only cover the server render and hydration, so API responses are not needed.
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/api\.test\.ndla\.no\//, (route) => route.abort());
});

const collectHydrationErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|Minified React error/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  return errors;
};

test("renders the document and layout on the server", async ({ request }) => {
  const response = await request.get("/nn/structure");
  expect(response.headers()["cache-control"]).toBe("no-store");
  const html = await response.text();
  expect(html).toContain('<html lang="nn"');
  expect(html).toContain('id="masthead"');
  expect(html).toContain('id="footer"');
  expect(html).toContain("window.config = ");
});

test("hydrates the welcome page without mismatches", async ({ page }) => {
  const hydrationErrors = collectHydrationErrors(page);
  await page.goto("/nn");
  // The work list is only rendered in the browser, so it shows up once the page has hydrated
  await expect(page.getByRole("tab").first()).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "nn");
  expect(hydrationErrors).toEqual([]);
});

test.describe("when logged out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("hydrates a public page without mismatches", async ({ page }) => {
    const hydrationErrors = collectHydrationErrors(page);
    await page.goto("/en/does-not-exist");
    await expect(page.locator("#masthead")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(hydrationErrors).toEqual([]);
  });
});

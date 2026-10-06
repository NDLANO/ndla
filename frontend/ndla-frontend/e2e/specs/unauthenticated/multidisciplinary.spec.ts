/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from "@playwright/test";
import { test } from "../../apiMock";
import { API_REGEX } from "../../utils";

test("contains content", async ({ page, waitGraphql }) => {
  let releaseApi = () => {};
  const apiReleased = new Promise<void>((resolve) => (releaseApi = resolve));
  await page.route(API_REGEX, async (route) => {
    await apiReleased;
    await route.fallback();
  });

  await page.goto("/?disableSSR=true");
  await page.getByRole("button").getByText("Meny").click();
  releaseApi();
  await expect(page).toHaveTitle(/Læringsressurser/);
  await page.getByRole("link", { name: "Tverrfaglige tema" }).first().click();
  await waitGraphql();
  await page.waitForLoadState();
  const heading = page.getByRole("heading").getByText("Tverrfaglige temaer");
  expect(heading).toBeDefined();
  await expect(heading).toBeVisible();
  await expect(page.locator("#titleAnnouncer")).toBeFocused();
  await expect(page.locator("#titleAnnouncer")).toHaveText(/Tverrfaglige temaer/);
});

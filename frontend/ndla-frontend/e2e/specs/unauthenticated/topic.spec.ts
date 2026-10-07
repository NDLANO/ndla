/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from "@playwright/test";
import { test } from "../../apiMock";

test.beforeEach(async ({ page }) => {
  await page.goto("/?disableSSR=true");
});

test("contains article header and introduction", async ({ page, waitGraphql }) => {
  await waitGraphql();
  await page.getByRole("button", { name: "Meny" }).click();
  await page.getByRole("link", { name: "Alle fag", exact: true }).click();
  await waitGraphql();
  await page.getByText("UTGÅTTE FAG").last().click();
  await page.getByRole("link", { name: "UTGÅTT - Medieuttrykk 3 og mediesamfunnet 3 (LK06)" }).last().click();
  await waitGraphql();
  await page
    .getByRole("navigation", { name: "Emner" })
    .getByRole("listitem")
    .getByRole("link", { name: "Idéskaping og mediedesign" })
    .click();
  await waitGraphql();
  await expect(page.getByRole("heading", { name: "Idéskaping og mediedesign", exact: true })).toBeVisible();
});

test("announces title when navigating to a subtopic", async ({ page, waitGraphql }) => {
  await page.goto(
    "/e/utgatt---medieuttrykk-3-og-mediesamfunnet-3-lk06/ideskaping-og-mediedesign/38bb532f8f?disableSSR=true",
  );
  await waitGraphql();
  await expect(page.getByRole("heading", { name: "Idéskaping og mediedesign", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Idéutvikling", exact: true }).click();
  await waitGraphql();
  await expect(page.getByRole("heading", { name: "Idéutvikling", exact: true })).toBeVisible();
  await expect(page.locator("#titleAnnouncer")).toBeFocused();
  await expect(page.locator("#titleAnnouncer")).toHaveText(/Idéutvikling/);
});

test("show have functioning language box", async ({ page, waitGraphql }) => {
  await waitGraphql();
  await page.getByRole("button", { name: "Meny" }).click();
  await page.getByRole("link", { name: "Alle fag", exact: true }).click();
  await page.getByText("UTGÅTTE FAG").last().click();
  await page.getByRole("link", { name: "UTGÅTT - Medieuttrykk 3 og mediesamfunnet 3 (LK06)" }).last().click();
  await page
    .getByRole("navigation", { name: "Emner" })
    .getByRole("listitem")
    .getByRole("link", { name: "Tverrfaglige medieoppdrag" })
    .click();

  await waitGraphql();

  await expect(page.getByRole("heading", { name: "Tverrfaglige medieoppdrag", exact: true })).toBeVisible();
});

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from "@playwright/test";
import { test } from "../../apiMock";

test("keeps the locale when navigating from the masthead menu", async ({ page, waitGraphql }) => {
  await page.goto("/nn/?disableSSR=true");
  await waitGraphql();
  await page.getByTestId("masthead-menu-button").click();
  await page.getByRole("link", { name: "Alle fag" }).first().click();
  await expect(page).toHaveURL(/\/nn\/subjects$/);
  await expect(page.getByRole("heading", { name: "Alle fag" })).toBeVisible();
});

test("keeps the locale when searching from the masthead", async ({ page, waitGraphql }) => {
  await page.goto("/nn/?disableSSR=true");
  await waitGraphql();
  await page.getByRole("button", { name: "Søk", exact: true }).first().click();
  await page.getByPlaceholder("Søk i fagstoff, oppgåver og aktivitetar eller læringsstiar").fill("ab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/nn\/search\?query=ab$/);
});

test("keeps the locale and marks the current page when navigating the MyNDLA menu", async ({ page }) => {
  await page.goto("/nn/minndla?disableSSR=true");
  const menu = page.getByTestId("my-ndla-menu");
  const root = menu.getByRole("link", { name: "Min NDLA" });
  const favorites = menu.getByRole("link", { name: "Mine favorittar" });
  await expect(root).toHaveAttribute("aria-current", "page");
  await expect(favorites).not.toHaveAttribute("aria-current");

  await favorites.click();
  await expect(page).toHaveURL(/\/nn\/minndla\/folders$/);
  await expect(favorites).toHaveAttribute("aria-current", "page");
  await expect(root).not.toHaveAttribute("aria-current");
});

test("sends an anonymous user to log in without losing the locale", async ({ page }) => {
  await page.route(/\/login\?/, (route) => route.fulfill({ contentType: "text/html", body: "login" }));
  await page.goto("/nn/minndla?disableSSR=true");
  await page.getByTestId("my-ndla-menu").getByRole("link", { name: "Mine fag" }).click();
  await expect(page).toHaveURL(/\/nn\/login\?returnTo=\/nn\/minndla\/subjects$/);
});

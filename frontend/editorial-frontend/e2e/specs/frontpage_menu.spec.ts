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

const menuItems = (page: Page) => page.getByRole("main").getByRole("list").first().locator(":scope > li");

const menuTitles = (page: Page) =>
  menuItems(page).evaluateAll((items) => items.map((item) => item.querySelector("a")?.textContent?.trim()));

const dragHandle = (page: Page, title: string) =>
  menuItems(page)
    .filter({ has: page.getByRole("link", { name: title, exact: true }) })
    .getByRole("button", { name: "Håndtak" })
    .first();

test.beforeEach(async ({ page }) => {
  await page.goto("/frontpage");
  await expect.poll(() => menuTitles(page)).toEqual(["Om NDLA", "Kontakt oss", "Bruke NDLA", "NDLAs historie"]);
});

test("can move a menu item above an open submenu", async ({ page }) => {
  const saved: { menu: { articleId: number }[] }[] = [];
  await page.route("**/frontpage-api/v1/frontpage", async (route, request) => {
    if (request.method() !== "POST") return route.fallback();
    saved.push(request.postDataJSON());
    await route.fulfill({ json: request.postDataJSON() });
  });
  await dragAndDrop(page, dragHandle(page, "Kontakt oss"), dragHandle(page, "Om NDLA"));
  await expect.poll(() => menuTitles(page)).toEqual(["Kontakt oss", "Om NDLA", "Bruke NDLA", "NDLAs historie"]);
  await page.getByRole("button", { name: "Lagre" }).click();
  await expect
    .poll(() => saved.map(({ menu }) => menu.map(({ articleId }) => articleId)))
    .toEqual([[38002, 38247, 42584, 38261]]);
});

test("can move an open submenu to the bottom", async ({ page }) => {
  await dragAndDrop(page, dragHandle(page, "Om NDLA"), dragHandle(page, "NDLAs historie"));
  await expect.poll(() => menuTitles(page)).toEqual(["Kontakt oss", "Bruke NDLA", "NDLAs historie", "Om NDLA"]);
});

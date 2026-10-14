/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from "@playwright/test";
import { test } from "../apiMock";
import { userDataMock } from "../mockResponses";

test.beforeEach(async ({ page }) => {
  await page.goto("/structure/");
  await page.getByTestId("structure").waitFor();
});

test("should have settingsMenu available after clicking button", async ({ page }) => {
  await page.getByTestId("structure").getByRole("link", { name: "Engelsk 1" }).click();
  await page.getByTestId("settings-button").click();
  await expect(page.getByTestId("settings-menu-dialog")).toHaveCount(1);
});

test("should be able to change name of node", async ({ page }) => {
  await page.getByTestId("structure").getByRole("link", { name: "Engelsk 1" }).click();
  await page.getByTestId("settings-button").click();
  await page.getByTestId("changeNodeNameButton").click();
  await page.getByTestId("edit-node-name-form").waitFor();
  await page.getByTestId("subjectName_nb").clear();
  await page.getByTestId("subjectName_nb").fill("Nytt navn");
});

test("should be able to delete and add name of node", async ({ page }) => {
  await page.getByTestId("structure").getByRole("link", { name: "Engelsk 1" }).click();
  await page.getByTestId("settings-button").click();
  await page.getByTestId("changeNodeNameButton").click();
  await page.getByTestId("edit-node-name-form").waitFor();
  await page.getByTestId("subjectName_nb_delete").click();
  await expect(page.getByTestId("subjectName_nb")).toHaveCount(0);
});

test("should be able to change visibility", async ({ page }) => {
  await page.getByTestId("structure").getByRole("link", { name: "Engelsk 1" }).click();
  await page.getByTestId("settings-button").click();
  await page.getByTestId("toggleVisibilityButton").click();
  await expect(page.getByLabel("Synlig", { exact: true })).toHaveCount(1);
  expect(await page.getByLabel("Synlig", { exact: true }).isChecked()).toBeTruthy();
});

test("can toggle favourites", async ({ page }) => {
  const favouriteButton = page
    .locator('div[id="urn:subject:1:c8d6ed8b-d376-4c7b-b73a-3a1d48c3a357"]')
    .getByTestId("favourite-subject");
  await favouriteButton.waitFor();
  await expect(favouriteButton).toHaveCount(1);
  await favouriteButton.click();
  expect((await page.waitForResponse("**/draft-api/v1/user-data")).ok()).toBeTruthy();
});

test("can only toggle only show favourites", async ({ page }) => {
  const subjects = page.getByTestId("structure").getByTestId("structure-node-item");
  await page.getByTestId("display-options").click();
  expect(await page.getByTestId("switch-favorites").isChecked()).toBeFalsy();
  await expect.poll(() => subjects.count()).toBeGreaterThan(userDataMock.favoriteSubjects.length);
  await page.getByTestId("switch-favorites").click();
  expect(await page.getByTestId("switch-favorites").isChecked()).toBeTruthy();
  await page.getByTestId("structure").waitFor();
  await expect(subjects).toHaveCount(userDataMock.favoriteSubjects.length);
});

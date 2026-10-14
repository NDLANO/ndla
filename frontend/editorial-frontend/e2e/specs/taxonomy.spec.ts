/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NodeChild } from "@ndla/types-backend/taxonomy-api";
import { expect, type Page } from "@playwright/test";
import { test } from "../apiMock";
import { userDataMock } from "../mockResponses";
import { dragAndDrop } from "../utils";

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

const mockNodeConnectionUpdates = async (page: Page) => {
  const updates: { url: string; body: { rank: number } }[] = [];
  await page.route("**/taxonomy/v1/node-connections/**", async (route, request) => {
    if (request.method() !== "PUT") return route.fallback();
    updates.push({ url: decodeURIComponent(request.url()), body: request.postDataJSON() });
    await route.fulfill({ status: 204 });
  });
  return updates;
};

const subject = (page: Page) =>
  page
    .getByTestId("structure")
    .getByTestId("structure-node-item")
    .filter({ has: page.getByRole("link", { name: "Engelsk 1" }) });

const openSubjectTopics = async (page: Page) => {
  const childNodesResponse = page.waitForResponse((response) => response.url().includes("recursive=true"));
  await subject(page).getByRole("link", { name: "Engelsk 1" }).click();
  const subjectId = await subject(page).getAttribute("id");
  const childNodes: NodeChild[] = await (await childNodesResponse).json();
  const topics = childNodes.filter((node) => node.parentId === subjectId);
  expect(topics.length).toBeGreaterThanOrEqual(3);
  return topics as [NodeChild, NodeChild, NodeChild, ...NodeChild[]];
};

const topicItems = (page: Page) => subject(page).locator(":scope > div > ul > li");

const topicNames = (page: Page) =>
  topicItems(page).evaluateAll((items) => items.map((item) => item.querySelector("a")?.textContent?.trim()));

const dragHandle = (page: Page, index: number) => topicItems(page).nth(index).locator(":scope > button");

const names = (topics: NodeChild[]) => topics.map((topic) => topic.name);

test("can reorder nodes by dragging", async ({ page }) => {
  const updates = await mockNodeConnectionUpdates(page);
  const [first, second, third, ...rest] = await openSubjectTopics(page);
  await expect.poll(() => topicNames(page)).toEqual(names([first, second, third, ...rest]));
  await dragAndDrop(page, dragHandle(page, 2), dragHandle(page, 0));
  await expect.poll(() => topicNames(page)).toEqual(names([third, first, second, ...rest]));
  await expect
    .poll(() => updates)
    .toEqual([
      { url: expect.stringContaining(third.connectionId), body: expect.objectContaining({ rank: first.rank }) },
    ]);
});

test("can reorder nodes with the keyboard", async ({ page }) => {
  const updates = await mockNodeConnectionUpdates(page);
  const [first, second, third, ...rest] = await openSubjectTopics(page);
  await expect.poll(() => topicNames(page)).toEqual(names([first, second, third, ...rest]));
  await dragHandle(page, 0).focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect.poll(() => topicNames(page)).toEqual(names([second, third, first, ...rest]));
  await expect
    .poll(() => updates)
    .toEqual([
      { url: expect.stringContaining(first.connectionId), body: expect.objectContaining({ rank: third.rank + 1 }) },
    ]);
});

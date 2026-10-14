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

const relatedContentList = (page: Page) =>
  page.locator("li").filter({ has: page.getByRole("button", { name: "Endre rekkefølge" }) });

test.beforeEach(async ({ page }) => {
  await page.goto("/subject-matter/learning-resource/800/edit/nb");
  await page.getByTestId("saveLearningResourceButtonWrapper").waitFor();
  await page.getByRole("heading").getByRole("button", { name: "Relatert innhold" }).click();
  for (const title of ["Ekstern A", "Ekstern B"]) {
    await page.getByRole("button", { name: "Legg til ekstern artikkel" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByTestId("addExternalTitleInput").fill(title);
    await dialog.getByTestId("addExternalUrlInput").fill(`https://example.com/${title.at(-1)}`);
    await dialog.getByRole("button", { name: "Lagre" }).click();
    await expect(dialog).toHaveCount(0);
  }
});

test("keeps external links when reordering", async ({ page }) => {
  const saved: unknown[] = [];
  await page.route("**/draft-api/v1/drafts/800", async (route, request) => {
    if (request.method() !== "PATCH") return route.fallback();
    saved.push(request.postDataJSON().relatedContent);
    await route.fulfill({ json: request.postDataJSON() });
  });
  await expect(relatedContentList(page).getByRole("link")).toHaveText(["Ekstern A", "Ekstern B"]);
  const handles = relatedContentList(page).getByRole("button", { name: "Endre rekkefølge" });
  await dragAndDrop(page, handles.nth(1), handles.nth(0));
  await expect(relatedContentList(page).getByRole("link")).toHaveText(["Ekstern B", "Ekstern A"]);
  await page.getByTestId("saveLearningResourceButtonWrapper").getByRole("button").first().click();
  await expect
    .poll(() => saved)
    .toEqual([
      [
        { title: "Ekstern B", url: "https://example.com/B" },
        { title: "Ekstern A", url: "https://example.com/A" },
      ],
    ]);
});

/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect } from "@playwright/test";
import { test } from "../apiMock";
import { selectAllAndWaitForButton } from "../utils";

test.beforeEach(async ({ page }) => {
  await page.goto("/subject-matter/learning-resource/new");
  await page.getByTestId("slate-editor").getByRole("textbox").waitFor();
});

test("can change text styling", async ({ page }) => {
  const el = page.getByTestId("slate-editor");
  await el.click();
  await el.getByRole("textbox").fill("text to style");
  const bold = page.getByTestId("toolbar-button-bold");
  await selectAllAndWaitForButton(page, bold);
  await bold.click();
  await expect(bold).toHaveAttribute("data-state", "on");
  await bold.click();
  const italic = page.getByTestId("toolbar-button-italic");
  await italic.click();
  await expect(italic).toHaveAttribute("data-state", "on");
  await italic.click();
  const code = page.getByTestId("toolbar-button-code");
  await code.click();
  await expect(code).toHaveAttribute("data-state", "on");
  await code.click();
  const sub = page.getByTestId("toolbar-button-sub");
  await sub.click();
  await expect(sub).toHaveAttribute("data-state", "on");
  await sub.click();
  const sup = page.getByTestId("toolbar-button-sup");
  await sup.click();
  await expect(sup).toHaveAttribute("data-state", "on");
  await sup.click();
  await el.click();
  await el.getByRole("textbox").fill("This is test content");
  const quote = page.getByTestId("toolbar-button-quote");
  await selectAllAndWaitForButton(page, quote);
  await quote.click();
  await expect(quote).toHaveAttribute("data-state", "on");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Test new line");
  await expect(page.getByRole("blockquote")).toHaveText("This is test content");
});

test("can create headings", async ({ page }) => {
  const el = page.getByTestId("slate-editor");
  await el.click();
  await el.getByRole("textbox").fill("text to style");
  const button = page.getByTestId("toolbar-button-text");
  await selectAllAndWaitForButton(page, button);
  await button.click();
  const h2Button = page.getByTestId("text-option-heading-2");
  await h2Button.waitFor({ state: "visible" });
  await h2Button.click();
  await expect(page.locator("h2").getByText("text to style")).toBeVisible();
  await button.click();
  const h3Button = page.getByTestId("text-option-heading-3");
  await h3Button.waitFor({ state: "visible" });
  await h3Button.click();
  await expect(page.locator("h3").getByText("text to style")).toBeVisible();
  await button.click();
  const h4Button = page.getByTestId("text-option-heading-4");
  await h4Button.waitFor({ state: "visible" });
  await h4Button.click();
  await expect(page.locator("h4").getByText("text to style")).toBeVisible();
  await button.click();
  const normalTextButton = page.getByTestId("text-option-normal-text");
  await normalTextButton.click();
  await expect(page.locator("p").getByText("text to style")).toBeVisible();
});

test("can create a valid link", async ({ page }) => {
  const el = page.getByTestId("slate-editor");
  await el.click();
  await el.getByRole("textbox").fill("This is a test link");
  const button = page.getByTestId("toolbar-button-content-link");
  await selectAllAndWaitForButton(page, button);
  await button.click();
  await page.locator('input[name="href"]').fill("http://www.vg.no");
  await page.getByText("Sett inn lenke").click();
  await expect(page.getByText("Legg til lenke")).toHaveCount(0);
  await expect(page.locator('a[href="http://www.vg.no"][data-slate-node="element"]')).toBeVisible();
  await expect(page.locator('a[href="http://www.vg.no"][data-slate-node="element"]')).toHaveText("This is a test link");
});

test("can create a valid link without facebook id", async ({ page }) => {
  const el = page.getByTestId("slate-editor");
  await el.click();
  await el.getByRole("textbox").fill("This is a test link");
  const button = page.getByTestId("toolbar-button-content-link");
  await selectAllAndWaitForButton(page, button);
  await button.click();
  await page.locator('input[name="href"]').fill("http://www.vg.no/artikkel?fbclid=denneskalikkjelengerværemed");
  await page.getByText("Sett inn lenke").click();
  await expect(page.getByText("Legg til lenke")).toHaveCount(0);
  await expect(page.locator('a[href="http://www.vg.no/artikkel"][data-slate-node="element"]')).toBeVisible();
  await expect(page.locator('a[href="http://www.vg.no/artikkel"][data-slate-node="element"]')).toHaveText(
    "This is a test link",
  );
});

test("All lists work properly", async ({ page }) => {
  const el = page.getByTestId("slate-editor");
  await el.click();
  await el.getByRole("textbox").fill("First item in the list");
  const numberedList = page.getByTestId("toolbar-button-numbered-list");
  await selectAllAndWaitForButton(page, numberedList);
  await numberedList.click();
  await expect(numberedList).toHaveAttribute("data-state", "on");
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second item in the list");
  await expect(page.getByRole("listitem")).toHaveCount(2);
  const bulletList = page.getByTestId("toolbar-button-bulleted-list");
  await selectAllAndWaitForButton(page, bulletList);
  await bulletList.click();
  await expect(bulletList).toHaveAttribute("data-state", "on");
  await expect(page.locator("ul > li")).toHaveCount(2);
  const letterList = page.getByTestId("toolbar-button-letter-list");
  await selectAllAndWaitForButton(page, letterList);
  await letterList.click();
  await expect(letterList).toHaveAttribute("data-state", "on");
  await expect(page.locator("ol > li")).toHaveCount(2);
});

test("Definition list work properly", async ({ page }) => {
  const el = page.getByTestId("slate-editor");
  await el.click();
  await el.getByRole("textbox").fill("Definition term");
  const definitionList = page.getByTestId("toolbar-button-definition-list");
  await selectAllAndWaitForButton(page, definitionList);
  await definitionList.click();
  await expect(definitionList).toHaveAttribute("data-state", "on");
  await expect(page.locator("dl > dt")).toHaveCount(1);
  await el.press("ArrowRight");
  await el.press("End");
  await el.press("Enter");
  await el.press("Tab");
  await page.keyboard.type("Definition description");
  await expect(page.locator("dl > dd")).toHaveCount(1);
});

test("Selecting multiple paragraphs gives multiple terms", async ({ page }) => {
  const el = page.getByTestId("slate-editor");
  await el.click();
  await page.keyboard.type("Definition term 1");
  await el.press("Enter");
  await page.keyboard.type("Definition term 2");
  await el.press("Enter");
  await page.keyboard.type("Definition term 3");
  await el.press("Enter");
  const definitionList = page.getByTestId("toolbar-button-definition-list");
  await selectAllAndWaitForButton(page, definitionList);
  await definitionList.click();
  await expect(definitionList).toHaveAttribute("data-state", "on");
  await expect(page.locator("dl > dt")).toHaveCount(3);
});

test("Language label buttons are available, and labels can be set", async ({ page }) => {
  const el = page.getByTestId("slate-editor");
  await el.click();
  await el.getByRole("textbox").fill("Hello");
  const languageButton = page.getByTestId("toolbar-button-language");
  await selectAllAndWaitForButton(page, languageButton);
  await languageButton.click();
  const firstLangButton = page.getByTestId("language-button-ar");
  await firstLangButton.waitFor({ state: "visible" });
  await firstLangButton.click();
  await selectAllAndWaitForButton(page, languageButton);
  await expect(languageButton).toHaveText("Arabisk");
  expect(page.locator('span[lang="ar"]')).toBeDefined();
});

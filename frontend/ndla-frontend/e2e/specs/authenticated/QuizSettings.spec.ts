/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect, test } from "@playwright/test";

type Settings = {
  randomOrder: boolean;
  randomSubset: boolean;
  questionCount: number | null;
  alternativesRandomOrder: boolean;
};

const question = (i: number) => ({
  __typename: "QuizQuestion",
  id: `q${i}`,
  questionType: "SINGLE_CHOICE",
  title: `Spørsmål ${i}`,
  required: false,
  alternativesRandomOrder: false,
  sortOrder: i,
  alternatives: [
    { __typename: "QuizAlternative", id: `a${i}1`, text: "A", isCorrect: true },
    { __typename: "QuizAlternative", id: `a${i}2`, text: "B", isCorrect: false },
  ],
});

const COMBOS: [boolean, boolean, boolean][] = [
  [true, false, false],
  [true, true, false],
  [true, false, true],
  [true, true, true],
  [false, true, false],
  [false, true, true],
  [false, false, true],
  [false, false, false],
];

test("quiz settings are saved for all 8 combinations", async ({ page }) => {
  let revision = 1;
  let settings: Settings = {
    randomOrder: false,
    randomSubset: false,
    questionCount: 10,
    alternativesRandomOrder: false,
  };
  const updates: Settings[] = [];
  const quiz = () => ({
    __typename: "Quiz",
    id: "quiz1",
    revision,
    title: "Test",
    description: null,
    status: "PRIVATE",
    displaySettings: { __typename: "QuizDisplaySettings", ...settings },
    created: "2026-01-01T00:00:00Z",
    updated: "2026-01-01T00:00:00Z",
    owner: { __typename: "Owner", name: "Meg" },
    questions: [1, 2, 3, 4, 5, 6].map(question),
  });

  await page.route("**/graphql-api/graphql", async (route, request) => {
    const body = JSON.parse(request.postData() ?? "{}");
    if (body.operationName === "myNdlaData") {
      return route.fulfill({
        json: {
          data: {
            examLockStatus: { __typename: "ConfigMetaBoolean", key: "EXAM_LOCK", value: false },
            personalData: {
              __typename: "MyNdlaPersonalData",
              id: 1,
              username: "test",
              email: "t@example.com",
              displayName: "Test",
              groups: [],
              organization: "Test",
              favoriteSubjects: [],
              role: "employee",
              arenaEnabled: false,
            },
          },
        },
      });
    }
    if (body.operationName === "quiz") {
      return route.fulfill({ json: { data: { quiz: quiz() } } });
    }
    if (body.operationName === "updateQuiz") {
      settings = { ...settings, ...body.variables.displaySettings };
      updates.push(body.variables.displaySettings);
      revision += 1;
      return route.fulfill({ json: { data: { updateQuiz: quiz() } } });
    }
    return route.fallback();
  });

  await page.goto("/minndla/quiz/quiz1/edit?disableSSR=true");
  await page.getByRole("tab", { name: "Innstillinger" }).click();

  const setYesNo = async (label: string, yes: boolean) => {
    const group = page.getByRole("radiogroup").filter({ hasText: label });
    await group.getByText(yes ? "Ja" : "Nei", { exact: true }).click();
  };

  for (const [order, alts, subset] of COMBOS) {
    await setYesNo("Tilfeldig rekkefølge på spørsmål?", order);
    await setYesNo("Tilfeldig rekkefølge på svaralternativer?", alts);
    await setYesNo("Tilfeldig utvalg av spørsmål?", subset);
    const before = updates.length;
    await page.getByRole("button", { name: "Lagre" }).first().click();
    await expect.poll(() => updates.length).toBe(before + 1);
    expect(updates.at(-1), `order=${order} alts=${alts} subset=${subset}`).toMatchObject({
      randomOrder: order,
      alternativesRandomOrder: alts,
      randomSubset: subset,
    });
  }
});

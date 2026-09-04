/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { QuestionFormValues } from "./QuestionCard";

export const questionEquals = (a: QuestionFormValues, b: QuestionFormValues) =>
  a.title === b.title &&
  a.questionType === b.questionType &&
  a.required === b.required &&
  a.alternativesRandomOrder === b.alternativesRandomOrder &&
  a.alternatives.length === b.alternatives.length &&
  a.alternatives.every(
    (alt, i) => alt.text === b.alternatives[i]?.text && alt.isCorrect === b.alternatives[i]?.isCorrect,
  );

export const emptyQuestion = (): QuestionFormValues => ({
  id: crypto.randomUUID(),
  title: "",
  questionType: "SINGLE_CHOICE",
  required: false,
  alternativesRandomOrder: false,
  alternatives: [
    { id: crypto.randomUUID(), text: "", isCorrect: false },
    { id: crypto.randomUUID(), text: "", isCorrect: false },
  ],
});

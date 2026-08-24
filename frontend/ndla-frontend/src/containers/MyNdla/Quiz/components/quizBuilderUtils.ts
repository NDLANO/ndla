/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { QuestionFormValues } from "./QuestionCard";

export const emptyQuestion = (): QuestionFormValues => ({
  id: crypto.randomUUID(),
  title: "",
  questionType: "SINGLE_CHOICE",
  required: false,
  alternatives: [
    { id: crypto.randomUUID(), text: "", isCorrect: false },
    { id: crypto.randomUUID(), text: "", isCorrect: false },
  ],
});

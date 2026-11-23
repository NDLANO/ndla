/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { GQLQuizFragment } from "../../../../../graphqlTypes";
import { emptyQuizState } from "../quizBuilderUtils";
import { useQuizSave } from "../useQuizSave";

const mocks = vi.hoisted(() => ({
  addQuiz: vi.fn(),
  updateQuiz: vi.fn(),
  addQuizQuestion: vi.fn(),
  updateQuizQuestion: vi.fn(),
  deleteQuizQuestion: vi.fn(),
}));

vi.mock("../../../../../mutations/quiz/quizMutations", () => ({
  useAddQuizMutation: () => [mocks.addQuiz],
  useUpdateQuizMutation: () => [mocks.updateQuiz],
  useAddQuizQuestionMutation: () => [mocks.addQuizQuestion],
  useUpdateQuizQuestionMutation: () => [mocks.updateQuizQuestion],
  useDeleteQuizQuestionMutation: () => [mocks.deleteQuizQuestion],
}));

vi.mock("../../../../../util/handleError", () => ({
  handleError: vi.fn(),
  ensureError: (e: unknown) => e,
}));

const makeQuiz = (questionIds: string[]) =>
  ({ id: "quiz-1", revision: 1, questions: questionIds.map((id) => ({ id })) }) as unknown as GQLQuizFragment;

describe("useQuizSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("does not add a question twice when a queued sync sees stale state", async () => {
    const quiz = makeQuiz([]);
    mocks.addQuiz.mockResolvedValue({ data: { addQuiz: quiz } });
    mocks.updateQuiz.mockResolvedValue({ data: { updateQuiz: quiz } });
    mocks.addQuizQuestion.mockResolvedValue({ data: { addQuizQuestion: makeQuiz(["server-q1"]) } });
    mocks.updateQuizQuestion.mockResolvedValue({ data: { updateQuizQuestion: makeQuiz(["server-q1"]) } });

    const state = emptyQuizState();
    state.title = "Quiz";
    const [first] = state.questions;
    state.questions = [
      {
        ...first!,
        title: "Spørsmål",
        alternatives: [
          { id: "a", text: "A", isCorrect: true },
          { id: "b", text: "B", isCorrect: false },
        ],
      },
    ];

    // Props never change, which mimics React not having re-rendered with the new serverId yet.
    const { result } = renderHook(() => useQuizSave({ state, quiz, onQuizSynced: vi.fn(), onQuestionSynced: vi.fn() }));

    await Promise.all([result.current.sync(), result.current.sync()]);

    expect(mocks.addQuizQuestion).toHaveBeenCalledTimes(1);
  });
});

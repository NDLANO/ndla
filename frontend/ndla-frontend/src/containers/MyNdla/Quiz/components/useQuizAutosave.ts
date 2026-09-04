/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useRef } from "react";
import {
  useAddQuizMutation,
  useAddQuizQuestionMutation,
  useDeleteQuizQuestionMutation,
  useUpdateQuizMutation,
  useUpdateQuizQuestionMutation,
  useUpdateQuizStatusMutation,
} from "../../../../mutations/quiz/quizMutations";
import { QUIZ_IN_PROGRESS, QUIZ_PRIVATE } from "../utils";
import type { QuestionFormValues } from "./QuestionCard";
import type { QuizBuilderState } from "./QuizBuilder";
import { hasCorrectAnswer, questionEquals } from "./quizBuilderUtils";

const AUTOSAVE_DELAY_MS = 2000;

export interface SyncedQuiz {
  id: string;
  revision: number;
  status: string;
}

interface Props {
  state: QuizBuilderState;
  quiz: SyncedQuiz | undefined;
  onQuizSynced: (quiz: SyncedQuiz) => void;
  onQuestionSynced: (localId: string, serverId: string) => void;
  enabled: boolean;
}

const toAlternativesInput = (question: QuestionFormValues) =>
  question.alternatives.filter((alt) => alt.text.trim()).map((alt) => ({ text: alt.text, isCorrect: alt.isCorrect }));

export const useQuizAutosave = ({ state, quiz, onQuizSynced, onQuestionSynced, enabled }: Props) => {
  const [addQuiz] = useAddQuizMutation();
  const [updateQuiz] = useUpdateQuizMutation();
  const [addQuizQuestion] = useAddQuizQuestionMutation();
  const [updateQuizQuestion] = useUpdateQuizQuestionMutation();
  const [deleteQuizQuestion] = useDeleteQuizQuestionMutation();
  const [updateQuizStatus] = useUpdateQuizStatusMutation();

  const quizRef = useRef(quiz);
  useEffect(() => {
    quizRef.current = quiz;
  }, [quiz]);

  const knownServerIdsRef = useRef(new Set(state.questions.map((q) => q.serverId).filter((id) => !!id)));
  const snapshotRef = useRef<Record<string, QuestionFormValues>>(
    Object.fromEntries(state.questions.filter((q) => q.serverId).map((q) => [q.id, q])),
  );
  const syncingRef = useRef(false);

  const sync = useCallback(async (): Promise<SyncedQuiz | undefined> => {
    if (!state.title.trim() || syncingRef.current) return quizRef.current;
    syncingRef.current = true;
    try {
      let current = quizRef.current;

      if (!current) {
        const res = await addQuiz({
          variables: {
            title: state.title,
            description: state.description || undefined,
            randomSubset: state.randomSubset,
            questionCount: Number(state.questionCount),
          },
        });
        if (!res.data?.addQuiz) return undefined;
        current = { id: res.data.addQuiz.id, revision: res.data.addQuiz.revision, status: res.data.addQuiz.status };
        onQuizSynced(current);
      } else {
        const res = await updateQuiz({
          variables: {
            id: current.id,
            revision: current.revision,
            title: state.title,
            description: state.description || undefined,
            randomSubset: state.randomSubset,
            questionCount: Number(state.questionCount),
          },
        });
        if (!res.data?.updateQuiz) return current;
        current = { id: current.id, revision: res.data.updateQuiz.revision, status: res.data.updateQuiz.status };
        onQuizSynced(current);
      }

      for (const question of state.questions) {
        if (!question.title.trim()) continue;
        const alternatives = toAlternativesInput(question);

        if (!question.serverId) {
          const res = await addQuizQuestion({
            variables: {
              quizId: current.id,
              questionType: question.questionType,
              title: question.title,
              alternatives,
              required: question.required,
              alternativesRandomOrder: question.alternativesRandomOrder,
            },
          });
          const updated = res.data?.addQuizQuestion;
          if (!updated) continue;
          current = { id: current.id, revision: updated.revision, status: updated.status };
          onQuizSynced(current);
          const newQuestion = updated.questions.find((q) => !knownServerIdsRef.current.has(q.id));
          if (newQuestion) {
            knownServerIdsRef.current.add(newQuestion.id);
            snapshotRef.current[question.id] = { ...question, serverId: newQuestion.id };
            onQuestionSynced(question.id, newQuestion.id);
          }
        } else {
          const snapshot = snapshotRef.current[question.id];
          if (snapshot && questionEquals(snapshot, question)) continue;
          const res = await updateQuizQuestion({
            variables: {
              quizId: current.id,
              questionId: question.serverId,
              questionType: question.questionType,
              title: question.title,
              alternatives,
              required: question.required,
              alternativesRandomOrder: question.alternativesRandomOrder,
            },
          });
          const updated = res.data?.updateQuizQuestion;
          if (!updated) continue;
          current = { id: current.id, revision: updated.revision, status: updated.status };
          onQuizSynced(current);
          snapshotRef.current[question.id] = question;
        }
      }

      const currentLocalIds = new Set(state.questions.map((q) => q.id));
      for (const [localId, snapshot] of Object.entries(snapshotRef.current)) {
        if (currentLocalIds.has(localId) || !snapshot.serverId) continue;
        const res = await deleteQuizQuestion({ variables: { quizId: current.id, questionId: snapshot.serverId } });
        if (res.data?.deleteQuizQuestion) {
          current = {
            id: current.id,
            revision: res.data.deleteQuizQuestion.revision,
            status: res.data.deleteQuizQuestion.status,
          };
          onQuizSynced(current);
        }
        delete snapshotRef.current[localId];
        knownServerIdsRef.current.delete(snapshot.serverId);
      }

      const hasIncompleteQuestion = state.questions.some(
        (question) => question.title.trim() && !hasCorrectAnswer(question),
      );
      if (hasIncompleteQuestion && current.status === QUIZ_PRIVATE) {
        const res = await updateQuizStatus({ variables: { id: current.id, status: QUIZ_IN_PROGRESS } });
        if (res.data?.updateQuizStatus) {
          current = {
            id: current.id,
            revision: res.data.updateQuizStatus.revision,
            status: res.data.updateQuizStatus.status,
          };
          onQuizSynced(current);
        }
      }

      return current;
    } finally {
      syncingRef.current = false;
    }
  }, [
    state,
    addQuiz,
    updateQuiz,
    addQuizQuestion,
    updateQuizQuestion,
    deleteQuizQuestion,
    updateQuizStatus,
    onQuizSynced,
    onQuestionSynced,
  ]);

  useEffect(() => {
    if (!enabled) return;
    const timeout = setTimeout(() => {
      sync();
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [state, enabled, sync]);

  return { sync };
};

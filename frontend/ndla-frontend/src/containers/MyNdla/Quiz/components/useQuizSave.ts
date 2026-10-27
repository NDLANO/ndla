/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useEffect, useRef } from "react";
import type { GQLQuizFragment } from "../../../../graphqlTypes";
import {
  useAddQuizMutation,
  useAddQuizQuestionMutation,
  useDeleteQuizQuestionMutation,
  useUpdateQuizMutation,
  useUpdateQuizQuestionMutation,
} from "../../../../mutations/quiz/quizMutations";
import type { QuestionFormValues } from "./QuestionCard";
import type { QuizBuilderState } from "./QuizBuilder";
import { questionEquals } from "./quizBuilderUtils";

interface Props {
  state: QuizBuilderState;
  quiz: GQLQuizFragment | undefined;
  onQuizSynced: (quiz: GQLQuizFragment) => void;
  onQuestionSynced: (localId: string, serverId: string) => void;
}

const toAlternativesInput = (question: QuestionFormValues) =>
  question.alternatives.filter((alt) => alt.text.trim()).map((alt) => ({ text: alt.text, isCorrect: alt.isCorrect }));

export const useQuizSave = ({ state, quiz, onQuizSynced, onQuestionSynced }: Props) => {
  const [addQuiz] = useAddQuizMutation();
  const [updateQuiz] = useUpdateQuizMutation();
  const [addQuizQuestion] = useAddQuizQuestionMutation();
  const [updateQuizQuestion] = useUpdateQuizQuestionMutation();
  const [deleteQuizQuestion] = useDeleteQuizQuestionMutation();

  const quizRef = useRef(quiz);
  useEffect(() => {
    quizRef.current = quiz;
  }, [quiz]);

  const knownServerIdsRef = useRef(new Set(state.questions.map((q) => q.serverId).filter((id) => !!id)));
  const snapshotRef = useRef<Record<string, QuestionFormValues>>(
    Object.fromEntries(state.questions.filter((q) => q.serverId).map((q) => [q.id, q])),
  );
  const syncingRef = useRef(false);

  const sync = useCallback(async (): Promise<GQLQuizFragment | undefined> => {
    if (!state.title.trim() || syncingRef.current) return quizRef.current;
    syncingRef.current = true;
    try {
      let current: GQLQuizFragment;
      let failed = false;
      const existing = quizRef.current;

      if (!existing) {
        const res = await addQuiz({
          variables: {
            title: state.title,
            description: state.description || undefined,
            displaySettings: {
              randomOrder: state.randomOrder,
              randomSubset: state.randomSubset,
              questionCount: state.questionCount,
            },
          },
        });
        const added = res.data?.addQuiz;
        if (!added) return undefined;
        current = added;
        onQuizSynced(added);
      } else {
        const res = await updateQuiz({
          variables: {
            id: existing.id,
            revision: existing.revision,
            title: state.title,
            description: state.description || undefined,
            displaySettings: {
              randomOrder: state.randomOrder,
              randomSubset: state.randomSubset,
              questionCount: state.questionCount,
            },
          },
        });
        const updated = res.data?.updateQuiz;
        if (!updated) return undefined;
        current = updated;
        onQuizSynced(updated);
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
          if (!updated) {
            failed = true;
            continue;
          }
          current = updated;
          onQuizSynced(current);
          const newQuestion = updated.questions.find((q) => !knownServerIdsRef.current.has(q.id));
          if (newQuestion) {
            knownServerIdsRef.current.add(newQuestion.id);
            snapshotRef.current[question.id] = {
              ...question,
              serverId: newQuestion.id,
            };
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
          if (!updated) {
            failed = true;
            continue;
          }
          current = updated;
          onQuizSynced(current);
          snapshotRef.current[question.id] = question;
        }
      }

      const currentLocalIds = new Set(state.questions.map((q) => q.id));
      for (const [localId, snapshot] of Object.entries(snapshotRef.current)) {
        if (currentLocalIds.has(localId) || !snapshot.serverId) continue;
        const res = await deleteQuizQuestion({
          variables: { quizId: current.id, questionId: snapshot.serverId },
        });
        if (res.data?.deleteQuizQuestion) {
          current = res.data.deleteQuizQuestion;
          onQuizSynced(current);
        } else {
          failed = true;
          continue;
        }
        delete snapshotRef.current[localId];
        knownServerIdsRef.current.delete(snapshot.serverId);
      }

      return failed ? undefined : current;
    } catch {
      return undefined;
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
    onQuizSynced,
    onQuestionSynced,
  ]);

  return { sync };
};

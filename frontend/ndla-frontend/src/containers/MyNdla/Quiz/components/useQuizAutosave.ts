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
} from "../../../../mutations/quiz/quizMutations";
import type { QuestionFormValues } from "./QuestionCard";
import type { QuizBuilderState } from "./QuizBuilder";
import { questionEquals } from "./quizBuilderUtils";

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

// A snapshot of only the user-editable content, excluding local/server ids: those change as a
// normal side effect of a successful sync (e.g. a newly added question gets a serverId), which
// would otherwise make the state look "dirty" again immediately after persisting it.
const contentSnapshot = (state: QuizBuilderState): string =>
  JSON.stringify({
    title: state.title,
    description: state.description,
    randomSubset: state.randomSubset,
    questionCount: state.questionCount,
    questions: state.questions.map((q) => ({
      title: q.title,
      questionType: q.questionType,
      required: q.required,
      alternativesRandomOrder: q.alternativesRandomOrder,
      alternatives: q.alternatives.map((a) => ({ text: a.text, isCorrect: a.isCorrect })),
    })),
  });

export const useQuizAutosave = ({ state, quiz, onQuizSynced, onQuestionSynced, enabled }: Props) => {
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
  // A snapshot of the state that was last successfully persisted, so an unmount can tell
  // whether anything has changed since (and needs flushing) instead of going off whether a
  // debounce timer happens to be scheduled — that timer gets rescheduled as a side effect of
  // sync()'s own onQuizSynced/onQuestionSynced calls (they update parent state), so "a timer is
  // pending" is true even immediately after a sync that already persisted the current state.
  const lastSyncedStateRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const sync = useCallback(async (): Promise<SyncedQuiz | undefined> => {
    if (!state.title.trim() || syncingRef.current) return quizRef.current;
    const stateSnapshot = contentSnapshot(state);
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

      lastSyncedStateRef.current = stateSnapshot;
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

  // Flushes unsynced changes when the component unmounts (e.g. the user navigates away before
  // the autosave delay elapses), so edits aren't silently dropped. Only flushes if `state`
  // actually differs from what was last persisted — otherwise a manual save that then navigates
  // away would trigger a redundant, superseded sync on its way out.
  const syncRef = useRef(sync);
  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);
  useEffect(() => {
    return () => {
      if (contentSnapshot(stateRef.current) !== lastSyncedStateRef.current) syncRef.current();
    };
  }, []);

  return { sync };
};

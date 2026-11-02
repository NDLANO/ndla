/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../../components/ToastContext";
import type { GQLQuizFragment, GQLQuizStatus } from "../../../../graphqlTypes";
import { useUpdateQuizStatusMutation } from "../../../../mutations/quiz/quizMutations";
import { ensureError, handleError } from "../../../../util/handleError";
import type { QuizBuilderState } from "./QuizBuilder";
import { useQuizSave } from "./useQuizSave";

interface Props {
  initialState: () => QuizBuilderState;
  initialQuiz?: GQLQuizFragment;
  saveFailedMessage: string;
}

export const useQuizEditor = ({ initialState, initialQuiz, saveFailedMessage }: Props) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [state, setState] = useState<QuizBuilderState>(initialState);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [unsharing, setUnsharing] = useState(false);
  const [quiz, setQuiz] = useState<GQLQuizFragment | undefined>(initialQuiz);

  const [updateQuizStatusMutation] = useUpdateQuizStatusMutation();

  const updateQuizStatus = useCallback(
    async (id: string, status: GQLQuizStatus) => {
      try {
        const res = await updateQuizStatusMutation({ variables: { id, status } });
        return res.data?.updateQuizStatus ?? undefined;
      } catch (error) {
        handleError(ensureError(error), { quizId: id, status });
        return undefined;
      }
    },
    [updateQuizStatusMutation],
  );

  const onQuestionSynced = useCallback((localId: string, serverId: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === localId ? { ...q, serverId } : q)),
    }));
  }, []);

  const { sync } = useQuizSave({
    state,
    quiz,
    onQuizSynced: setQuiz,
    onQuestionSynced,
  });

  const onSave = async () => {
    setSaving(true);

    const isFirstSave = !quiz;
    const { quiz: synced, failed } = await sync();
    // A first save may create the quiz even if some questions fail, so the status must still be set.
    const statusFailed = isFirstSave && !!synced && !(await updateQuizStatus(synced.id, "PRIVATE"));

    setSaving(false);
    if (!synced || failed || statusFailed) {
      toast.create({ title: saveFailedMessage });
      return false;
    }

    toast.create({ title: t("myNdla.quiz.toast.saved") });
    return true;
  };

  const onShare = async () => {
    setSharing(true);

    const { quiz: synced, failed } = await sync();
    if (!synced || failed) {
      toast.create({ title: saveFailedMessage });
      setSharing(false);
      return undefined;
    }

    const updated = await updateQuizStatus(synced.id, "PUBLIC");
    setSharing(false);
    if (!updated) {
      toast.create({ title: t("myNdla.quiz.toast.sharedFailed") });
      return undefined;
    }

    setQuiz(updated);
    toast.create({
      title: t("myNdla.quiz.toast.shared", { title: state.title }),
    });
    return updated;
  };

  const onUnshare = async () => {
    if (!quiz) return false;
    setUnsharing(true);

    const updated = await updateQuizStatus(quiz.id, "PRIVATE");
    setUnsharing(false);
    if (!updated) {
      toast.create({ title: t("myNdla.quiz.toast.unshareFailed") });
      return false;
    }

    setQuiz(updated);
    toast.create({
      title: t("myNdla.quiz.toast.unshared", { title: state.title }),
    });
    return true;
  };

  return {
    state,
    builderProps: {
      state,
      onChange: setState,
      onSave,
      onShare,
      onUnshare,
      saving,
      sharing,
      unsharing,
      isShared: quiz?.status === "PUBLIC",
      quizId: quiz?.id,
    },
  };
};

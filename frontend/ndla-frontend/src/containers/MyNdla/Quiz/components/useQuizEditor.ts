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
import type { GQLQuizFragment } from "../../../../graphqlTypes";
import { useUpdateQuizStatusMutation } from "../../../../mutations/quiz/quizMutations";
import type { QuizBuilderState } from "./QuizBuilder";
import { useQuizSave } from "./useQuizSave";
export const QUIZ_PRIVATE = "PRIVATE";
export const QUIZ_PUBLIC = "PUBLIC";

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

  const [updateQuizStatus] = useUpdateQuizStatusMutation();

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
    const synced = await sync();
    if (!synced) {
      toast.create({ title: saveFailedMessage });
      setSaving(false);
      return false;
    }

    if (isFirstSave) {
      await updateQuizStatus({
        variables: { id: synced.id, status: QUIZ_PRIVATE },
      });
    }

    setSaving(false);
    toast.create({ title: t("myNdla.quiz.toast.saved") });
    return true;
  };

  const onShare = async () => {
    setSharing(true);

    const synced = await sync();
    if (!synced) {
      toast.create({ title: saveFailedMessage });
      setSharing(false);
      return undefined;
    }

    const res = await updateQuizStatus({
      variables: { id: synced.id, status: QUIZ_PUBLIC },
    });
    setSharing(false);
    if (!res.data?.updateQuizStatus) {
      toast.create({ title: t("myNdla.quiz.toast.sharedFailed") });
      return undefined;
    }

    setQuiz(res.data.updateQuizStatus);
    toast.create({
      title: t("myNdla.quiz.toast.shared", { title: state.title }),
    });
    return res.data.updateQuizStatus;
  };

  const onUnshare = async () => {
    if (!quiz) return false;
    setUnsharing(true);

    const res = await updateQuizStatus({
      variables: { id: quiz.id, status: QUIZ_PRIVATE },
    });
    setUnsharing(false);
    if (!res.data?.updateQuizStatus) {
      toast.create({ title: t("myNdla.quiz.toast.unshareFailed") });
      return false;
    }

    setQuiz(res.data.updateQuizStatus);
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
      isShared: quiz?.status === QUIZ_PUBLIC,
      quizId: quiz?.id,
    },
  };
};

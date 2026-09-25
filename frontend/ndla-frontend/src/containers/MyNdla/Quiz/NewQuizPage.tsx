/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../components/ToastContext";
import type { GQLQuizFragment } from "../../../graphqlTypes";
import { useUpdateQuizStatusMutation } from "../../../mutations/quiz/quizMutations";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { QuizBuilder, type QuizBuilderState } from "./components/QuizBuilder";
import { emptyQuestion } from "./components/quizBuilderUtils";
import { useQuizSave } from "./components/useQuizSave";

export const QUIZ_PRIVATE = "PRIVATE";
export const QUIZ_PUBLIC = "PUBLIC";

export const Component = () => {
  return <PrivateRoute element={<NewQuizPage />} />;
};

export const NewQuizPage = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const [state, setState] = useState<QuizBuilderState>({
    title: "",
    description: "",
    randomSubset: false,
    randomOrder: false,
    questionCount: "10",
    questions: [emptyQuestion()],
  });
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [unsharing, setUnsharing] = useState(false);
  const [quiz, setQuiz] = useState<GQLQuizFragment>();

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

  const doSave = async () => {
    setSaving(true);

    const isFirstSave = !quiz;
    const synced = await sync();
    if (!synced) {
      toast.create({ title: t("myNdla.quiz.toast.createdFailed") });
      setSaving(false);
      return undefined;
    }

    if (isFirstSave) {
      await updateQuizStatus({
        variables: { id: synced.id, status: QUIZ_PRIVATE },
      });
    }

    setSaving(false);
    return synced;
  };

  const onSave = async () => {
    const synced = await doSave();
    if (!synced) return false;
    toast.create({ title: t("myNdla.quiz.toast.saved") });
    return true;
  };

  const onShare = async () => {
    setSharing(true);

    const synced = await sync();
    if (!synced) {
      toast.create({ title: t("myNdla.quiz.toast.createdFailed") });
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

  return (
    <QuizBuilder
      pageTitle={t("htmlTitles.quizNewPage")}
      breadcrumbName={t("myNdla.quiz.newQuiz")}
      state={state}
      onChange={setState}
      onSave={onSave}
      onShare={onShare}
      onUnshare={onUnshare}
      saving={saving}
      sharing={sharing}
      unsharing={unsharing}
      isShared={quiz?.status === QUIZ_PUBLIC}
      quizId={quiz?.id}
    />
  );
};

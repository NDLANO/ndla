/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useToast } from "../../../components/ToastContext";
import type { GQLQuizFragment } from "../../../graphqlTypes";
import { useUpdateQuizStatusMutation } from "../../../mutations/quiz/quizMutations";
import { routes } from "../../../routeHelpers";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { QuizBuilder, type QuizBuilderState } from "./components/QuizBuilder";
import { emptyQuestion } from "./components/quizBuilderUtils";
import { useQuizSave } from "./components/useQuizSave";
import { QUIZ_PRIVATE, QUIZ_PUBLIC } from "./utils";

export const Component = () => {
  return <PrivateRoute element={<NewQuizPage />} />;
};

export const NewQuizPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [state, setState] = useState<QuizBuilderState>({
    title: "",
    description: "",
    randomSubset: false,
    questionCount: "10",
    questions: [emptyQuestion()],
  });
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [quiz, setQuiz] = useState<GQLQuizFragment>();

  const [updateQuizStatus] = useUpdateQuizStatusMutation();

  const onQuestionSynced = useCallback((localId: string, serverId: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === localId ? { ...q, serverId } : q,
      ),
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

  const onSaveAndClose = async () => {
    const synced = await doSave();
    if (!synced) return false;
    toast.create({
      title: t("myNdla.quiz.toast.created", { title: state.title }),
    });
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

  return (
    <QuizBuilder
      pageTitle={t("htmlTitles.quizNewPage")}
      breadcrumbName={t("myNdla.quiz.newQuiz")}
      state={state}
      onChange={setState}
      onSave={onSave}
      onSaveAndClose={onSaveAndClose}
      onShare={onShare}
      onCancel={() => navigate(routes.myNdla.quiz)}
      saving={saving}
      sharing={sharing}
      isShared={quiz?.status === QUIZ_PUBLIC}
    />
  );
};

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
import { useUpdateQuizStatusMutation } from "../../../mutations/quiz/quizMutations";
import { routes } from "../../../routeHelpers";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { QuizBuilder, type QuizBuilderState } from "./components/QuizBuilder";
import { emptyQuestion } from "./components/quizBuilderUtils";
import { type SyncedQuiz, useQuizAutosave } from "./components/useQuizAutosave";
import { QUIZ_PRIVATE } from "./utils";

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
  const [quiz, setQuiz] = useState<SyncedQuiz>();

  const [updateQuizStatus] = useUpdateQuizStatusMutation();

  const onQuestionSynced = useCallback((localId: string, serverId: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === localId ? { ...q, serverId } : q)),
    }));
  }, []);

  // Silently persists title, settings, and questions in the background as the user edits, so
  // the quiz shows up as "Påbegynt" (in progress) in "Mine kviss" if the user never completes
  // "Lagre og del".
  const { sync } = useQuizAutosave({
    state,
    quiz,
    onQuizSynced: setQuiz,
    onQuestionSynced,
    enabled: !saving,
  });

  const onSave = async () => {
    if (!state.title.trim()) return;
    setSaving(true);

    const synced = await sync();
    if (!synced) {
      toast.create({ title: t("myNdla.quiz.toast.createdFailed") });
      setSaving(false);
      return;
    }

    await updateQuizStatus({ variables: { id: synced.id, status: QUIZ_PRIVATE } });

    toast.create({ title: t("myNdla.quiz.toast.created", { title: state.title }) });
    setSaving(false);
    navigate(routes.myNdla.quizSave(synced.id));
  };

  return (
    <QuizBuilder
      pageTitle={t("htmlTitles.quizNewPage")}
      breadcrumbName={t("myNdla.quiz.newQuiz")}
      saveLabel={t("myNdla.quiz.form.save")}
      state={state}
      onChange={setState}
      onSave={onSave}
      onCancel={() => navigate(routes.myNdla.quiz)}
      saving={saving}
    />
  );
};

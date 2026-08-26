/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useToast } from "../../../components/ToastContext";
import { useAddQuizMutation, useAddQuizQuestionMutation, useUpdateQuizMutation } from "../../../mutations/quiz/quizMutations";
import { routes } from "../../../routeHelpers";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { QuizBuilder, type QuizBuilderState } from "./components/QuizBuilder";
import { emptyQuestion } from "./components/quizBuilderUtils";

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
    randomOrder: false,
    questions: [emptyQuestion()],
  });
  const [saving, setSaving] = useState(false);

  const [addQuiz] = useAddQuizMutation();
  const [updateQuiz] = useUpdateQuizMutation();
  const [addQuizQuestion] = useAddQuizQuestionMutation();

  const onSave = async () => {
    if (!state.title.trim()) return;
    setSaving(true);

    const quizRes = await addQuiz({ variables: { title: state.title, description: state.description || undefined } });
    const quiz = quizRes.data?.addQuiz;
    if (quizRes.error || !quiz) {
      toast.create({ title: t("myNdla.quiz.toast.createdFailed") });
      setSaving(false);
      return;
    }

    if (state.randomOrder) {
      const res = await updateQuiz({ variables: { id: quiz.id, revision: quiz.revision, randomOrder: true } });
      if (res.error) {
        toast.create({ title: t("myNdla.quiz.toast.createdFailed") });
        setSaving(false);
        return;
      }
    }

    for (const question of state.questions) {
      if (!question.title.trim()) continue;
      const res = await addQuizQuestion({
        variables: {
          quizId: quiz.id,
          questionType: question.questionType,
          title: question.title,
          alternatives: question.alternatives
            .filter((alt) => alt.text.trim())
            .map((alt) => ({ text: alt.text, isCorrect: alt.isCorrect })),
        },
      });
      if (res.error) {
        toast.create({ title: t("myNdla.quiz.toast.createdFailed") });
        setSaving(false);
        return;
      }
    }

    toast.create({ title: t("myNdla.quiz.toast.created", { title: state.title }) });
    setSaving(false);
    navigate(routes.myNdla.quizReview(quiz.id));
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

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { PageRainbowSpinner } from "../../../components/PageSpinner";
import { useToast } from "../../../components/ToastContext";
import {
  useAddQuizQuestionMutation,
  useDeleteQuizQuestionMutation,
  useUpdateQuizMutation,
  useUpdateQuizQuestionMutation,
} from "../../../mutations/quiz/quizMutations";
import { quizQuery } from "../../../mutations/quiz/quizQueries";
import { routes } from "../../../routeHelpers";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { MyNdlaPageContent } from "../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../components/MyNdlaPageWrapper";
import { QuizBuilder, type QuizBuilderState } from "./components/QuizBuilder";
import type { QuestionFormValues } from "./components/QuestionCard";

export const Component = () => {
  return <PrivateRoute element={<EditQuizPage />} />;
};

const toState = (quiz: {
  title: string;
  description?: string | null;
  randomOrder: boolean;
  questions: readonly {
    id: string;
    title: string;
    questionType: string;
    alternatives: readonly { id: string; text: string; isCorrect?: boolean | null }[];
  }[];
}): QuizBuilderState => ({
  title: quiz.title,
  description: quiz.description ?? "",
  randomOrder: quiz.randomOrder,
  questions: quiz.questions.map((question) => ({
    id: crypto.randomUUID(),
    serverId: question.id,
    title: question.title,
    questionType: question.questionType === "MULTI_CHOICE" ? "MULTI_CHOICE" : "SINGLE_CHOICE",
    required: false,
    alternatives: question.alternatives.map((alt) => ({ id: crypto.randomUUID(), text: alt.text, isCorrect: !!alt.isCorrect })),
  })),
});

const questionEquals = (a: QuestionFormValues, b: QuestionFormValues) =>
  a.title === b.title &&
  a.questionType === b.questionType &&
  a.alternatives.length === b.alternatives.length &&
  a.alternatives.every(
    (alt, i) => alt.text === b.alternatives[i]?.text && alt.isCorrect === b.alternatives[i]?.isCorrect,
  );

export const EditQuizPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { quizId } = useParams();

  const { data, loading } = useQuery(quizQuery, { variables: { id: quizId ?? "" }, skip: !quizId });

  const [state, setState] = useState<QuizBuilderState | undefined>(undefined);
  const [originalState, setOriginalState] = useState<QuizBuilderState | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.quiz && !state) {
      const initial = toState(data.quiz);
      setState(initial);
      setOriginalState(initial);
    }
  }, [data, state]);

  const [updateQuiz] = useUpdateQuizMutation();
  const [addQuizQuestion] = useAddQuizQuestionMutation();
  const [updateQuizQuestion] = useUpdateQuizQuestionMutation();
  const [deleteQuizQuestion] = useDeleteQuizQuestionMutation();

  const onSave = async () => {
    if (!state || !originalState || !quizId || !data?.quiz) return;
    setSaving(true);

    if (
      state.title !== originalState.title ||
      state.description !== originalState.description ||
      state.randomOrder !== originalState.randomOrder
    ) {
      const res = await updateQuiz({
        variables: {
          id: quizId,
          revision: data.quiz.revision,
          title: state.title,
          description: state.description || undefined,
          randomOrder: state.randomOrder,
        },
      });
      if (res.error) {
        toast.create({ title: t("myNdla.quiz.toast.updatedFailed") });
        setSaving(false);
        return;
      }
    }

    const originalByServerId = new Map(originalState.questions.map((q) => [q.serverId, q]));
    const remainingServerIds = new Set(originalState.questions.map((q) => q.serverId));

    for (const question of state.questions) {
      if (!question.title.trim()) continue;
      const alternatives = question.alternatives
        .filter((alt) => alt.text.trim())
        .map((alt) => ({ text: alt.text, isCorrect: alt.isCorrect }));

      if (!question.serverId) {
        const res = await addQuizQuestion({
          variables: { quizId, questionType: question.questionType, title: question.title, alternatives },
        });
        if (res.error) {
          toast.create({ title: t("myNdla.quiz.toast.updatedFailed") });
          setSaving(false);
          return;
        }
        continue;
      }

      remainingServerIds.delete(question.serverId);
      const original = originalByServerId.get(question.serverId);
      if (original && !questionEquals(original, question)) {
        const res = await updateQuizQuestion({
          variables: {
            quizId,
            questionId: question.serverId,
            questionType: question.questionType,
            title: question.title,
            alternatives,
          },
        });
        if (res.error) {
          toast.create({ title: t("myNdla.quiz.toast.updatedFailed") });
          setSaving(false);
          return;
        }
      }
    }

    for (const serverId of remainingServerIds) {
      if (!serverId) continue;
      const res = await deleteQuizQuestion({ variables: { quizId, questionId: serverId } });
      if (res.error) {
        toast.create({ title: t("myNdla.quiz.toast.updatedFailed") });
        setSaving(false);
        return;
      }
    }

    toast.create({ title: t("myNdla.quiz.toast.updated", { title: state.title }) });
    setSaving(false);
    navigate(routes.myNdla.quizView(quizId));
  };

  if (loading || !state) {
    return (
      <MyNdlaPageWrapper>
        <MyNdlaPageContent>
          <PageRainbowSpinner />
        </MyNdlaPageContent>
      </MyNdlaPageWrapper>
    );
  }

  return (
    <QuizBuilder
      pageTitle={t("htmlTitles.quizEditPage")}
      breadcrumbName={state.title}
      saveLabel={t("myNdla.quiz.form.saveChanges")}
      quizId={quizId}
      state={state}
      onChange={setState}
      onSave={onSave}
      onCancel={() => navigate(routes.myNdla.quizView(quizId ?? ""))}
      saving={saving}
    />
  );
};

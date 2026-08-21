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
import type { LocalQuestion } from "./components/QuestionCard";

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

const questionEquals = (a: LocalQuestion, b: LocalQuestion) =>
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
    try {
      if (
        state.title !== originalState.title ||
        state.description !== originalState.description ||
        state.randomOrder !== originalState.randomOrder
      ) {
        await updateQuiz({
          variables: {
            id: quizId,
            revision: data.quiz.revision,
            title: state.title,
            description: state.description || undefined,
            randomOrder: state.randomOrder,
          },
        });
      }

      const originalByServerId = new Map(originalState.questions.map((q) => [q.serverId, q]));
      const remainingServerIds = new Set(originalState.questions.map((q) => q.serverId));

      for (const question of state.questions) {
        if (!question.title.trim()) continue;
        const alternatives = question.alternatives
          .filter((alt) => alt.text.trim())
          .map((alt) => ({ text: alt.text, isCorrect: alt.isCorrect }));

        if (!question.serverId) {
          await addQuizQuestion({
            variables: { quizId, questionType: question.questionType, title: question.title, alternatives },
          });
          continue;
        }

        remainingServerIds.delete(question.serverId);
        const original = originalByServerId.get(question.serverId);
        if (original && !questionEquals(original, question)) {
          await updateQuizQuestion({
            variables: {
              quizId,
              questionId: question.serverId,
              questionType: question.questionType,
              title: question.title,
              alternatives,
            },
          });
        }
      }

      for (const serverId of remainingServerIds) {
        if (!serverId) continue;
        await deleteQuizQuestion({ variables: { quizId, questionId: serverId } });
      }

      toast.create({ title: t("myNdla.quiz.toast.updated", { title: state.title }) });
      navigate(routes.myNdla.quizView(quizId));
    } catch {
      toast.create({ title: t("myNdla.quiz.toast.updatedFailed") });
    } finally {
      setSaving(false);
    }
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
      state={state}
      onChange={setState}
      onSave={onSave}
      onCancel={() => navigate(routes.myNdla.quizView(quizId ?? ""))}
      saving={saving}
    />
  );
};

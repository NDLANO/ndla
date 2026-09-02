/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { DefaultErrorMessagePage } from "../../../components/DefaultErrorMessage";
import { PageRainbowSpinner } from "../../../components/PageSpinner";
import { useToast } from "../../../components/ToastContext";
import type { GQLQuizFragment } from "../../../graphqlTypes";
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
import type { QuestionFormValues } from "./components/QuestionCard";
import { QuizBuilder, type QuestionCountOption, type QuizBuilderState } from "./components/QuizBuilder";

export const Component = () => {
  return <PrivateRoute element={<EditQuizPage />} />;
};

const QUESTION_COUNT_OPTIONS: QuestionCountOption[] = ["5", "10", "15", "20"];

const toQuestionCountOption = (questionCount: number | null | undefined): QuestionCountOption => {
  const option = QUESTION_COUNT_OPTIONS.find((o) => Number(o) === questionCount);
  return option ?? "10";
};

const toState = (quiz: GQLQuizFragment): QuizBuilderState => ({
  title: quiz.title,
  description: quiz.description ?? "",
  randomSubset: quiz.randomSubset,
  questionCount: toQuestionCountOption(quiz.questionCount),
  questions: quiz.questions.map((question) => ({
    id: crypto.randomUUID(),
    serverId: question.id,
    title: question.title,
    questionType: question.questionType === "MULTI_CHOICE" ? "MULTI_CHOICE" : "SINGLE_CHOICE",
    required: question.required,
    alternativesRandomOrder: question.alternativesRandomOrder,
    alternatives: question.alternatives.map((alt) => ({
      id: crypto.randomUUID(),
      text: alt.text,
      isCorrect: !!alt.isCorrect,
    })),
  })),
});

const questionEquals = (a: QuestionFormValues, b: QuestionFormValues) =>
  a.title === b.title &&
  a.questionType === b.questionType &&
  a.required === b.required &&
  a.alternativesRandomOrder === b.alternativesRandomOrder &&
  a.alternatives.length === b.alternatives.length &&
  a.alternatives.every(
    (alt, i) => alt.text === b.alternatives[i]?.text && alt.isCorrect === b.alternatives[i]?.isCorrect,
  );

export const EditQuizPage = () => {
  const { quizId } = useParams();
  const { data, loading } = useQuery(quizQuery, { variables: { id: quizId ?? "" }, skip: !quizId });

  if (loading) {
    return (
      <MyNdlaPageWrapper>
        <MyNdlaPageContent>
          <PageRainbowSpinner />
        </MyNdlaPageContent>
      </MyNdlaPageWrapper>
    );
  }

  if (!data?.quiz) {
    return <DefaultErrorMessagePage />;
  }

  return <EditQuizForm quiz={data.quiz} key={data.quiz.id} />;
};

interface EditQuizFormProps {
  quiz: GQLQuizFragment;
}

const EditQuizForm = ({ quiz }: EditQuizFormProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [state, setState] = useState<QuizBuilderState>(() => toState(quiz));
  const [originalState] = useState<QuizBuilderState>(() => toState(quiz));
  const [saving, setSaving] = useState(false);

  const [updateQuiz] = useUpdateQuizMutation();
  const [addQuizQuestion] = useAddQuizQuestionMutation();
  const [updateQuizQuestion] = useUpdateQuizQuestionMutation();
  const [deleteQuizQuestion] = useDeleteQuizQuestionMutation();

  const onSave = async () => {
    setSaving(true);

    if (
      state.title !== originalState.title ||
      state.description !== originalState.description ||
      state.randomSubset !== originalState.randomSubset ||
      state.questionCount !== originalState.questionCount
    ) {
      const res = await updateQuiz({
        variables: {
          id: quiz.id,
          revision: quiz.revision,
          title: state.title,
          description: state.description || undefined,
          randomSubset: state.randomSubset,
          questionCount: Number(state.questionCount),
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
          variables: {
            quizId: quiz.id,
            questionType: question.questionType,
            title: question.title,
            alternatives,
            required: question.required,
            alternativesRandomOrder: question.alternativesRandomOrder,
          },
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
            quizId: quiz.id,
            questionId: question.serverId,
            questionType: question.questionType,
            title: question.title,
            alternatives,
            required: question.required,
            alternativesRandomOrder: question.alternativesRandomOrder,
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
      const res = await deleteQuizQuestion({ variables: { quizId: quiz.id, questionId: serverId } });
      if (res.error) {
        toast.create({ title: t("myNdla.quiz.toast.updatedFailed") });
        setSaving(false);
        return;
      }
    }

    toast.create({ title: t("myNdla.quiz.toast.updated", { title: state.title }) });
    setSaving(false);
    navigate(routes.myNdla.quizSave(quiz.id));
  };

  return (
    <QuizBuilder
      pageTitle={t("htmlTitles.quizEditPage")}
      breadcrumbName={state.title}
      saveLabel={t("myNdla.quiz.form.saveChanges")}
      state={state}
      onChange={setState}
      onSave={onSave}
      onCancel={() => navigate(routes.myNdla.quiz)}
      saving={saving}
    />
  );
};

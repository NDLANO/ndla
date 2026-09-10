/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { DefaultErrorMessagePage } from "../../../components/DefaultErrorMessage";
import { PageRainbowSpinner } from "../../../components/PageSpinner";
import { useToast } from "../../../components/ToastContext";
import type { GQLQuizFragment } from "../../../graphqlTypes";
import { useUpdateQuizStatusMutation } from "../../../mutations/quiz/quizMutations";
import { quizQuery } from "../../../mutations/quiz/quizQueries";
import { routes } from "../../../routeHelpers";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { MyNdlaPageContent } from "../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../components/MyNdlaPageWrapper";
import {
  QuizBuilder,
  type QuestionCountOption,
  type QuizBuilderState,
} from "./components/QuizBuilder";
import { useQuizSave } from "./components/useQuizSave";
import { QUIZ_PUBLIC } from "./utils";

export const Component = () => {
  return <PrivateRoute element={<EditQuizPage />} />;
};

const QUESTION_COUNT_OPTIONS: QuestionCountOption[] = ["5", "10", "15", "20"];

const toQuestionCountOption = (
  questionCount: number | null | undefined,
): QuestionCountOption => {
  const option = QUESTION_COUNT_OPTIONS.find(
    (o) => Number(o) === questionCount,
  );
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
    questionType:
      question.questionType === "MULTI_CHOICE"
        ? "MULTI_CHOICE"
        : "SINGLE_CHOICE",
    required: question.required,
    alternativesRandomOrder: question.alternativesRandomOrder,
    alternatives: question.alternatives.map((alt) => ({
      id: crypto.randomUUID(),
      text: alt.text,
      isCorrect: !!alt.isCorrect,
    })),
  })),
});

export const EditQuizPage = () => {
  const { quizId } = useParams();
  const { data, loading } = useQuery(quizQuery, {
    variables: { id: quizId ?? "" },
    skip: !quizId,
  });

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
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [syncedQuiz, setSyncedQuiz] = useState<GQLQuizFragment>(quiz);

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
    quiz: syncedQuiz,
    onQuizSynced: setSyncedQuiz,
    onQuestionSynced,
  });

  const onSaveAndClose = async () => {
    setSaving(true);

    const synced = await sync();
    if (!synced) {
      toast.create({ title: t("myNdla.quiz.toast.updatedFailed") });
      setSaving(false);
      return false;
    }

    toast.create({
      title: t("myNdla.quiz.toast.updated", { title: state.title }),
    });
    setSaving(false);
    return true;
  };

  const onShare = async () => {
    setSharing(true);

    const synced = await sync();
    if (!synced) {
      toast.create({ title: t("myNdla.quiz.toast.updatedFailed") });
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

    toast.create({
      title: t("myNdla.quiz.toast.shared", { title: state.title }),
    });
    return res.data.updateQuizStatus;
  };

  return (
    <QuizBuilder
      pageTitle={t("htmlTitles.quizEditPage")}
      breadcrumbName={state.title}
      state={state}
      onChange={setState}
      onSaveAndClose={onSaveAndClose}
      onShare={onShare}
      onCancel={() => navigate(routes.myNdla.quiz)}
      saving={saving}
      sharing={sharing}
    />
  );
};

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from "@apollo/client/react";
import { Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { DefaultErrorMessagePage } from "../../components/DefaultErrorMessage";
import { PageContainer, PageLayout } from "../../components/Layout/PageContainer";
import { PageRainbowSpinner } from "../../components/PageSpinner";
import { PageTitle } from "../../components/PageTitle";
import { SocialMediaMetadata } from "../../components/SocialMediaMetadata";
import { useToast } from "../../components/ToastContext";
import type { GQLCheckQuizMutation } from "../../graphqlTypes";
import { useCheckQuizMutation } from "../../mutations/quiz/quizMutations";
import { quizQuery } from "../../mutations/quiz/quizQueries";
import { buildQuizSession } from "../MyNdla/Quiz/utils";
import { QuizQuestionScreen } from "./components/QuizQuestionScreen";
import { QuizResultScreen } from "./components/QuizResultScreen";
import { QuizStartScreen } from "./components/QuizStartScreen";

const StyledLayout = styled(PageLayout, { base: { backgroundColor: "surface.brand.1.subtle" } });

export const PlainQuizPage = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { quizId } = useParams();
  const { data, loading, error } = useQuery(quizQuery, { variables: { id: quizId ?? "" }, skip: !quizId });

  const quiz = data?.quiz;
  const session = useMemo(() => (quiz ? buildQuizSession(quiz) : []), [quiz]);
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<GQLCheckQuizMutation["checkQuiz"] | null>(null);
  const [checkQuiz, { loading: checking }] = useCheckQuizMutation();

  if (loading) {
    return <PageRainbowSpinner />;
  }

  if (error || !quiz) {
    return <DefaultErrorMessagePage />;
  }

  const onStart = () => {
    setQuestionIndex(0);
    setResult(null);
    setStarted(true);
  };

  const currentQuestionId = session[questionIndex]?.id;

  const saveCurrentAnswer = (answerIds: string[]) => {
    if (currentQuestionId) {
      setAnswers((prev) => ({ ...prev, [currentQuestionId]: answerIds }));
    }
  };

  const onFinish = async (answerIds: string[]) => {
    saveCurrentAnswer(answerIds);
    const finalAnswers = { ...answers, [currentQuestionId!]: answerIds };
    const { data: checkData, error } = await checkQuiz({
      variables: {
        quizId: quiz.id,
        answers: session.map((question) => ({
          questionId: question.id,
          selectedAlternativeIds: finalAnswers[question.id] ?? [],
        })),
      },
    });
    if (error || !checkData) {
      toast.create({ title: t("myNdla.quiz.take.checkQuizFailed") });
      return;
    }
    setResult(checkData.checkQuiz);
  };

  const onNextQuestion = (answerIds: string[]) => {
    if (questionIndex === session.length - 1) {
      onFinish(answerIds);
      return;
    }
    saveCurrentAnswer(answerIds);
    setQuestionIndex((prev) => Math.min(prev + 1, session.length - 1));
  };

  const onPreviousQuestion = (answerIds: string[]) => {
    saveCurrentAnswer(answerIds);
    if (questionIndex === 0) {
      setStarted(false);
      return;
    }
    setQuestionIndex((prev) => Math.max(prev - 1, 0));
  };

  const onRetry = () => {
    setAnswers({});
    setResult(null);
    setQuestionIndex(0);
    setStarted(true);
  };

  return (
    <StyledLayout>
      <PageContainer asChild consumeCss>
        <main>
          <PageTitle title={quiz.title} useLocationForCustomPath={true} />
          <SocialMediaMetadata
            type="website"
            title={quiz.title}
            description={quiz.description ?? undefined}
            useLocationForCanonicalPath={true}
          >
            <meta name="robots" content="noindex, nofollow" />
          </SocialMediaMetadata>
          {!session.length ? (
            <Text textStyle="label.medium" fontWeight="light">
              {t("myNdla.quiz.take.noQuestions")}
            </Text>
          ) : !started ? (
            <QuizStartScreen quiz={quiz} questionCount={session.length} onStart={onStart} />
          ) : result ? (
            <QuizResultScreen
              quizTitle={quiz.title}
              session={session}
              answers={answers}
              result={result}
              onRetry={onRetry}
            />
          ) : (
            <QuizQuestionScreen
              key={questionIndex}
              quizTitle={quiz.title}
              question={session[questionIndex]!}
              questionNumber={questionIndex + 1}
              questionCount={session.length}
              initialAnswerIds={answers[session[questionIndex]!.id]}
              onBack={onPreviousQuestion}
              onNext={onNextQuestion}
              isLast={questionIndex === session.length - 1}
              finishing={checking}
            />
          )}
        </main>
      </PageContainer>
    </StyledLayout>
  );
};

export const Component = PlainQuizPage;

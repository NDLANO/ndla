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
import { quizQuery } from "../../mutations/quiz/quizQueries";
import { buildQuizSession } from "../MyNdla/Quiz/utils";
import { QuizQuestionScreen } from "./components/QuizQuestionScreen";
import { QuizStartScreen } from "./components/QuizStartScreen";

const StyledLayout = styled(PageLayout, {
  base: {
    backgroundColor: "surface.brand.1.subtle",
  },
});

export const PlainQuizPage = () => {
  const { t } = useTranslation();
  const { quizId } = useParams();
  const { data, loading, error } = useQuery(quizQuery, {
    variables: { id: quizId ?? "" },
    skip: !quizId,
  });

  const quiz = data?.quiz;
  const session = useMemo(() => (quiz ? buildQuizSession(quiz) : []), [quiz]);
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  if (loading) {
    return <PageRainbowSpinner />;
  }

  if (error || !quiz) {
    return <DefaultErrorMessagePage />;
  }

  const onStart = () => {
    setQuestionIndex(0);
    setStarted(true);
  };

  const onNextQuestion = () => {
    // TODO: handle quiz completion once the result screen is ready.
    setQuestionIndex((prev) => Math.min(prev + 1, session.length - 1));
  };

  const onPreviousQuestion = () => setQuestionIndex((prev) => Math.max(prev - 1, 0));

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
              {t("myNdla.quiz.noQuestions")}
            </Text>
          ) : !started ? (
            <QuizStartScreen quiz={quiz} questionCount={session.length} onStart={onStart} />
          ) : (
            <QuizQuestionScreen
              key={questionIndex}
              quizTitle={quiz.title}
              question={session[questionIndex]!}
              questionNumber={questionIndex + 1}
              questionCount={session.length}
              onBack={questionIndex > 0 ? onPreviousQuestion : undefined}
              onNext={onNextQuestion}
              isLast={questionIndex === session.length - 1}
            />
          )}
        </main>
      </PageContainer>
    </StyledLayout>
  );
};

export const Component = PlainQuizPage;

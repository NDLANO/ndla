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
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { DefaultErrorMessagePage } from "../../components/DefaultErrorMessage";
import { PageContainer, PageLayout } from "../../components/Layout/PageContainer";
import { PageRainbowSpinner } from "../../components/PageSpinner";
import { PageTitle } from "../../components/PageTitle";
import { SocialMediaMetadata } from "../../components/SocialMediaMetadata";
import { quizQuery } from "../../mutations/quiz/quizQueries";
import { buildQuizSession } from "../MyNdla/Quiz/utils";
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

  if (loading) {
    return <PageRainbowSpinner />;
  }

  if (error || !quiz) {
    return <DefaultErrorMessagePage />;
  }

  const onStart = () => {
    // TODO: wire up question/result flow once the start screen is finished.
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
              {t("myNdla.quiz.noQuestions")}
            </Text>
          ) : (
            <QuizStartScreen quiz={quiz} questionCount={session.length} onStart={onStart} />
          )}
        </main>
      </PageContainer>
    </StyledLayout>
  );
};

export const Component = PlainQuizPage;

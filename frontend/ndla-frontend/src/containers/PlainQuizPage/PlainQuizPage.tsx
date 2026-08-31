/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from "@apollo/client/react";
import { QuestionnaireLine } from "@ndla/icons";
import { Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { DefaultErrorMessagePage } from "../../components/DefaultErrorMessage";
import { PageContainer } from "../../components/Layout/PageContainer";
import { MyNdlaTitle } from "../../components/MyNdla/MyNdlaTitle";
import { PageRainbowSpinner } from "../../components/PageSpinner";
import { PageTitle } from "../../components/PageTitle";
import { SocialMediaMetadata } from "../../components/SocialMediaMetadata";
import { quizQuery } from "../../mutations/quiz/quizQueries";
import { isNotFoundError } from "../../util/handleError";
import { NotFoundPage } from "../NotFoundPage/NotFoundPage";

const StyledPageContainer = styled(PageContainer, {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xxlarge",
  },
});

const TitleRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "xsmall",
  },
});

const StyledOl = styled("ol", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
    width: "100%",
    maxWidth: "surface.pageMax",
    listStyle: "none",
  },
});

const QuestionContainer = styled("li", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
    padding: "small",
    borderRadius: "xsmall",
    border: "1px solid",
    borderColor: "stroke.subtle",
  },
});

const AlternativeList = styled("ul", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4xsmall",
    listStyle: "none",
  },
});

export const PlainQuizPage = () => {
  const { t } = useTranslation();
  const { quizId } = useParams();
  const { data, loading, error } = useQuery(quizQuery, {
    variables: { id: quizId ?? "" },
    skip: !quizId,
  });

  if (loading) {
    return <PageRainbowSpinner />;
  }

  if (isNotFoundError(error)) {
    return <NotFoundPage />;
  }

  if (error || !data?.quiz) {
    return <DefaultErrorMessagePage />;
  }

  const quiz = data.quiz;

  return (
    <StyledPageContainer asChild consumeCss>
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
        <TitleRow>
          <QuestionnaireLine size="large" />
          <MyNdlaTitle title={quiz.title} />
        </TitleRow>
        {!!quiz.description && <Text>{quiz.description}</Text>}
        {quiz.questions.length ? (
          <StyledOl>
            {quiz.questions.map((question, index) => (
              <QuestionContainer key={question.id}>
                <Text textStyle="label.medium" fontWeight="bold">
                  {t("myNdla.quiz.form.questionNumber", { number: index + 1 })}
                </Text>
                <Text>{question.title}</Text>
                <AlternativeList>
                  {question.alternatives.map((alternative) => (
                    <li key={alternative.id}>
                      <Text>{alternative.text}</Text>
                    </li>
                  ))}
                </AlternativeList>
              </QuestionContainer>
            ))}
          </StyledOl>
        ) : (
          <Text textStyle="label.medium" fontWeight="light">
            {t("myNdla.quiz.noQuestions")}
          </Text>
        )}
      </main>
    </StyledPageContainer>
  );
};

export const Component = PlainQuizPage;

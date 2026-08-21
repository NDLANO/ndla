/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from "@apollo/client/react";
import { CheckLine } from "@ndla/icons";
import { Text } from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { MyNdlaTitle } from "../../../components/MyNdla/MyNdlaTitle";
import { PageRainbowSpinner } from "../../../components/PageSpinner";
import { PageTitle } from "../../../components/PageTitle";
import { quizQuery } from "../../../mutations/quiz/quizQueries";
import { routes } from "../../../routeHelpers";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { MyNdlaPageContent, MyNdlaPageSection } from "../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../components/MyNdlaPageWrapper";

export const Component = () => {
  return <PrivateRoute element={<QuizViewPage />} />;
};

const StyledOl = styled("ol", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
    width: "100%",
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

const AlternativeItem = styled("li", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "3xsmall",
  },
});

export const QuizViewPage = () => {
  const { t } = useTranslation();
  const { quizId } = useParams();
  const { data, loading } = useQuery(quizQuery, {
    variables: { id: quizId ?? "" },
    skip: !quizId,
  });

  const quiz = data?.quiz;

  return (
    <MyNdlaPageWrapper>
      <PageTitle title={t("htmlTitles.quizViewPage")} useLocationForCustomPath={true} />
      <MyNdlaPageContent>
        <SafeLinkButton to={routes.myNdla.quiz} variant="tertiary" size="small">
          {t("myNdla.quiz.backToList")}
        </SafeLinkButton>
      </MyNdlaPageContent>
      {loading ? (
        <MyNdlaPageContent>
          <PageRainbowSpinner />
        </MyNdlaPageContent>
      ) : quiz ? (
        <>
          <MyNdlaPageContent>
            <MyNdlaTitle title={quiz.title} />
            {!!quiz.description && <Text>{quiz.description}</Text>}
            <SafeLinkButton to={routes.myNdla.quizEdit(quiz.id)} variant="secondary" size="small">
              {t("myNdla.quiz.edit")}
            </SafeLinkButton>
          </MyNdlaPageContent>
          <MyNdlaPageSection>
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
                        <AlternativeItem key={alternative.id}>
                          {alternative.isCorrect ? (
                            <CheckLine aria-label={t("myNdla.quiz.correctAnswer")} title={t("myNdla.quiz.correctAnswer")} />
                          ) : null}
                          <Text>{alternative.text}</Text>
                        </AlternativeItem>
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
          </MyNdlaPageSection>
        </>
      ) : null}
    </MyNdlaPageWrapper>
  );
};

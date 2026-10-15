/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSuspenseQuery } from "@apollo/client/react";
import { Heading, Text } from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { MyNdlaTitle } from "../../../components/MyNdla/MyNdlaTitle";
import { PageRainbowSpinner } from "../../../components/PageSpinner";
import { PageTitle } from "../../../components/PageTitle";
import type { GQLQuizSummaryFragment } from "../../../graphqlTypes";
import { quizzesQuery, savedQuizzesQuery } from "../../../mutations/quiz/quizQueries";
import { routes } from "../../../routeHelpers";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { MyNdlaPageContent, MyNdlaPageSection } from "../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../components/MyNdlaPageWrapper";
import { SettingsMenu } from "../components/SettingsMenu";
import { QuizItem } from "./components/QuizItem";
import { useQuizActionHooks, useSavedQuizActionHooks } from "./components/useQuizActionHooks";

const Component = () => {
  return <PrivateRoute element={<QuizPage />} />;
};

const StyledOl = styled("ol", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
    width: "100%",
    listStyle: "none",
  },
});

const StyledSafeLinkButton = styled(SafeLinkButton, {
  base: {
    alignSelf: "flex-start",
  },
});

export const QuizPage = () => {
  const { t } = useTranslation();

  return (
    <MyNdlaPageWrapper>
      <PageTitle title={t("htmlTitles.quizPage")} useLocationForCustomPath={true} />
      <MyNdlaPageContent quiz={true}>
        <MyNdlaTitle title={t("myNdla.quiz.title")} />
        <Text>{t("myNdla.quiz.description")}</Text>
      </MyNdlaPageContent>
      <MyNdlaPageSection>
        <StyledSafeLinkButton to={routes.myNdla.quizNew} variant="secondary" size="small">
          {t("myNdla.quiz.newQuiz")}
        </StyledSafeLinkButton>
        <Suspense fallback={<PageRainbowSpinner />}>
          <QuizList />
        </Suspense>
      </MyNdlaPageSection>
      <MyNdlaPageSection>
        <Heading textStyle="heading.small" asChild consumeCss>
          <h2>{t("myNdla.quiz.savedQuizzes.title")}</h2>
        </Heading>
        <Suspense fallback={<PageRainbowSpinner />}>
          <SavedQuizList />
        </Suspense>
      </MyNdlaPageSection>
    </MyNdlaPageWrapper>
  );
};

const QuizList = () => {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(quizzesQuery);

  if (!data?.quizzes.results.length) {
    return (
      <Text textStyle="label.medium" fontWeight="light">
        {t("myNdla.quiz.noQuiz")}
      </Text>
    );
  }

  return (
    <StyledOl>
      {data.quizzes.results.map((quiz) => (
        <QuizListItem quiz={quiz} key={quiz.id} />
      ))}
    </StyledOl>
  );
};

const SavedQuizList = () => {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(savedQuizzesQuery);

  if (!data?.savedQuizzes.length) {
    return (
      <Text textStyle="label.medium" fontWeight="light">
        {t("myNdla.quiz.savedQuizzes.empty")}
      </Text>
    );
  }

  return (
    <StyledOl>
      {data.savedQuizzes.map((quiz) => (
        <SavedQuizListItem quiz={quiz} key={quiz.id} />
      ))}
    </StyledOl>
  );
};

interface QuizListItemProps {
  quiz: GQLQuizSummaryFragment;
}

const QuizListItem = ({ quiz }: QuizListItemProps) => {
  const menuItems = useQuizActionHooks(quiz);
  return <QuizItem quiz={quiz} menu={<SettingsMenu menuItems={menuItems} />} context="list" />;
};

const SavedQuizListItem = ({ quiz }: QuizListItemProps) => {
  const menuItems = useSavedQuizActionHooks(quiz);
  return (
    <QuizItem quiz={quiz} menu={<SettingsMenu menuItems={menuItems} />} context="list" to={routes.quiz(quiz.id)} />
  );
};

export default Component;

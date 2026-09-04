/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from "@apollo/client/react";
import { Text } from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { MyNdlaTitle } from "../../../components/MyNdla/MyNdlaTitle";
import { PageRainbowSpinner } from "../../../components/PageSpinner";
import { PageTitle } from "../../../components/PageTitle";
import type { GQLQuizFragment } from "../../../graphqlTypes";
import { quizzesQuery } from "../../../mutations/quiz/quizQueries";
import { routes } from "../../../routeHelpers";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { MyNdlaPageContent, MyNdlaPageSection } from "../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../components/MyNdlaPageWrapper";
import { SettingsMenu } from "../components/SettingsMenu";
import { QuizItem } from "./components/QuizItem";
import { useQuizActionHooks } from "./components/useQuizActionHooks";

export const Component = () => {
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
  const { data, loading } = useQuery(quizzesQuery, { fetchPolicy: "cache-and-network" });

  return (
    <MyNdlaPageWrapper>
      <PageTitle title={t("htmlTitles.quizPage")} useLocationForCustomPath={true} />
      <MyNdlaPageContent>
        <MyNdlaTitle title={t("myNdla.quiz.title")} />
        <Text>{t("myNdla.quiz.description")}</Text>
      </MyNdlaPageContent>
      <MyNdlaPageSection>
        <StyledSafeLinkButton to={routes.myNdla.quizNew} variant="secondary" size="small">
          {t("myNdla.quiz.newQuiz")}
        </StyledSafeLinkButton>
        {loading ? (
          <PageRainbowSpinner />
        ) : data?.quizzes.results.length ? (
          <StyledOl>
            {data.quizzes.results.map((quiz) => (
              <QuizListItem quiz={quiz} key={quiz.id} />
            ))}
          </StyledOl>
        ) : (
          <Text textStyle="label.medium" fontWeight="light">
            {t("myNdla.quiz.noQuiz")}
          </Text>
        )}
      </MyNdlaPageSection>
    </MyNdlaPageWrapper>
  );
};

interface QuizListItemProps {
  quiz: GQLQuizFragment;
}

const QuizListItem = ({ quiz }: QuizListItemProps) => {
  const menuItems = useQuizActionHooks(quiz);
  return <QuizItem quiz={quiz} menu={<SettingsMenu menuItems={menuItems} />} context="list" />;
};

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from "@apollo/client/react";
import { DeleteBinLine } from "@ndla/icons";
import { IconButton, Text } from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { MyNdlaTitle } from "../../../components/MyNdla/MyNdlaTitle";
import { PageRainbowSpinner } from "../../../components/PageSpinner";
import { PageTitle } from "../../../components/PageTitle";
import { useToast } from "../../../components/ToastContext";
import { GQLQuizFragment } from "../../../graphqlTypes";
import { useDeleteQuizMutation } from "../../../mutations/quiz/quizMutations";
import { quizzesQuery } from "../../../mutations/quiz/quizQueries";
import { routes } from "../../../routeHelpers";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { MyNdlaPageContent, MyNdlaPageSection } from "../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../components/MyNdlaPageWrapper";

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

const QuizListItemContainer = styled("li", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "small",
    padding: "small",
    borderRadius: "xsmall",
    border: "1px solid",
    borderColor: "stroke.subtle",
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
        <SafeLinkButton to={routes.myNdla.quizNew} variant="secondary" size="small">
          {t("myNdla.quiz.newQuiz")}
        </SafeLinkButton>
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
  const { t } = useTranslation();
  const toast = useToast();
  const [deleteQuiz] = useDeleteQuizMutation();

  const onDelete = async () => {
    const res = await deleteQuiz({ variables: { id: quiz.id } });
    if (res.data?.deleteQuiz) {
      toast.create({ title: t("myNdla.quiz.toast.deleted", { title: quiz.title }) });
    } else {
      toast.create({ title: t("myNdla.quiz.toast.deletedFailed") });
    }
  };

  return (
    <QuizListItemContainer>
      <div>
        <Text textStyle="label.large" fontWeight="bold">
          {quiz.title}
        </Text>
        <Text textStyle="label.small">{t("myNdla.quiz.questionCount", { count: quiz.questions.length })}</Text>
      </div>
      <IconButton
        aria-label={t("myNdla.quiz.delete")}
        title={t("myNdla.quiz.delete")}
        variant="tertiary"
        size="small"
        onClick={onDelete}
      >
        <DeleteBinLine />
      </IconButton>
    </QuizListItemContainer>
  );
};

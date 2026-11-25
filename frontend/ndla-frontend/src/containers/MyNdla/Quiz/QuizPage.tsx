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
import { startTransition, Suspense, useContext } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../../components/AuthenticationContext";
import { MyNdlaTitle } from "../../../components/MyNdla/MyNdlaTitle";
import { PageRainbowSpinner } from "../../../components/PageSpinner";
import { PageTitle } from "../../../components/PageTitle";
import type { GQLQuizSummaryFragment } from "../../../graphqlTypes";
import { quizzesQuery, savedQuizzesQuery } from "../../../mutations/quiz/quizQueries";
import { routes } from "../../../routeHelpers";
import { useStableSearchParams } from "../../../util/useStableSearchParams";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { MyNdlaPageContent, MyNdlaPageSection } from "../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../components/MyNdlaPageWrapper";
import { SettingsMenu } from "../components/SettingsMenu";
import { QuizItem } from "./components/QuizItem";
import { QuizPagination } from "./components/QuizPagination";
import { parseQuizSort, QUIZ_SORT_LAST_ADDED, QuizSortSelect } from "./components/QuizSortSelect";
import { useQuizActionHooks, useSavedQuizActionHooks } from "./components/useQuizActionHooks";

const Component = () => {
  return <PrivateRoute element={<QuizPage />} />;
};

const QUIZ_PAGE_SIZE = 10;
const SAVED_QUIZZES_HEADING_ID = "saved-quizzes-heading";

const StyledOl = styled("ol", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
    width: "full",
    listStyle: "none",
  },
});

const StyledSafeLinkButton = styled(SafeLinkButton, {
  base: {
    alignSelf: "flex-start",
  },
});

const parsePage = (value: string | null) => Math.max(1, parseInt(value ?? "") || 1);

export const QuizPage = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === "employee";

  return (
    <MyNdlaPageWrapper>
      <PageTitle title={t("htmlTitles.quizPage")} useLocationForCustomPath={true} />
      <MyNdlaPageContent quiz={true}>
        <MyNdlaTitle title={t("myNdla.quiz.title")} />
        <Text>{isTeacher ? t("myNdla.quiz.description") : t("myNdla.quiz.descriptionStudent")}</Text>
      </MyNdlaPageContent>
      {!!isTeacher && (
        <MyNdlaPageSection>
          <StyledSafeLinkButton to={routes.myNdla.quizNew} variant="secondary" size="small">
            {t("myNdla.quiz.newQuiz")}
          </StyledSafeLinkButton>
          <Suspense fallback={<PageRainbowSpinner />}>
            <QuizList />
          </Suspense>
        </MyNdlaPageSection>
      )}
      <MyNdlaPageSection>
        <Heading textStyle="heading.small" asChild consumeCss id={SAVED_QUIZZES_HEADING_ID}>
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
  const [searchParams, setSearchParams] = useStableSearchParams();
  const page = parsePage(searchParams.get("page"));
  const sort = parseQuizSort(searchParams.get("sort"));
  const { data } = useSuspenseQuery(quizzesQuery, { variables: { page, pageSize: QUIZ_PAGE_SIZE, sort } });

  const quizzes = data?.quizzes.results ?? [];
  const totalCount = data?.quizzes.totalCount ?? 0;

  if (!totalCount) {
    return (
      <Text textStyle="label.medium" fontWeight="light">
        {t("myNdla.quiz.noQuiz")}
      </Text>
    );
  }

  // Keep the current list on screen while the next one loads instead of suspending to a spinner.
  const onPageChange = (newPage: number) =>
    startTransition(() => setSearchParams({ page: newPage.toString() }, { preventScrollReset: true }));
  const onSortChange = (newSort: string) =>
    startTransition(() =>
      setSearchParams(
        { sort: newSort === QUIZ_SORT_LAST_ADDED ? null : newSort, page: null },
        { preventScrollReset: true },
      ),
    );

  return (
    <>
      <QuizSortSelect value={sort} onChange={onSortChange} />
      <StyledOl>
        {quizzes.map((quiz) => (
          <QuizListItem quiz={quiz} key={quiz.id} />
        ))}
      </StyledOl>
      <QuizPagination
        page={page}
        count={totalCount}
        pageSize={QUIZ_PAGE_SIZE}
        onPageChange={onPageChange}
        aria-label={t("myNdla.quiz.pagination")}
      />
    </>
  );
};

const SavedQuizList = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useStableSearchParams();
  const page = parsePage(searchParams.get("savedPage"));
  const sort = parseQuizSort(searchParams.get("savedSort"));
  const { data } = useSuspenseQuery(savedQuizzesQuery, { variables: { page, pageSize: QUIZ_PAGE_SIZE, sort } });

  const quizzes = data?.savedQuizzes.results ?? [];
  const totalCount = data?.savedQuizzes.totalCount ?? 0;

  if (!totalCount) {
    return (
      <Text textStyle="label.medium" fontWeight="light">
        {t("myNdla.quiz.savedQuizzes.empty")}
      </Text>
    );
  }

  const onPageChange = (newPage: number) =>
    startTransition(() => setSearchParams({ savedPage: newPage.toString() }, { preventScrollReset: true }));
  const onSortChange = (newSort: string) =>
    startTransition(() =>
      setSearchParams(
        { savedSort: newSort === QUIZ_SORT_LAST_ADDED ? null : newSort, savedPage: null },
        { preventScrollReset: true },
      ),
    );

  return (
    <>
      <QuizSortSelect value={sort} onChange={onSortChange} />
      <StyledOl aria-labelledby={SAVED_QUIZZES_HEADING_ID}>
        {quizzes.map((quiz) => (
          <SavedQuizListItem quiz={quiz} key={quiz.id} />
        ))}
      </StyledOl>
      <QuizPagination
        page={page}
        count={totalCount}
        pageSize={QUIZ_PAGE_SIZE}
        onPageChange={onPageChange}
        aria-label={t("myNdla.quiz.savedQuizzes.pagination")}
      />
    </>
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
    <QuizItem
      quiz={quiz}
      menu={<SettingsMenu menuItems={menuItems} />}
      context="list"
      to={routes.quiz(quiz.id)}
      showAuthor
    />
  );
};

export default Component;

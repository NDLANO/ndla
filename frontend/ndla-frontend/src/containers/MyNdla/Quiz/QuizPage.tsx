/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSuspenseQuery } from "@apollo/client/react";
import { ArrowLeftShortLine, ArrowRightShortLine } from "@ndla/icons";
import {
  Button,
  Heading,
  PaginationContext,
  PaginationEllipsis,
  PaginationItem,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
  Text,
} from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { usePaginationTranslations } from "@ndla/ui";
import { startTransition, Suspense } from "react";
import { useTranslation } from "react-i18next";
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
import { useQuizActionHooks, useSavedQuizActionHooks } from "./components/useQuizActionHooks";

const Component = () => {
  return <PrivateRoute element={<QuizPage />} />;
};

const StyledOl = styled("ol", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
    width: "full",
    listStyle: "none",
  },
});

const StyledPaginationButton = styled(Button, {
  base: {
    tabletDown: {
      "& span": {
        display: "none",
      },
    },
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

const QUIZ_PAGE_SIZE = 10;

const QuizList = () => {
  const { t } = useTranslation();
  const paginationTranslations = usePaginationTranslations();
  const [searchParams, setSearchParams] = useStableSearchParams();
  const page = parseInt(searchParams.get("page") ?? "") || 1;
  const { data } = useSuspenseQuery(quizzesQuery, { variables: { page, pageSize: QUIZ_PAGE_SIZE } });

  const quizzes = data?.quizzes.results ?? [];
  const totalCount = data?.quizzes.totalCount ?? 0;
  const lastPage = Math.max(1, Math.ceil(totalCount / QUIZ_PAGE_SIZE));

  if (!totalCount) {
    return (
      <Text textStyle="label.medium" fontWeight="light">
        {t("myNdla.quiz.noQuiz")}
      </Text>
    );
  }

  // Keep the current page on screen while the next one loads instead of suspending to a spinner.
  const onPageChange = (newPage: number) => startTransition(() => setSearchParams({ page: newPage.toString() }));

  return (
    <>
      <StyledOl>
        {quizzes.map((quiz) => (
          <QuizListItem quiz={quiz} key={quiz.id} />
        ))}
      </StyledOl>
      {(totalCount > QUIZ_PAGE_SIZE || page > 1) && (
        <PaginationRoot
          page={page}
          onPageChange={(details) => onPageChange(details.page)}
          count={totalCount}
          pageSize={QUIZ_PAGE_SIZE}
          translations={paginationTranslations}
          siblingCount={1}
          aria-label={t("myNdla.quiz.pagination")}
        >
          {page > 1 && (
            <PaginationPrevTrigger asChild>
              <StyledPaginationButton variant="tertiary" aria-label={t("pagination.prev")} title={t("pagination.prev")}>
                <ArrowLeftShortLine />
                <span>{t("pagination.prev")}</span>
              </StyledPaginationButton>
            </PaginationPrevTrigger>
          )}
          <PaginationContext>
            {(pagination) =>
              pagination.pages.map((p, index) =>
                p.type === "page" ? (
                  <PaginationItem key={index} {...p} asChild>
                    <Button variant={p.value === pagination.page ? "primary" : "tertiary"}>{p.value}</Button>
                  </PaginationItem>
                ) : (
                  <PaginationEllipsis key={index} index={index} asChild>
                    <Text asChild consumeCss>
                      <div>&#8230;</div>
                    </Text>
                  </PaginationEllipsis>
                ),
              )
            }
          </PaginationContext>
          {page < lastPage && (
            <PaginationNextTrigger asChild>
              <StyledPaginationButton variant="tertiary" aria-label={t("pagination.next")} title={t("pagination.next")}>
                <span>{t("pagination.next")}</span>
                <ArrowRightShortLine />
              </StyledPaginationButton>
            </PaginationNextTrigger>
          )}
        </PaginationRoot>
      )}
    </>
  );
};

const SavedQuizList = () => {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(savedQuizzesQuery);

  const saved = data?.savedQuizzes ?? [];
  if (!saved.length) {
    return (
      <Text textStyle="label.medium" fontWeight="light">
        {t("myNdla.quiz.savedQuizzes.empty")}
      </Text>
    );
  }

  return (
    <StyledOl>
      {saved.map((quiz) => (
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

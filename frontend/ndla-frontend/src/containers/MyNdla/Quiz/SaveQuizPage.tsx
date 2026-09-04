/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from "@apollo/client/react";
import { Button, DialogRoot, Heading, Text } from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { type MouseEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { DefaultErrorMessagePage } from "../../../components/DefaultErrorMessage";
import { MyNdlaBreadcrumb } from "../../../components/MyNdla/MyNdlaBreadcrumb";
import { MyNdlaTitle } from "../../../components/MyNdla/MyNdlaTitle";
import { PageRainbowSpinner } from "../../../components/PageSpinner";
import { PageTitle } from "../../../components/PageTitle";
import { useToast } from "../../../components/ToastContext";
import { useUpdateQuizStatusMutation } from "../../../mutations/quiz/quizMutations";
import { quizQuery } from "../../../mutations/quiz/quizQueries";
import { routes } from "../../../routeHelpers";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { MyNdlaPageContent } from "../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../components/MyNdlaPageWrapper";
import { QuizItem } from "./components/QuizItem";
import { QuizShareDialogContent } from "./components/QuizShareDialogContent";
import { QuizShareLink } from "./components/QuizShareLink";
import { QuizFormButtonContainer } from "./QuizFormButtonContainer";
import { QUIZ_PRIVATE, QUIZ_PUBLIC } from "./utils";

export const Component = () => {
  return <PrivateRoute element={<SaveQuizPage />} />;
};

const TextWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

const ButtonGroup = styled("div", {
  base: {
    display: "flex",
    gap: "xsmall",
  },
});

export const SaveQuizPage = () => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { quizId } = useParams();

  const { data, loading } = useQuery(quizQuery, { variables: { id: quizId ?? "" }, skip: !quizId });
  const [updateQuizStatus] = useUpdateQuizStatusMutation();

  if (loading) {
    return (
      <MyNdlaPageWrapper>
        <MyNdlaPageContent>
          <PageRainbowSpinner />
        </MyNdlaPageContent>
      </MyNdlaPageWrapper>
    );
  }

  if (!data?.quiz) {
    return <DefaultErrorMessagePage />;
  }

  const quiz = data.quiz;
  const isShared = !open && quiz.status === QUIZ_PUBLIC;

  const onUnshare = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const res = await updateQuizStatus({ variables: { id: quiz.id, status: QUIZ_PRIVATE } });
    if (!res.error) {
      toast.create({ title: t("myNdla.quiz.toast.unshared", { title: quiz.title }) });
    } else {
      toast.create({ title: t("myNdla.quiz.toast.unshareFailed") });
    }
  };

  const onSaveAndClose = () => {
    navigate(routes.myNdla.quiz);
  };

  const onShare = async () => {
    const res = await updateQuizStatus({ variables: { id: quiz.id, status: QUIZ_PUBLIC } });
    if (!res.error) {
      toast.create({ title: t("myNdla.quiz.toast.shared", { title: quiz.title }) });
      setOpen(true);
    } else {
      toast.create({ title: t("myNdla.quiz.toast.sharedFailed") });
    }
  };

  return (
    <MyNdlaPageWrapper>
      <PageTitle title={t("htmlTitles.quizSavePage")} useLocationForCustomPath={true} />
      <MyNdlaPageContent>
        <MyNdlaBreadcrumb breadcrumbs={[{ id: `save-${quiz.id}`, name: quiz.title }]} page="quiz" />
        <MyNdlaTitle title={quiz.title} />
      </MyNdlaPageContent>
      <MyNdlaPageContent>
        <TextWrapper>
          <Heading textStyle="heading.small" asChild consumeCss>
            <h2>{t("myNdla.quiz.saveQuiz.pageHeading")}</h2>
          </Heading>
          <Text>{t("myNdla.quiz.saveQuiz.pageDescription")}</Text>
        </TextWrapper>
        <QuizItem quiz={quiz} context="standalone" />
      </MyNdlaPageContent>
      {isShared ? (
        <MyNdlaPageContent>
          <QuizShareLink quiz={quiz} />
        </MyNdlaPageContent>
      ) : null}
      <MyNdlaPageContent>
        <QuizFormButtonContainer>
          <SafeLinkButton variant="secondary" to={routes.myNdla.quizEdit(quiz.id)}>
            {t("myNdla.quiz.form.back")}
          </SafeLinkButton>
          <ButtonGroup>
            <Button variant="secondary" onClick={onSaveAndClose}>
              {t("myNdla.quiz.saveQuiz.saveAndClose")}
            </Button>
            <Button variant={isShared ? "danger" : "primary"} onClick={isShared ? onUnshare : onShare} ref={buttonRef}>
              {isShared ? t("myNdla.quiz.form.unshare") : t("myNdla.quiz.form.share")}
            </Button>
          </ButtonGroup>
          <DialogRoot
            open={open}
            onOpenChange={(details) => setOpen(details.open)}
            finalFocusEl={() => buttonRef.current}
          >
            <QuizShareDialogContent quiz={quiz} onClose={() => setOpen(false)} />
          </DialogRoot>
        </QuizFormButtonContainer>
      </MyNdlaPageContent>
    </MyNdlaPageWrapper>
  );
};

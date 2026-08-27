/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from "@apollo/client/react";
import { Button, FieldInput, FieldRoot, Heading, Text } from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { DefaultErrorMessagePage } from "../../../components/DefaultErrorMessage";
import { MyNdlaBreadcrumb } from "../../../components/MyNdla/MyNdlaBreadcrumb";
import { MyNdlaTitle } from "../../../components/MyNdla/MyNdlaTitle";
import { PageRainbowSpinner } from "../../../components/PageSpinner";
import { PageTitle } from "../../../components/PageTitle";
import { useToast } from "../../../components/ToastContext";
import { useUpdateQuizMutation } from "../../../mutations/quiz/quizMutations";
import { quizQuery } from "../../../mutations/quiz/quizQueries";
import { routes } from "../../../routeHelpers";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { FieldLength } from "../components/FieldLength";
import { MyNdlaPageContent } from "../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../components/MyNdlaPageWrapper";
import { QuizStepper } from "./components/QuizStepper";
import { QuizToggleGroup } from "./components/QuizToggleGroup";
import { QuizFormButtonContainer } from "./QuizFormButtonContainer";

const MAX_NAME_LENGTH = 66;
const QUESTION_COUNT_OPTIONS = ["5", "10", "15", "20"] as const;

export const Component = () => {
  return <PrivateRoute element={<ReviewQuizPage />} />;
};

const TextWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

const Panel = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
    backgroundColor: "background.default",
    borderRadius: "xsmall",
    boxShadow: "xsmall",
    padding: "small",
  },
});

const SettingRow = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3xsmall",
    tabletWide: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  },
});

export const ReviewQuizPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { quizId } = useParams();

  const { data, loading } = useQuery(quizQuery, { variables: { id: quizId ?? "" }, skip: !quizId });

  const [title, setTitle] = useState<string | undefined>(undefined);
  const [randomOrder, setRandomOrder] = useState<boolean | undefined>(undefined);
  const [randomSubset, setRandomSubset] = useState(false);
  const [questionCount, setQuestionCount] = useState<(typeof QUESTION_COUNT_OPTIONS)[number]>("10");
  const [saving, setSaving] = useState(false);

  const [updateQuiz] = useUpdateQuizMutation();

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
  const currentTitle = title ?? quiz.title;
  const currentRandomOrder = randomOrder ?? quiz.randomOrder;

  const onNext = async () => {
    if (currentTitle === quiz.title && currentRandomOrder === quiz.randomOrder) {
      navigate(routes.myNdla.quizSave(quiz.id));
      return;
    }
    setSaving(true);
    const res = await updateQuiz({
      variables: { id: quiz.id, revision: quiz.revision, title: currentTitle, randomOrder: currentRandomOrder },
    });
    setSaving(false);
    if (!res.error) {
      navigate(routes.myNdla.quizSave(quiz.id));
    } else {
      toast.create({ title: t("myNdla.quiz.toast.updatedFailed") });
    }
  };

  return (
    <MyNdlaPageWrapper>
      <PageTitle title={t("htmlTitles.quizReviewPage")} useLocationForCustomPath={true} />
      <MyNdlaPageContent>
        <MyNdlaBreadcrumb breadcrumbs={[{ id: `review-${quiz.id}`, name: quiz.title }]} page="quiz" />
        <MyNdlaTitle title={quiz.title} />
        <QuizStepper step="review" quizId={quiz.id} />
      </MyNdlaPageContent>
      <MyNdlaPageContent>
        <TextWrapper>
          <Heading textStyle="heading.small" asChild consumeCss>
            <h2>{t("myNdla.quiz.review.pageHeading")}</h2>
          </Heading>
          <Text>{t("myNdla.quiz.review.pageDescription")}</Text>
        </TextWrapper>
        <FieldRoot>
          <Text fontWeight="bold" textStyle="label.large">
            {t("myNdla.quiz.review.nameLabel")}
          </Text>
          <FieldInput
            value={currentTitle}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />
          <FieldLength value={currentTitle.length} maxLength={MAX_NAME_LENGTH} />
        </FieldRoot>
        <Panel>
          <Heading textStyle="heading.small" asChild consumeCss>
            <h3>{t("myNdla.quiz.review.settingsTitle")}</h3>
          </Heading>
          <Text textStyle="label.small">{t("myNdla.quiz.review.settingsDescription")}</Text>
          <SettingRow>
            <Text fontWeight="bold" textStyle="label.medium">
              {t("myNdla.quiz.review.randomOrder")}
            </Text>
            <QuizToggleGroup
              value={currentRandomOrder ? "yes" : "no"}
              onChange={(value) => setRandomOrder(value === "yes")}
              options={[
                { value: "yes", label: t("myNdla.quiz.form.settings.yes") },
                { value: "no", label: t("myNdla.quiz.form.settings.no") },
              ]}
            />
          </SettingRow>
          <SettingRow>
            <Text fontWeight="bold" textStyle="label.medium">
              {t("myNdla.quiz.review.randomSubset")}
            </Text>
            <QuizToggleGroup
              value={randomSubset ? "yes" : "no"}
              onChange={(value) => setRandomSubset(value === "yes")}
              options={[
                { value: "yes", label: t("myNdla.quiz.form.settings.yes") },
                { value: "no", label: t("myNdla.quiz.form.settings.no") },
              ]}
            />
          </SettingRow>
          <SettingRow>
            <Text fontWeight="bold" textStyle="label.medium">
              {t("myNdla.quiz.review.questionCount")}
            </Text>
            <QuizToggleGroup
              value={questionCount}
              onChange={setQuestionCount}
              disabled={!randomSubset}
              options={QUESTION_COUNT_OPTIONS.map((count) => ({ value: count, label: count }))}
            />
          </SettingRow>
        </Panel>
      </MyNdlaPageContent>
      <MyNdlaPageContent>
        <QuizFormButtonContainer>
          <SafeLinkButton variant="secondary" to={routes.myNdla.quizEdit(quiz.id)}>
            {t("myNdla.quiz.form.back")}
          </SafeLinkButton>
          <Button onClick={onNext} disabled={saving}>
            {t("myNdla.quiz.form.next")}
          </Button>
        </QuizFormButtonContainer>
      </MyNdlaPageContent>
    </MyNdlaPageWrapper>
  );
};

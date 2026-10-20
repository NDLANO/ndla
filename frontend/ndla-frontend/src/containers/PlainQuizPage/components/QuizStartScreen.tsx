/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSuspenseQuery } from "@apollo/client/react";
import { KvissLine, QuestionLine, TimeLine } from "@ndla/icons";
import { Button, Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { Suspense, useContext } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../../components/AuthenticationContext";
import { MyNdlaTitle } from "../../../components/MyNdla/MyNdlaTitle";
import { useToast } from "../../../components/ToastContext";
import type { GQLQuizFragment, GQLQuizQuery } from "../../../graphqlTypes";
import { useSaveQuizMutation, useUnsaveQuizMutation } from "../../../mutations/quiz/quizMutations";
import { savedQuizzesQuery } from "../../../mutations/quiz/quizQueries";
import { estimateQuizMinutes } from "../../MyNdla/Quiz/utils";
import { CopyQuiz } from "./CopyQuiz";

const Wrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    width: "full",
    maxWidth: "surface.pageMax",
  },
});

const Card = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "small",
    width: "full",
    padding: "medium",
    borderRadius: "large",
    backgroundColor: "surface.brand.3.subtle",
    textAlign: "center",
    boxShadow: "xsmall",
  },
});

const AvatarBox = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    width: "xxlarge",
    height: "xxlarge",
    color: "text.strong",
    "& > svg": {
      borderRadius: "small",
      backgroundColor: "background.default",
      animation: "var(--animations-quiz-logo-spin)",
      _motionReduce: {
        animation: "[none]",
      },
    },
  },
});

const MetaRow = styled("div", {
  base: {
    display: "flex",
    gap: "small",
    width: "full",
  },
});

const MetaItem = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3xsmall",
    flex: "1",
    minWidth: "0",
    padding: "small",
    backgroundColor: "background.default",
    borderRadius: "medium",
    boxShadow: "xsmall",
  },
});

const MetaLabel = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "3xsmall",
    color: "text.subtle",
  },
});

const InfoBox = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    width: "full",
    padding: "small",
    backgroundColor: "background.default",
    borderRadius: "medium",
    boxShadow: "xsmall",
  },
});

const InfoList = styled("ul", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3xsmall",
    margin: "0",
    paddingInlineStart: "medium",
    listStyleType: "disc",
  },
});

const StartButtonRow = styled("div", {
  base: {
    display: "flex",
    justifyContent: "center",
    width: "full",
  },
});

const StartButton = styled(Button, {
  base: {
    paddingInline: "large",
    width: "100",
  },
});

const ButtonRow = styled("div", {
  base: {
    display: "flex",
    gap: "medium",
    flexWrap: "wrap",
  },
});

interface Props {
  quiz: GQLQuizQuery["quiz"];
  questionCount: number;
  onStart: () => void;
}

export const QuizStartScreen = ({ quiz, questionCount, onStart }: Props) => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const estimatedMinutes = estimateQuizMinutes(quiz);

  return (
    <Wrapper>
      <Card>
        <AvatarBox>
          <KvissLine size="large" />
        </AvatarBox>
        <MyNdlaTitle title={quiz.title} />
        <Text textStyle="label.small" color="text.subtle">
          {t("myNdla.quiz.take.sharedBy", {
            sharedBy: quiz.owner?.name ?? t("myNdla.quiz.take.sharedByFallback"),
            interpolation: { escapeValue: false },
          })}
        </Text>
      </Card>
      {!!quiz.description && <Text>{quiz.description}</Text>}
      <MetaRow>
        <MetaItem>
          <MetaLabel>
            <QuestionLine size="small" />
            <Text textStyle="label.small">{t("myNdla.quiz.form.tabs.questions")}</Text>
          </MetaLabel>
          <Text textStyle="label.medium" fontWeight="bold">
            {t("myNdla.quiz.questionCount", { count: questionCount })}
          </Text>
        </MetaItem>
        {!!estimatedMinutes && (
          <MetaItem>
            <MetaLabel>
              <TimeLine size="small" />
              <Text textStyle="label.small">{t("myNdla.quiz.take.estimatedLabel")}</Text>
            </MetaLabel>
            <Text textStyle="label.medium" fontWeight="bold">
              {t("myNdla.quiz.take.estimatedMinutes", {
                count: estimatedMinutes,
              })}
            </Text>
          </MetaItem>
        )}
      </MetaRow>
      <InfoBox>
        <Text textStyle="label.medium" fontWeight="bold">
          {t("myNdla.quiz.take.beforeStart.title")}
        </Text>
        <InfoList>
          <li>
            <Text textStyle="label.small">{t("myNdla.quiz.take.beforeStart.selectAnswer")}</Text>
          </li>
          <li>
            <Text textStyle="label.small">{t("myNdla.quiz.take.beforeStart.retry")}</Text>
          </li>
        </InfoList>
      </InfoBox>
      <StartButtonRow>
        <StartButton onClick={onStart}>{t("myNdla.quiz.take.start")}</StartButton>
      </StartButtonRow>
      {user?.role === "employee" && (
        <ButtonRow>
          <CopyQuiz quizId={quiz.id} />
          <Suspense
            fallback={
              <Button variant="tertiary" loading>
                {t("myNdla.quiz.take.saveQuizLink")}
              </Button>
            }
          >
            <SaveQuizButton quiz={quiz} />
          </Suspense>
        </ButtonRow>
      )}
    </Wrapper>
  );
};

interface SaveQuizButtonProps {
  quiz: GQLQuizFragment;
}

const SaveQuizButton = ({ quiz }: SaveQuizButtonProps) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: savedData } = useSuspenseQuery(savedQuizzesQuery);
  const [saveQuiz, { loading: saving }] = useSaveQuizMutation();
  const [unsaveQuiz, { loading: unsaving }] = useUnsaveQuizMutation();

  if (!savedData?.savedQuizzes) return null;

  const isSaved = savedData.savedQuizzes.some((saved) => saved.id === quiz.id);

  const onToggleSaved = async () => {
    if (isSaved) {
      const res = await unsaveQuiz({ variables: { quizId: quiz.id } }).catch(() => undefined);
      toast.create({
        title: res?.data?.unsaveQuiz
          ? t("myNdla.quiz.toast.unsaved", { title: quiz.title })
          : t("myNdla.quiz.toast.unsaveFailed"),
      });
    } else {
      const res = await saveQuiz({ variables: { quizId: quiz.id } }).catch(() => undefined);
      toast.create({
        title: res?.data?.saveQuiz
          ? t("myNdla.quiz.toast.savedShared", { title: quiz.title })
          : t("myNdla.quiz.toast.savedSharedFailed"),
      });
    }
  };

  return (
    <Button variant="tertiary" onClick={onToggleSaved} loading={saving || unsaving}>
      {isSaved ? t("myNdla.quiz.take.unsaveQuizLink") : t("myNdla.quiz.take.saveQuizLink")}
    </Button>
  );
};

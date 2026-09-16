/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { QuestionLine, QuestionnaireLine, TimeLine } from "@ndla/icons";
import { Button, Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { MyNdlaTitle } from "../../../components/MyNdla/MyNdlaTitle";
import { useToast } from "../../../components/ToastContext";
import type { GQLQuizFragment } from "../../../graphqlTypes";
import {
  copyQuizSharingLink,
  estimateQuizMinutes,
} from "../../MyNdla/Quiz/utils";

const Wrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    width: "100%",
    maxWidth: "surface.pageMax",
  },
});

const Card = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "small",
    width: "100%",
    padding: "large",
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
    borderRadius: "medium",
    border: "2px solid",
    borderColor: "stroke.default",
    backgroundColor: "background.default",
    color: "text.strong",
  },
});

const MetaRow = styled("div", {
  base: {
    display: "flex",
    gap: "small",
    width: "100%",
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
    width: "100%",
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
    width: "100%",
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
  quiz: GQLQuizFragment;
  questionCount: number;
  onStart: () => void;
}

export const QuizStartScreen = ({ quiz, questionCount, onStart }: Props) => {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const estimatedMinutes = estimateQuizMinutes(quiz);

  const onCopyLink = () => {
    copyQuizSharingLink(quiz.id, i18n.language);
    toast.create({ title: t("myNdla.quiz.sharing.copied") });
  };

  return (
    <Wrapper>
      <Card>
        <AvatarBox>
          <QuestionnaireLine size="large" />
        </AvatarBox>
        <MyNdlaTitle title={quiz.title} />
        <Text textStyle="label.small" color="text.subtle">
          {t("myNdla.quiz.take.sharedBy")}
        </Text>
      </Card>
      {!!quiz.description && <Text>{quiz.description}</Text>}
      <MetaRow>
        <MetaItem>
          <MetaLabel>
            <QuestionLine size="small" />
            <Text textStyle="label.small">
              {t("myNdla.quiz.form.tabs.questions")}
            </Text>
          </MetaLabel>
          <Text textStyle="label.medium" fontWeight="bold">
            {t("myNdla.quiz.questionCount", { count: questionCount })}
          </Text>
        </MetaItem>
        {!!estimatedMinutes && (
          <MetaItem>
            <MetaLabel>
              <TimeLine size="small" />
              <Text textStyle="label.small">
                {t("myNdla.quiz.take.estimatedLabel")}
              </Text>
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
            <Text textStyle="label.small">
              {t("myNdla.quiz.take.beforeStart.selectAnswer")}
            </Text>
          </li>
          <li>
            <Text textStyle="label.small">
              {t("myNdla.quiz.take.beforeStart.retry")}
            </Text>
          </li>
        </InfoList>
      </InfoBox>
      <StartButtonRow>
        <StartButton onClick={onStart}>{t("myNdla.quiz.take.start")}</StartButton>
      </StartButtonRow>
      <ButtonRow>
        <Button variant="tertiary" onClick={onCopyLink}>
          {t("myNdla.quiz.take.copyQuiz")}
        </Button>
        <Button variant="tertiary" title={t("myNdla.quiz.take.saveQuizLinkComingSoon")}>
          {t("myNdla.quiz.take.saveQuizLink")}
        </Button>
      </ButtonRow>
    </Wrapper>
  );
};

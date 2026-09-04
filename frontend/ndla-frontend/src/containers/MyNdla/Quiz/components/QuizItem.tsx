/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CheckLine, PencilLine, QuestionnaireLine, UserLine } from "@ndla/icons";
import { ListItemContent, ListItemHeading, ListItemRoot, type ListItemVariantProps, Text } from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { linkOverlay } from "@ndla/styled-system/patterns";
import { toIntlLanguage } from "@ndla/util";
import { Fragment, type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { GQLQuizFragment } from "../../../../graphqlTypes";
import { routes } from "../../../../routeHelpers";
import { QUIZ_IN_PROGRESS, QUIZ_PUBLIC } from "../utils";

const IconWrapper = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    width: "xxlarge",
    height: "xxlarge",
    borderRadius: "xsmall",
    backgroundColor: "surface.success",
    color: "text.onAction",
  },
});

const StatusText = styled(Text, {
  base: {
    display: "flex",
    gap: "xxsmall",
    alignItems: "center",
  },
});

const StyledListItemHeading = styled(ListItemHeading, {
  base: {
    lineClamp: "2",
    overflowWrap: "anywhere",
  },
});

const TimestampText = styled(Text, {
  base: {
    mobileWideDown: {
      display: "none",
    },
  },
});

const MenuWrapper = styled("div", {
  base: {
    position: "relative",
  },
});

interface Props {
  quiz: GQLQuizFragment;
  context?: "list" | "standalone";
  menu?: ReactNode;
}

export const QuizItem = ({ quiz, context, menu, ...rest }: Props & ListItemVariantProps) => {
  const { t, i18n } = useTranslation();

  const MaybeWrapper = context === "list" ? "li" : Fragment;

  const createdString = useMemo(() => {
    const TIME_FORMAT = new Intl.DateTimeFormat(toIntlLanguage(i18n.language));
    const created = TIME_FORMAT.format(new Date(quiz.created));
    return t("myNdla.quiz.created", { created });
  }, [i18n.language, quiz.created, t]);

  return (
    <ListItemRoot {...rest} asChild={context === "list"} consumeCss={context === "list"} css={{ borderStyle: "none" }}>
      <MaybeWrapper>
        <IconWrapper>
          <QuestionnaireLine />
        </IconWrapper>
        <ListItemContent>
          <div>
            <StyledListItemHeading asChild consumeCss css={linkOverlay.raw()}>
              <SafeLink to={routes.myNdla.quizEdit(quiz.id)}>{quiz.title}</SafeLink>
            </StyledListItemHeading>
            <TimestampText textStyle="label.small" color="text.subtle">
              {createdString}
            </TimestampText>
          </div>
          <StatusText textStyle="label.small">
            {quiz.status === QUIZ_IN_PROGRESS ? (
              <PencilLine size="small" />
            ) : quiz.status === QUIZ_PUBLIC ? (
              <UserLine size="small" />
            ) : (
              <CheckLine size="small" />
            )}
            {quiz.status === QUIZ_IN_PROGRESS
              ? t("myNdla.quiz.status.inProgress")
              : quiz.status === QUIZ_PUBLIC
                ? t("myNdla.quiz.status.public")
                : t("myNdla.quiz.status.readyForSharing")}
          </StatusText>
        </ListItemContent>
        {menu ? <MenuWrapper>{menu}</MenuWrapper> : null}
      </MaybeWrapper>
    </ListItemRoot>
  );
};

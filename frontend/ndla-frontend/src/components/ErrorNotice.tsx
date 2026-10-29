/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DeleteBinLine, PenNibLine, TimeLine } from "@ndla/icons";
import { Text } from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { SKIP_TO_CONTENT_ID } from "../constants";
import { GONE, INTERNAL_SERVER_ERROR, NOT_FOUND } from "../statusCodes";

const Wrapper = styled("div", {
  base: {
    // The layout follows the available width rather than the viewport, as it can render next to the My NDLA menu
    containerType: "inline-size",
    // Fills the page layout's minimum height so the background reaches the footer
    minHeight: "[inherit]",
    overflow: "hidden",
    background: "surface.brand.1.subtle",
  },
});

const Content = styled("div", {
  base: {
    display: "grid",
    alignItems: "center",
    gap: "xxlarge",
    maxWidth: "surface.wideMax",
    marginInline: "auto",
    paddingBlock: "xxlarge",
    paddingInline: "small",
    "@/tablet": {
      paddingInline: "medium",
    },
    "@/desktop": {
      gridTemplateColumns: "1fr 1fr",
    },
    "@/wide": {
      paddingInline: "4xlarge",
    },
  },
});

const TextContent = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "medium",
    maxWidth: "surface.contentMax",
  },
});

const UppercaseText = styled(Text, {
  base: {
    textTransform: "uppercase",
  },
});

const Title = styled("h1", {
  base: {
    fontSize: "[clamp(token(fontSizes.4xlarge), 6cqi, 5.5rem)]",
    fontWeight: "semibold",
    lineHeight: "[1.05]",
    textWrap: "balance",
  },
});

const Actions = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    gap: "3xsmall",
    flexDirection: "column",
    alignSelf: "stretch",
    "@/tablet": {
      flexDirection: "row",
      alignSelf: "flex-start",
    },
  },
});

const NoticeCard = styled("div", {
  base: {
    // Lets the status code scale with the card's width
    containerType: "inline-size",
    justifySelf: "center",
    width: "[calc(100% - token(spacing.xxsmall) * 2)]",
    maxWidth: "surface.medium",
    padding: "medium",
    background: "background.default",
    border: "3px solid",
    borderRadius: "small",
    transform: "rotate(3deg)",
    "@/tablet": {
      padding: "xxlarge",
    },
    "@/desktop": {
      maxWidth: "surface.large",
    },
  },
});

const NoticeHeader = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "small",
    paddingBlockEnd: "medium",
    borderBlockEnd: "3px solid",
  },
});

const Stamp = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    width: "4xlarge",
    height: "4xlarge",
    border: "3px dotted",
    // Draws the inner ring
    outline: "2px solid",
    outlineOffset: "-xxsmall",
    borderRadius: "full",
    color: "text.error",
    fontSize: "xxsmall",
    lineHeight: "[1]",
    textTransform: "uppercase",
    animation: "var(--animations-error-notice-stamp)",
    _motionReduce: {
      animation: "[none]",
    },
  },
});

const StampLarge = styled("span", {
  base: {
    fontSize: "large",
  },
});

const StatusCode = styled("p", {
  base: {
    fontSize: "[min(10rem, 45cqi)]",
    fontWeight: "[900]",
    lineHeight: "[1]",
    paddingBlockStart: "small",
  },
});

const NoticeRow = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    columnGap: "medium",
    paddingBlock: "small",
    textStyle: "label.large",
    fontWeight: "semibold",
    "& + &": {
      borderBlockStart: "1px solid",
      borderColor: "stroke.subtle",
    },
    "& dt": {
      textTransform: "uppercase",
    },
  },
});

export const ErrorNoticeMain = styled("main", {
  base: {
    minHeight: "[inherit]",
  },
});

const StyledPen = styled(PenNibLine, {
  base: {
    transform: "rotate(90deg)",
  },
});

const notices = {
  [NOT_FOUND]: { translationKey: "notFoundPage", Icon: StyledPen },
  [GONE]: { translationKey: "unpublishedResourcePage", Icon: TimeLine },
  [INTERNAL_SERVER_ERROR]: { translationKey: "errorPage", Icon: DeleteBinLine },
} as const;

const getNotice = (statusCode: number) =>
  statusCode in notices ? notices[statusCode as keyof typeof notices] : notices[INTERNAL_SERVER_ERROR];

interface Props {
  statusCode: number;
  applySkipToContentId?: boolean;
}

export const ErrorNotice = ({ statusCode, applySkipToContentId }: Props) => {
  const { t } = useTranslation();
  const { translationKey, Icon } = getNotice(statusCode);
  return (
    <Wrapper>
      <Content>
        <TextContent>
          <UppercaseText textStyle="title.medium">{t(`${translationKey}.eyebrow`, { statusCode })}</UppercaseText>
          <Title id={applySkipToContentId ? SKIP_TO_CONTENT_ID : undefined}>{t(`${translationKey}.title`)}</Title>
          <Text textStyle="body.xlarge">{t(`${translationKey}.description`)}</Text>
          <Actions>
            <SafeLinkButton to="/">{t("errorMessage.goToFrontPage")}</SafeLinkButton>
            <SafeLinkButton to="/subjects" variant="secondary">
              {t("errorNotice.searchSubjects")}
            </SafeLinkButton>
          </Actions>
        </TextContent>
        <NoticeCard>
          <NoticeHeader>
            <UppercaseText textStyle="label.large" fontWeight="semibold">
              {t("errorNotice.title")}
            </UppercaseText>
            <Stamp>
              <StampLarge>{t(`${translationKey}.notice.stampLarge`)}</StampLarge>{" "}
              {t(`${translationKey}.notice.stampSmall`)}
            </Stamp>
          </NoticeHeader>
          <StatusCode>{statusCode}</StatusCode>
          <dl>
            <NoticeRow>
              <dt>{t("errorNotice.reasonLabel")}</dt>
              <dd>{t(`${translationKey}.notice.reason`)}</dd>
            </NoticeRow>
            <NoticeRow>
              <dt>{t("errorNotice.actionLabel")}</dt>
              <dd>{t(`${translationKey}.notice.action`)}</dd>
            </NoticeRow>
          </dl>
          <Icon css={{ width: "5xlarge", height: "5xlarge", marginBlockStart: "medium" }} />
        </NoticeCard>
      </Content>
    </Wrapper>
  );
};

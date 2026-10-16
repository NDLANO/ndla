/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowRightLine } from "@ndla/icons";
import {
  Button,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  Text,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { DialogCloseButton } from "../../components/DialogCloseButton";
import { SKIP_TO_CONTENT_ID } from "../../constants";
import { ArenaContent, ArenaSection, NameAndRole, TextLine, VisitArenaButton } from "./ArenaLayout";
import { ArenaVideo, arenaVideoIds } from "./ArenaVideo";

const HeroSection = styled(ArenaSection, {
  base: {
    display: "flex",
    overflow: "hidden",
    background: "purple.300",
    color: "text.onAction",
    minHeight: "800px",
    desktop: {
      minHeight: "clamp(600px, 60vw, 960px)",
    },
  },
});

const HeroImageWrapper = styled("div", {
  base: {
    position: "absolute",
    inset: "0",
    clipPath: "polygon(0 0, 100% 0, 100% calc(100% - var(--slant)), 0 100%)",
    _after: {
      content: "''",
      position: "absolute",
      inset: "0",
      background: "linear-gradient(180deg, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0.55) 45%, rgba(0, 0, 0, 0.72) 100%)",
      desktop: {
        background:
          "linear-gradient(90deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.45) 50%, rgba(0, 0, 0, 0) 75%), linear-gradient(58.6deg, rgba(0, 0, 0, 0.6) 38.9%, rgba(0, 0, 0, 0.11) 63.9%)",
      },
    },
  },
});

const HeroImage = styled("img", {
  base: {
    position: "absolute",
    insetInline: "0",
    top: "-10%",
    width: "100%",
    height: "110%",
    objectFit: "cover",
    objectPosition: "65% center",
    desktop: {
      top: "0",
      height: "100%",
      objectPosition: "center 30%",
    },
  },
});

const HeroInner = styled(ArenaContent, {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: "medium",
    paddingBlockStart: "xxlarge",
    paddingBlockEnd: "calc(var(--slant) + token(spacing.small))",
    desktop: {
      gap: "xxlarge",
      paddingBlockEnd: "calc(var(--slant) + token(spacing.xxlarge))",
    },
  },
});

const HeroText = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    maxWidth: "surface.contentMax",
    desktop: {
      gap: "xxlarge",
      marginBlock: "auto",
    },
  },
});

const HeroHeading = styled("h1", {
  base: {
    fontWeight: "semibold",
    fontSize: "clamp(2.5rem, 1.25rem + 4.6vw, 5rem)",
    lineHeight: "1.1",
    textWrap: "balance",
  },
});

const HeroDescription = styled(Text, {
  base: {
    desktop: {
      maxWidth: "surface.medium",
    },
  },
});

const HeroActions = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "medium",
    tablet: {
      flexDirection: "row",
      alignItems: "center",
      gap: "large",
    },
  },
});

const PlayVideoButton = styled(Button, {
  base: {
    color: "text.onAction",
    textStyle: "label.large",
    fontWeight: "semibold",
    textDecoration: "none",
    _hover: {
      color: "text.onAction",
      textDecoration: "underline",
      textUnderlineOffset: "4px",
    },
    _focusVisible: {
      outlineColor: "white",
    },
  },
});

const Caption = styled("p", {
  base: {
    textStyle: "label.small",
    fontWeight: "semibold",
    textAlign: "center",
    desktop: {
      textStyle: "label.large",
      fontWeight: "semibold",
      alignSelf: "flex-end",
      textAlign: "end",
    },
  },
});

const StyledDialogContent = styled(DialogContent, {
  base: {
    color: "text.default",
  },
});

const DialogVideoWrapper = styled("div", {
  base: {
    width: "min(100%, calc(75vh * 9 / 16))",
    marginInline: "auto",
  },
});

export const ArenaHero = () => {
  const { t } = useTranslation();
  const name = t("arenaCampaign.hero.captionName");
  const videoTitle = t("arenaCampaign.voices.videoTitle", { name });

  return (
    <HeroSection>
      <HeroImageWrapper aria-hidden="true">
        <HeroImage src="/static/arena/hero.webp" alt="" fetchPriority="high" />
      </HeroImageWrapper>
      <HeroInner>
        <HeroText>
          <HeroHeading id={SKIP_TO_CONTENT_ID} tabIndex={-1}>
            <TextLine>{t("arenaCampaign.hero.titleLine1")}</TextLine>{" "}
            <TextLine>{t("arenaCampaign.hero.titleLine2")}</TextLine>
          </HeroHeading>
          <HeroDescription textStyle="title.medium" fontWeight="normal">
            {t("arenaCampaign.hero.description")}
          </HeroDescription>
          <HeroActions>
            <VisitArenaButton tone="light" />
            <DialogRoot>
              <DialogTrigger asChild>
                <PlayVideoButton variant="link">
                  {t("arenaCampaign.hero.playVideo")}
                  <ArrowRightLine />
                </PlayVideoButton>
              </DialogTrigger>
              <StyledDialogContent>
                <DialogHeader>
                  <DialogTitle>{videoTitle}</DialogTitle>
                  <DialogCloseButton />
                </DialogHeader>
                <DialogBody>
                  <DialogVideoWrapper>
                    <ArenaVideo videoId={arenaVideoIds.ingebjorg} title={videoTitle} />
                  </DialogVideoWrapper>
                </DialogBody>
              </StyledDialogContent>
            </DialogRoot>
          </HeroActions>
        </HeroText>
        <Caption>
          <NameAndRole name={name} role={t("arenaCampaign.hero.captionRole")} />
        </Caption>
      </HeroInner>
    </HeroSection>
  );
};

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { breakpoints } from "@ndla/core";
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
    background: "surface.brand.1.moderate",
    color: "text.onAction",
    minHeight: "surface.xxlarge",
    desktop: {
      minHeight: "surface.xlarge",
    },
    wide: {
      minHeight: "surface.xxlarge",
    },
    ultraWide: {
      minHeight: "surface.3xlarge",
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
      background: "[linear-gradient(to bottom, transparent 20%, token(colors.grey.950/70) 45%)]",
      desktop: {
        background: "[linear-gradient(to right, token(colors.grey.950/80), token(colors.grey.950/30))]",
      },
    },
  },
});

const HeroImage = styled("img", {
  base: {
    position: "absolute",
    inset: "0",
    width: "full",
    height: "full",
    objectFit: "cover",
    objectPosition: "top",
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
    paddingBlockEnd: "[calc(var(--slant) + token(spacing.small))]",
    desktop: {
      gap: "xxlarge",
      paddingBlockEnd: "[calc(var(--slant) + token(spacing.xxlarge))]",
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
    textStyle: "heading.large",
    fontWeight: "semibold",
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
    },
    _focusVisible: {
      outlineColor: "surface.default",
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
    width: "fit",
  },
});

const StyledDialogHeader = styled(DialogHeader, {
  base: {
    contain: "inline-size",
  },
});

const DialogVideo = styled(ArenaVideo, {
  base: {
    tablet: {
      width: "auto",
      height: "[clamp(token(sizes.surface.medium), 75dvh, token(sizes.surface.xlarge))]",
      alignSelf: "center",
    },
  },
});

export const ArenaHero = () => {
  const { t } = useTranslation();
  const name = t("arenaCampaign.hero.captionName");
  const videoTitle = t("arenaCampaign.voices.videoTitle", { name });

  return (
    <HeroSection>
      <HeroImageWrapper aria-hidden="true">
        <picture>
          <source srcSet="/static/arena/hero.webp" media={`(min-width: ${breakpoints.desktop})`} />
          <HeroImage src="/static/arena/hero-mobile.webp" alt="" fetchPriority="high" />
        </picture>
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
            <VisitArenaButton variant="secondary" />
            <DialogRoot>
              <DialogTrigger asChild>
                <PlayVideoButton variant="link">
                  {t("arenaCampaign.hero.playVideo")}
                  <ArrowRightLine />
                </PlayVideoButton>
              </DialogTrigger>
              <StyledDialogContent>
                <StyledDialogHeader>
                  <DialogTitle>{videoTitle}</DialogTitle>
                  <DialogCloseButton />
                </StyledDialogHeader>
                <DialogBody>
                  <DialogVideo videoId={arenaVideoIds.ingebjorg} title={videoTitle} />
                </DialogBody>
              </StyledDialogContent>
            </DialogRoot>
          </HeroActions>
        </HeroText>
        <Caption>
          <NameAndRole name={name} role={t("arenaCampaign.hero.captionRole")} />{" "}
          <TextLine>{t("arenaCampaign.hero.captionModerator")}</TextLine>
        </Caption>
      </HeroInner>
    </HeroSection>
  );
};

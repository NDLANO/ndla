/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ExternalLinkLine } from "@ndla/icons";
import { SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import config from "../../config";

export const arenaUrl = `https://${config.arenaDomain}`;

export const ArenaContent = styled("div", {
  base: {
    "--gutter": "spacing.small",
    width: "100%",
    maxWidth: "calc(token(sizes.surface.pageMax) + var(--gutter) * 2)",
    marginInline: "auto",
    paddingInline: "var(--gutter)",
    tablet: {
      "--gutter": "spacing.medium",
    },
  },
});

export const ArenaSection = styled("section", {
  base: {
    position: "relative",
    "--slant": "clamp(32px, 5.5vw, 96px)",
  },
});

export const TextLine = styled("span", {
  base: {
    display: "block",
  },
});

const VisuallyHidden = styled("span", {
  base: {
    srOnly: true,
  },
});

interface NameAndRoleProps {
  name: string;
  role: string;
}

export const NameAndRole = ({ name, role }: NameAndRoleProps) => (
  <>
    <TextLine>
      {name}
      <VisuallyHidden>,</VisuallyHidden>
    </TextLine>{" "}
    <TextLine>{role}</TextLine>
  </>
);

export const DisplayHeading = styled("h2", {
  base: {
    fontWeight: "semibold",
    fontSize: "clamp(2.125rem, 1.5rem + 2vw, 3.25rem)",
    lineHeight: "1.25",
    textWrap: "balance",
  },
});

const StyledSafeLinkButton = styled(SafeLinkButton, {
  base: {
    borderRadius: "large",
    paddingInline: "large",
    textStyle: "label.large",
    fontWeight: "semibold",
  },
  variants: {
    tone: {
      light: {
        background: "purple.400",
        color: "primary",
        _hover: {
          background: "purple.300",
          color: "primary",
        },
        _active: {
          background: "purple.300",
          color: "primary",
        },
      },
      dark: {},
    },
  },
});

interface Props {
  tone: "light" | "dark";
}

export const VisitArenaButton = ({ tone }: Props) => {
  const { t } = useTranslation();
  return (
    <StyledSafeLinkButton to={arenaUrl} tone={tone}>
      {t("arenaCampaign.visitArena")}
      <ExternalLinkLine />
    </StyledSafeLinkButton>
  );
};

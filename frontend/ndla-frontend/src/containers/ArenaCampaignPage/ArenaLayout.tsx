/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ExternalLinkLine } from "@ndla/icons";
import { SafeLinkButton, type SafeLinkButtonProps } from "@ndla/safelink";
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
    "--slant": "spacing.large",
    tablet: {
      "--slant": "spacing.xxlarge",
    },
    desktop: {
      "--slant": "spacing.3xlarge",
    },
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
    textStyle: "heading.large",
    fontWeight: "semibold",
    textWrap: "balance",
  },
});

interface Props {
  variant?: SafeLinkButtonProps["variant"];
}

export const VisitArenaButton = ({ variant }: Props) => {
  const { t } = useTranslation();
  return (
    <SafeLinkButton to={arenaUrl} variant={variant}>
      {t("arenaCampaign.visitArena")}
      <ExternalLinkLine />
    </SafeLinkButton>
  );
};

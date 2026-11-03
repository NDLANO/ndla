/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Heading } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

const ContentWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    desktop: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
  },
});

const MainColumn = styled("div", {
  base: {
    flex: "1",
    minWidth: "0",
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

const Sidebar = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
    flexShrink: "0",
    width: "[360px]",
    desktopDown: {
      width: "full",
    },
  },
});

interface Props {
  sidebar: ReactNode;
  children: ReactNode;
}

export const SearchLayout = ({ sidebar, children }: Props) => {
  const { t } = useTranslation();
  const headingId = useId();
  return (
    <ContentWrapper>
      <MainColumn>{children}</MainColumn>
      <Sidebar aria-labelledby={headingId}>
        <Heading id={headingId} textStyle="title.medium" asChild consumeCss>
          <h2>{t("searchForm.filtersHeading")}</h2>
        </Heading>
        {sidebar}
      </Sidebar>
    </ContentWrapper>
  );
};

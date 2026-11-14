/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowLeftShortLine, ArrowRightShortLine, CloseLine } from "@ndla/icons";
import { Button, Heading, IconButton } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { createContext, useContext, useId, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { STORED_SEARCH_FILTERS_OPEN } from "../../../constants";
import { useLocalStorageBooleanState } from "../../WelcomePage/hooks/storedFilterHooks";

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
    gap: "medium",
  },
});

const Sidebar = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
    flexShrink: "0",
    width: "surface.small",
    padding: "small",
    background: "surface.brand.2.subtle",
    border: "1px solid",
    borderColor: "stroke.discrete",
    boxShadow: "xsmall",
    desktopDown: {
      position: "fixed",
      insetBlock: "0",
      insetInlineEnd: "0",
      zIndex: "docked",
      width: "full",
      maxWidth: "surface.small",
      overflowY: "auto",
      padding: "medium",
      boxShadow: "large",
    },
    _hidden: {
      display: "none",
    },
  },
});

const SidebarHeader = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "xsmall",
  },
});

interface SearchLayoutContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  sidebarId: string;
  activeFilterCount: number;
}

const SearchLayoutContext = createContext<SearchLayoutContextValue | undefined>(undefined);

export const countActiveFilters = (filters: Record<string, unknown>) =>
  Object.entries(filters).reduce((acc, [key, value]) => {
    if (key === "query" || key === "query-fields" || !value) return acc;
    return acc + (Array.isArray(value) ? value.length : 1);
  }, 0);

export const SearchFiltersToggle = () => {
  const { t } = useTranslation();
  const context = useContext(SearchLayoutContext);
  if (!context) return null;
  const { open, setOpen, sidebarId, activeFilterCount } = context;
  return (
    <Button
      variant="tertiary"
      size="small"
      aria-expanded={open}
      aria-controls={sidebarId}
      onClick={() => setOpen(!open)}
    >
      {open ? t("searchForm.hideFilters") : t("searchForm.showFilters")}
      {!open && activeFilterCount > 0 && ` (${activeFilterCount})`}
      {open ? <ArrowRightShortLine /> : <ArrowLeftShortLine />}
    </Button>
  );
};

interface Props {
  sidebar: ReactNode;
  children: ReactNode;
  activeFilterCount: number;
}

export const SearchLayout = ({ sidebar, children, activeFilterCount }: Props) => {
  const { t } = useTranslation();
  const headingId = useId();
  const sidebarId = useId();
  const [open, setOpen] = useLocalStorageBooleanState(STORED_SEARCH_FILTERS_OPEN);
  const contextValue = useMemo(
    () => ({ open, setOpen, sidebarId, activeFilterCount }),
    [open, setOpen, sidebarId, activeFilterCount],
  );

  return (
    <SearchLayoutContext.Provider value={contextValue}>
      <ContentWrapper>
        <MainColumn>{children}</MainColumn>
        <Sidebar id={sidebarId} aria-labelledby={headingId} hidden={!open}>
          <SidebarHeader>
            <Heading id={headingId} textStyle="title.small" asChild consumeCss>
              <h2>{t("searchForm.filtersHeading")}</h2>
            </Heading>
            <IconButton
              variant="tertiary"
              size="small"
              aria-label={t("searchForm.hideFilters")}
              title={t("searchForm.hideFilters")}
              onClick={() => setOpen(false)}
            >
              <CloseLine />
            </IconButton>
          </SidebarHeader>
          {sidebar}
        </Sidebar>
      </ContentWrapper>
    </SearchLayoutContext.Provider>
  );
};

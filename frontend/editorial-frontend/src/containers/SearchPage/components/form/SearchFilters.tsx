/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowDownShortLine, ArrowUpShortLine } from "@ndla/icons";
import { Button } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

const MainFilters = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(token(spacing.surface.xxsmall), 1fr))",
    gap: "3xsmall",
    alignItems: "center",
  },
});

const ToggleButton = styled(Button, {
  base: {
    gridColumn: "-2 / -1",
  },
});

const MoreFiltersPanel = styled(MainFilters, {
  base: {
    border: "1px solid",
    borderColor: "stroke.subtle",
    borderRadius: "xsmall",
    padding: "xsmall",
    _hidden: {
      display: "none",
    },
  },
});

interface Props {
  children: ReactNode;
  moreFilters?: ReactNode;
  activeMoreFiltersCount?: number;
}

export const SearchFilters = ({ children, moreFilters, activeMoreFiltersCount = 0 }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(activeMoreFiltersCount > 0);
  const panelId = useId();

  return (
    <>
      <MainFilters>
        {children}
        {!!moreFilters && (
          <ToggleButton
            variant="tertiary"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((prev) => !prev)}
          >
            {t("searchForm.moreFilters")}
            {activeMoreFiltersCount > 0 && ` (${activeMoreFiltersCount})`}
            {open ? <ArrowUpShortLine /> : <ArrowDownShortLine />}
          </ToggleButton>
        )}
      </MainFilters>
      {!!moreFilters && (
        <MoreFiltersPanel id={panelId} hidden={!open}>
          {moreFilters}
        </MoreFiltersPanel>
      )}
    </>
  );
};

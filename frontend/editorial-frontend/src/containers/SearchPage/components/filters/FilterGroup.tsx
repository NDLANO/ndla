/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button, Heading } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { SelectOption } from "../../../../components/ObjectSelector";

export const FilterContainer = styled("div", {
  base: {
    border: "1px solid",
    borderColor: "stroke.subtle",
    borderRadius: "xsmall",
    padding: "xsmall",
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

const ShowMoreButton = styled(Button, {
  base: {
    alignSelf: "flex-start",
  },
});

interface FilterGroupProps {
  title: string;
  children: ReactNode;
  "data-testid"?: string;
}

export const FilterGroup = ({ title, children, ...rest }: FilterGroupProps) => {
  const headingId = useId();
  return (
    <FilterContainer role="group" aria-labelledby={headingId} {...rest}>
      <Heading id={headingId} textStyle="label.medium" fontWeight="bold" asChild consumeCss>
        <h3>{title}</h3>
      </Heading>
      {children}
    </FilterContainer>
  );
};

export const getVisibleOptions = <T extends SelectOption>(
  options: T[],
  selected: string[],
  collapsedCount: number | undefined,
  expanded: boolean,
) => {
  if (expanded || collapsedCount === undefined || options.length <= collapsedCount) return options;
  return options.filter((option, index) => index < collapsedCount || selected.includes(option.id));
};

interface ShowMoreToggleProps {
  count: number;
  collapsedCount: number | undefined;
  expanded: boolean;
  onToggle: () => void;
}

export const ShowMoreToggle = ({ count, collapsedCount, expanded, onToggle }: ShowMoreToggleProps) => {
  const { t } = useTranslation();
  if (collapsedCount === undefined || count <= collapsedCount) return null;
  return (
    <ShowMoreButton variant="link" size="small" aria-expanded={expanded} onClick={onToggle}>
      {expanded ? t("searchForm.showFewer") : t("searchForm.showAll", { count })}
    </ShowMoreButton>
  );
};

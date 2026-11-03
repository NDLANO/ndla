/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SearchLine } from "@ndla/icons";
import { Button, FieldInput, FieldLabel, FieldRoot, IconButton } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

const StyledFieldRoot = styled(FieldRoot, {
  base: {
    gridColumn: "1 / -2",
  },
});

const ActionsWrapper = styled("div", {
  base: {
    gridColumn: "-2 / -1",
    display: "flex",
    gap: "3xsmall",
    alignItems: "center",
  },
});

const AddonWrapper = styled("div", {
  base: {
    flex: "1",
    minWidth: "0",
    "& [data-part='value-text']": {
      display: "block",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    },
  },
});

const StyledButton = styled(Button, {
  base: {
    flex: "1",
  },
});

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  children?: ReactNode;
}

export const SearchQueryField = ({ value, onChange, placeholder, children }: Props) => {
  const { t } = useTranslation();
  return (
    <>
      <StyledFieldRoot>
        <FieldLabel srOnly>{placeholder}</FieldLabel>
        <FieldInput
          name="query"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
      </StyledFieldRoot>
      <ActionsWrapper>
        {children ? (
          <>
            <AddonWrapper>{children}</AddonWrapper>
            <IconButton type="submit" aria-label={t("searchForm.btn")} title={t("searchForm.btn")}>
              <SearchLine />
            </IconButton>
          </>
        ) : (
          <StyledButton type="submit">{t("searchForm.btn")}</StyledButton>
        )}
      </ActionsWrapper>
    </>
  );
};

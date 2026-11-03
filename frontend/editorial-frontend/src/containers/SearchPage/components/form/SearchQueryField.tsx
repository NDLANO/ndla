/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SearchLine } from "@ndla/icons";
import { FieldInput, FieldLabel, FieldRoot, IconButton } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

const Wrapper = styled("div", {
  base: {
    display: "flex",
    gap: "3xsmall",
    alignItems: "center",
    tabletDown: {
      flexWrap: "wrap",
    },
  },
});

const StyledFieldRoot = styled(FieldRoot, {
  base: {
    flex: "1",
    tabletDown: {
      flexBasis: "full",
    },
  },
});

const AddonWrapper = styled("div", {
  base: {
    width: "surface.xxsmall",
    tabletDown: {
      flex: "1",
    },
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
    <Wrapper>
      <StyledFieldRoot>
        <FieldLabel srOnly>{placeholder}</FieldLabel>
        <FieldInput
          name="query"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
      </StyledFieldRoot>
      {!!children && <AddonWrapper>{children}</AddonWrapper>}
      <IconButton type="submit" aria-label={t("searchForm.btn")} title={t("searchForm.btn")}>
        <SearchLine />
      </IconButton>
    </Wrapper>
  );
};

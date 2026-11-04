/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ErrorWarningFill } from "@ndla/icons";
import { styled } from "@ndla/styled-system/jsx";
import { useField } from "formik";
import { useTranslation } from "react-i18next";
import { useCompetenceGoalTaxonomy } from "./useCompetenceGoalTaxonomy";

const StyledSpan = styled("span", {
  base: {
    display: "flex",
    gap: "xsmall",
    alignItems: "center",
  },
});

export const UnmatchedGoalIcon = styled(ErrorWarningFill, {
  base: {
    color: "icon.warning",
    flexShrink: "0",
  },
});

interface Props {
  contentURI?: string;
  language: string;
}

export const GrepCodesPanelTitle = ({ contentURI, language }: Props) => {
  const { t } = useTranslation();
  const [field] = useField<string[]>("grepCodes");
  const { unmatchedGoals } = useCompetenceGoalTaxonomy({ grepCodes: field.value, contentURI, language });

  if (!unmatchedGoals.size) return t("form.name.grepCodes");

  return (
    <StyledSpan>
      <span>{t("form.name.grepCodes")}</span>
      <UnmatchedGoalIcon
        aria-label={t("form.grepCodes.unmatchedSection")}
        title={t("form.grepCodes.unmatchedSection")}
      />
    </StyledSpan>
  );
};

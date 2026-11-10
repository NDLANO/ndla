/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { styled } from "@ndla/styled-system/jsx";
import { useField } from "formik";
import { useTranslation } from "react-i18next";
import { CompetenceGoalWarningIcon } from "../../components/Taxonomy/CompetenceGoalWarningIcon";
import { useCompetenceGoalTaxonomy } from "./useCompetenceGoalTaxonomy";

const StyledSpan = styled("span", {
  base: {
    display: "flex",
    gap: "xsmall",
    alignItems: "center",
  },
});

interface Props {
  contentURI?: string;
  language: string;
}

const PanelTitle = ({ title, warning }: { title: string; warning: string | undefined }) => {
  if (!warning) return title;
  return (
    <StyledSpan>
      <span>{title}</span>
      <CompetenceGoalWarningIcon aria-label={warning} title={warning} />
    </StyledSpan>
  );
};

const useCompetenceGoalWarnings = ({ contentURI, language }: Props) => {
  const [field] = useField<string[]>("grepCodes");
  return useCompetenceGoalTaxonomy({ grepCodes: field.value, contentURI, language });
};

export const GrepCodesPanelTitle = (props: Props) => {
  const { t } = useTranslation();
  const { unmatchedGoals } = useCompetenceGoalWarnings(props);
  return (
    <PanelTitle
      title={t("form.name.grepCodes")}
      warning={unmatchedGoals.size ? t("form.grepCodes.unmatchedSection") : undefined}
    />
  );
};

export const TaxonomyPanelTitle = (props: Props) => {
  const { t } = useTranslation();
  const { subjectsWithoutGoals } = useCompetenceGoalWarnings(props);
  return (
    <PanelTitle
      title={t("form.taxonomySection")}
      warning={subjectsWithoutGoals.size ? t("taxonomy.competenceGoals.missingSection") : undefined}
    />
  );
};

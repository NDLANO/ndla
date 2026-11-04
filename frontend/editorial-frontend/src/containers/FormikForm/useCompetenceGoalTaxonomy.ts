/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getSubjectNamesByGoalSet, getUnmatchedCompetenceGoals } from "../../components/Taxonomy/competenceGoalsUtil";
import { GREP_CODE_FORMATS } from "../../constants";
import { nodesQueryOptions } from "../../modules/nodes/nodeQueries";
import { searchGrepCodesQueryOptions } from "../../modules/search/searchQueries";
import { useTaxonomyVersion } from "../StructureVersion/TaxonomyVersionProvider";

interface Props {
  grepCodes: string[];
  contentURI?: string;
  language?: string;
}

export const useCompetenceGoalTaxonomy = ({ grepCodes, contentURI, language }: Props) => {
  const { t, i18n } = useTranslation();
  const { taxonomyVersion } = useTaxonomyVersion();

  const subjectsQuery = useQuery(
    nodesQueryOptions({ language: i18n.language, taxonomyVersion, nodeType: ["SUBJECT"] }),
  );

  const placementsQuery = useQuery({
    ...nodesQueryOptions({ contentURI, taxonomyVersion, language }),
    enabled: !!contentURI,
  });

  const goalCodes = useMemo(
    () => grepCodes.filter((code) => GREP_CODE_FORMATS.KOMPETANSEMAL.regexp.test(code)),
    [grepCodes],
  );

  const goalsQuery = useQuery({
    ...searchGrepCodesQueryOptions({ codes: goalCodes, pageSize: goalCodes.length }),
    enabled: !!contentURI && !!goalCodes.length,
    placeholderData: keepPreviousData,
  });

  const subjectNames = useMemo(
    () => getSubjectNamesByGoalSet(subjectsQuery.data ?? [], t("form.grepCodes.foreignLanguages")),
    [subjectsQuery.data, t],
  );

  const unmatchedGoals = useMemo(() => {
    if (!subjectsQuery.data || !placementsQuery.data || !goalCodes.length || !goalsQuery.data) {
      return new Set<string>();
    }
    const rootIds = new Set(placementsQuery.data.flatMap((node) => node.contexts.map((context) => context.rootId)));
    const placementSubjects = subjectsQuery.data.filter((subject) => rootIds.has(subject.id));
    const goalResults = goalsQuery.data.results.filter((result) => goalCodes.includes(result.code));
    return getUnmatchedCompetenceGoals(goalResults, placementSubjects);
  }, [goalCodes, goalsQuery.data, placementsQuery.data, subjectsQuery.data]);

  return { subjectNames, unmatchedGoals };
};

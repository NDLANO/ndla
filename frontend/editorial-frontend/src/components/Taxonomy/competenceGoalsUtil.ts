/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GrepKompetansemaalDTO, GrepResultDTO } from "@ndla/types-backend/search-api";

export interface CompetenceGoalSet {
  code: string;
  title: string;
  goals: GrepKompetansemaalDTO[];
}

export interface CompetenceGoalCurriculum {
  code: string;
  title: string;
  sets: CompetenceGoalSet[];
}

export const getCompetenceGoalCodes = (setResults: GrepResultDTO[]): string[] =>
  setResults.flatMap((result) =>
    result.typename === "GrepKompetansemaalSettDTO" ? result.kompetansemaal.map((goal) => goal.code) : [],
  );

export const countSelectedCompetenceGoals = (setResults: GrepResultDTO[], selectedCodes: string[]): number => {
  const selected = new Set(selectedCodes);
  return new Set(getCompetenceGoalCodes(setResults).filter((code) => selected.has(code))).size;
};

export const groupCompetenceGoals = (
  setCodes: string[],
  setResults: GrepResultDTO[],
  goalResults: GrepResultDTO[],
): CompetenceGoalCurriculum[] => {
  const goalsByCode = new Map(
    goalResults.flatMap((result) =>
      result.typename === "GrepKompetansemaalDTO" ? [[result.code, result] as const] : [],
    ),
  );
  const curriculums = new Map<string, CompetenceGoalCurriculum>();

  for (const setCode of new Set(setCodes)) {
    const set = setResults.find((result) => result.code === setCode);
    if (set?.typename !== "GrepKompetansemaalSettDTO") continue;
    const goals = set.kompetansemaal.flatMap((goal) => goalsByCode.get(goal.code) ?? []);
    const laereplan = goals[0]?.laereplan;
    if (!laereplan) continue;
    const curriculum = curriculums.get(laereplan.code) ?? { code: laereplan.code, title: laereplan.title, sets: [] };
    curriculum.sets.push({ code: set.code, title: set.title.title, goals });
    curriculums.set(laereplan.code, curriculum);
  }

  return Array.from(curriculums.values());
};

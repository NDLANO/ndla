/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GrepKompetansemaalDTO, GrepResultDTO } from "@ndla/types-backend/search-api";
import type { Node } from "@ndla/types-backend/taxonomy-api";
import { subjectCategories } from "@ndla/ui";
import { GREP_CODE_FORMATS, TAXONOMY_CUSTOM_FIELD_SUBJECT_CATEGORY } from "../../constants";

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
  return getCompetenceGoalCodes(setResults).filter((code) => selected.has(code)).length;
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

type SubjectWithGrepCodes = Pick<Node, "id" | "name" | "metadata">;

const getGoalSetCodes = (subject: SubjectWithGrepCodes) =>
  subject.metadata.grepCodes.filter((code) => GREP_CODE_FORMATS.KOMPETANSEMALSETT.regexp.test(code));

const isOtherResourcesSubject = (subject: SubjectWithGrepCodes) =>
  subject.metadata.customFields[TAXONOMY_CUSTOM_FIELD_SUBJECT_CATEGORY] === subjectCategories.OTHER;

export const getSubjectNamesByGoalSet = (subjects: SubjectWithGrepCodes[], sharedLabel: string) => {
  const subjectsByGoalSet = new Map<string, Set<string>>();
  for (const subject of subjects) {
    if (isOtherResourcesSubject(subject)) continue;
    for (const code of getGoalSetCodes(subject)) {
      subjectsByGoalSet.set(code, (subjectsByGoalSet.get(code) ?? new Set()).add(subject.id));
    }
  }
  const subjectNames = new Map<string, string>();
  for (const [code, subjectIds] of subjectsByGoalSet) {
    const name = subjectIds.size > 1 ? sharedLabel : subjects.find((s) => subjectIds.has(s.id))?.name;
    if (name) subjectNames.set(code, name);
  }
  return subjectNames;
};

export const getUnmatchedCompetenceGoals = (
  goalResults: GrepResultDTO[],
  placementSubjects: SubjectWithGrepCodes[],
): Set<string> => {
  const checkedSubjects = placementSubjects.filter((subject) => !isOtherResourcesSubject(subject));
  if (placementSubjects.length && !checkedSubjects.length) return new Set();
  const goalSetCodes = new Set(checkedSubjects.flatMap(getGoalSetCodes));
  return new Set(
    goalResults.flatMap((result) =>
      result.typename === "GrepKompetansemaalDTO" && !goalSetCodes.has(result.kompetansemaalSett.code)
        ? [result.code]
        : [],
    ),
  );
};

export const getSubjectsWithoutCompetenceGoals = (
  goalResults: GrepResultDTO[],
  placementSubjects: SubjectWithGrepCodes[],
): Set<string> => {
  const goalSetCodes = new Set(
    goalResults.flatMap((result) =>
      result.typename === "GrepKompetansemaalDTO" ? [result.kompetansemaalSett.code] : [],
    ),
  );
  return new Set(
    placementSubjects.flatMap((subject) => {
      if (isOtherResourcesSubject(subject)) return [];
      const codes = getGoalSetCodes(subject);
      return codes.length && !codes.some((code) => goalSetCodes.has(code)) ? [subject.id] : [];
    }),
  );
};

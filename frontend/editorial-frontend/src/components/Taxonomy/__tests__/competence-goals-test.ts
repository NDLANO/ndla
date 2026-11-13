/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GrepKompetansemaalDTO, GrepKompetansemaalSettDTO, GrepStatusDTO } from "@ndla/types-backend/search-api";
import {
  countSelectedCompetenceGoals,
  getCompetenceGoalCodes,
  getSubjectNamesByGoalSet,
  getSubjectsWithoutCompetenceGoals,
  getUnmatchedCompetenceGoals,
  groupCompetenceGoals,
} from "../competenceGoalsUtil";

const reference = (code: string, title = `Title ${code}`) => ({
  code,
  uri: `https://data.udir.no/${code}`,
  status: "Published" as GrepStatusDTO,
  title,
});

const goalSet = (code: string, goalCodes: string[]): GrepKompetansemaalSettDTO => ({
  code,
  uri: `https://data.udir.no/${code}`,
  status: "Published",
  title: { title: `Set ${code}`, language: "nb" },
  kompetansemaal: goalCodes.map((goalCode) => reference(goalCode)),
  typename: "GrepKompetansemaalSettDTO",
});

const goal = (code: string, setCode: string, laereplanCode: string): GrepKompetansemaalDTO => ({
  code,
  uri: `https://data.udir.no/${code}`,
  status: "Published",
  title: { title: `Goal ${code}`, language: "nb" },
  laereplan: reference(laereplanCode, `Curriculum ${laereplanCode}`),
  kompetansemaalSett: reference(setCode, `Set ${setCode}`),
  tverrfagligeTemaer: [],
  kjerneelementer: [],
  typename: "GrepKompetansemaalDTO",
});

const sets = [goalSet("KV2", ["KM3", "KM4"]), goalSet("KV1", ["KM2", "KM1"]), goalSet("KV3", ["KM5"])];
const goals = [
  goal("KM1", "KV1", "LP1"),
  goal("KM2", "KV1", "LP1"),
  goal("KM3", "KV2", "LP2"),
  goal("KM4", "KV2", "LP2"),
  goal("KM5", "KV3", "LP1"),
];

test("that getCompetenceGoalCodes returns the goal codes of all sets", () => {
  expect(getCompetenceGoalCodes([...sets, goals[0]!])).toStrictEqual(["KM3", "KM4", "KM2", "KM1", "KM5"]);
});

test("that groupCompetenceGoals groups sets by curriculum in subject and set order", () => {
  const result = groupCompetenceGoals(["KV1", "KV2", "KV3", "KV1"], sets, goals);

  expect(
    result.map((curriculum) => ({
      code: curriculum.code,
      title: curriculum.title,
      sets: curriculum.sets.map((set) => ({ code: set.code, goals: set.goals.map((g) => g.code) })),
    })),
  ).toStrictEqual([
    {
      code: "LP1",
      title: "Curriculum LP1",
      sets: [
        { code: "KV1", goals: ["KM2", "KM1"] },
        { code: "KV3", goals: ["KM5"] },
      ],
    },
    { code: "LP2", title: "Curriculum LP2", sets: [{ code: "KV2", goals: ["KM3", "KM4"] }] },
  ]);
});

test("that groupCompetenceGoals skips sets without resolved goals", () => {
  const result = groupCompetenceGoals(["KV1", "KV404", "KV2"], sets, goals.slice(0, 2));

  expect(result.map((curriculum) => curriculum.sets.map((set) => set.code))).toStrictEqual([["KV1"]]);
});

const subject = (id: string, grepCodes: string[], subjectCategory = "active") => ({
  id,
  name: `Subject ${id}`,
  metadata: { grepCodes, visible: true, customFields: { subjectCategory } },
});

test("that getSubjectNamesByGoalSet maps goal sets to subject names", () => {
  const result = getSubjectNamesByGoalSet(
    [subject("S1", ["KV1", "MAT01-05"]), subject("S2", ["KV2"]), subject("S3", ["KV2"]), subject("S4", [])],
    "Shared",
  );

  expect(Object.fromEntries(result)).toStrictEqual({ KV1: "Subject S1", KV2: "Shared" });
});

test("that getSubjectNamesByGoalSet ignores other resources subjects", () => {
  const result = getSubjectNamesByGoalSet(
    [subject("S1", ["KV1"]), subject("S2", ["KV1", "KV2"], "otherResources")],
    "Shared",
  );

  expect(Object.fromEntries(result)).toStrictEqual({ KV1: "Subject S1" });
});

test("that getUnmatchedCompetenceGoals returns goals without a matching placement subject", () => {
  const result = getUnmatchedCompetenceGoals([...goals, sets[0]!], [subject("S1", ["KV1"]), subject("S2", ["KV3"])]);

  expect(Array.from(result)).toStrictEqual(["KM3", "KM4"]);
});

test("that getUnmatchedCompetenceGoals returns all goals when there are no placements", () => {
  expect(Array.from(getUnmatchedCompetenceGoals(goals.slice(0, 2), []))).toStrictEqual(["KM1", "KM2"]);
});

test("that getUnmatchedCompetenceGoals ignores resources placed only in other resources subjects", () => {
  const result = getUnmatchedCompetenceGoals(goals, [
    subject("S1", ["KV1"], "otherResources"),
    subject("S2", [], "otherResources"),
  ]);

  expect(result.size).toBe(0);
});

test("that getUnmatchedCompetenceGoals only matches goals against placements outside other resources subjects", () => {
  const result = getUnmatchedCompetenceGoals(goals, [
    subject("S1", ["KV1"]),
    subject("S2", ["KV2"], "otherResources"),
    subject("S3", [], "archive"),
  ]);

  expect(Array.from(result)).toStrictEqual(["KM3", "KM4", "KM5"]);
});

test("that getSubjectsWithoutCompetenceGoals returns placement subjects with no goals from their sets", () => {
  const result = getSubjectsWithoutCompetenceGoals(goals.slice(0, 2), [
    subject("S1", ["KV1"]),
    subject("S2", ["KV2", "KV3"]),
    subject("S3", []),
  ]);

  expect(Array.from(result)).toStrictEqual(["S2"]);
});

test("that getSubjectsWithoutCompetenceGoals returns every subject with sets when there are no goals", () => {
  expect(Array.from(getSubjectsWithoutCompetenceGoals([], [subject("S1", ["KV1"]), subject("S2", [])]))).toStrictEqual([
    "S1",
  ]);
});

test("that getSubjectsWithoutCompetenceGoals ignores other resources subjects but still checks the other placements", () => {
  const result = getSubjectsWithoutCompetenceGoals(
    [],
    [subject("S1", ["KV1"]), subject("S2", ["KV2"], "otherResources")],
  );

  expect(Array.from(result)).toStrictEqual(["S1"]);
});

test("that countSelectedCompetenceGoals only counts goals in the sets", () => {
  expect(countSelectedCompetenceGoals(sets, ["KM1", "KM4", "KM99", "KV1", "KE12"])).toBe(2);
});

test("that countSelectedCompetenceGoals returns 0 for empty input", () => {
  expect(countSelectedCompetenceGoals([], ["KM1"])).toBe(0);
  expect(countSelectedCompetenceGoals(sets, [])).toBe(0);
});

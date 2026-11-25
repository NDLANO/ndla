/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { splitTasks, toolVersionChanged, typesTasks } from "../affected.mts";

describe("toolVersionChanged", () => {
  const diff = ["--- a/mise.toml", "+++ b/mise.toml", "@@ -3 +3 @@", '-node = "26.12"', '+node = "26.13"'];

  it("detects a changed version line for a listed tool", () => {
    expect(toolVersionChanged(diff, ["node", "pnpm"])).toBe(true);
  });

  it("ignores version lines of other tools", () => {
    expect(toolVersionChanged(diff, ["java"])).toBe(false);
  });

  it("ignores changes outside the tool versions", () => {
    expect(toolVersionChanged(["+[tasks.java]", '+description = "java = 1"'], ["java"])).toBe(false);
  });
});

describe("splitTasks", () => {
  it("separates typescript generation from the other tasks", () => {
    const tasks = ["draft-api.test", "common.test.testForked", "draft-api.generateTypescript"];
    expect(splitTasks(tasks)).toEqual({ modules: ["common", "draft-api"], typesModules: ["draft-api"] });
  });

  it("drops anything that is not a plain module name", () => {
    expect(splitTasks(["[1/1] resolve", "a b.test", "search.test"])).toEqual({ modules: ["search"], typesModules: [] });
  });
});

describe("typesTasks", () => {
  it("joins the tasks the way Mill expects", () => {
    expect(typesTasks(["a", "b"])).toBe("a.generateTypescript + b.generateTypescript");
    expect(typesTasks([])).toBe("");
  });
});

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { check } from "./check.mts";
import { dev } from "./dev.mts";
import { format } from "./format.mts";
import { projects } from "./projects.mts";
import { test } from "./test.mts";

const tasks: Record<string, (args: string[]) => number> = { dev, test, format, check, projects };
const task = process.argv[2] ?? "";
process.exit(tasks[task]?.(process.argv.slice(3)) ?? 1);

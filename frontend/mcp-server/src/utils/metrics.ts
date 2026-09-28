/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Counter, Histogram } from "prom-client";

export const toolCalls = new Counter({
  name: "mcp_tool_calls_total",
  help: "Number of MCP tool calls, by tool and outcome",
  labelNames: ["tool", "status"] as const,
});

export const toolDuration = new Histogram({
  name: "mcp_tool_duration_seconds",
  help: "Duration of MCP tool calls in seconds",
  labelNames: ["tool"] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

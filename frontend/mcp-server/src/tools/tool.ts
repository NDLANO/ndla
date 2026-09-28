/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/server";
import { isApiError } from "@ndla/api-client";
import * as z from "zod";
import { defaultLanguage, maxContentLength, maxPageSize } from "../config";
import { logger } from "../utils/logger";
import { toolCalls, toolDuration } from "../utils/metrics";

export const readOnlyAnnotations: ToolAnnotations = {
  readOnlyHint: true,
  idempotentHint: true,
  destructiveHint: false,
  openWorldHint: false,
};

const languageCode = z.string().regex(/^[a-z]{2,3}$/);

export const languageSchema = languageCode
  .default(defaultLanguage)
  .describe(
    "ISO 639-1 language code, e.g. nb (Norwegian Bokmål), nn (Nynorsk), en (English), se (Northern Sami). Falls back to another language when the content is not translated.",
  );

export const optionalLanguageSchema = languageCode.optional();

export const pageSchema = z.number().int().min(1).max(100).default(1).describe("Result page, starting at 1.");

export const pageSizeSchema = z
  .number()
  .int()
  .min(1)
  .max(maxPageSize)
  .default(10)
  .describe(`Results per page (1-${maxPageSize}).`);

export const truncate = (text: string, max: number = maxContentLength): string =>
  text.length > max
    ? `${text.slice(0, max)}\n\n[Truncated after ${max} characters. Open the source URL to read the rest.]`
    : text;

export class ToolInputError extends Error {}

type Outcome = "ok" | "invalid_input" | "not_found" | "restricted" | "error";

const describeError = (error: unknown): { outcome: Outcome; message: string } => {
  if (error instanceof ToolInputError) return { outcome: "invalid_input", message: error.message };
  if (isApiError(error)) {
    if (error.status === 404 || error.status === 410) {
      return { outcome: "not_found", message: "Not found. Check the id or URL, or use search to find the resource." };
    }
    if (error.status === 401 || error.status === 403) {
      return {
        outcome: "restricted",
        message: "This resource is not openly available (it may be reserved for logged-in teachers on ndla.no).",
      };
    }
    if (error.status < 500) {
      return { outcome: "invalid_input", message: `NDLA rejected the request (${error.status}): ${error.messages}` };
    }
  }
  return { outcome: "error", message: "NDLA is temporarily unavailable. Try again shortly." };
};

/** Wraps a tool handler with logging, metrics and error-to-result conversion. Arguments are only logged at debug level, since they may contain user-written text. */
export const withToolHandling =
  <Args>(name: string, handler: (args: Args) => Promise<string>) =>
  async (args: Args): Promise<CallToolResult> => {
    const start = performance.now();
    const endTimer = toolDuration.startTimer({ tool: name });
    logger.debug(`Tool ${name} called`, { args });
    try {
      const text = await handler(args);
      toolCalls.inc({ tool: name, status: "ok" });
      logger.info(`Tool ${name} ok in ${Math.round(performance.now() - start)}ms`);
      return { content: [{ type: "text", text }] };
    } catch (error) {
      const { outcome, message } = describeError(error);
      toolCalls.inc({ tool: name, status: outcome });
      logger.log(
        outcome === "error" ? "error" : "info",
        `Tool ${name} ${outcome} in ${Math.round(performance.now() - start)}ms`,
        {
          error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        },
      );
      return { isError: true, content: [{ type: "text", text: message }] };
    } finally {
      endTimer();
    }
  };

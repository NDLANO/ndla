/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type NdlaUrlTarget =
  | { kind: "article"; id: number }
  | { kind: "learningpath"; id: number; stepId?: number }
  | { kind: "concept"; id: number }
  | { kind: "image"; id: number }
  | { kind: "audio"; id: number }
  | { kind: "podcast-series"; id: number }
  | { kind: "video"; id: string }
  | { kind: "context"; contextId: string; stepId?: number };

export interface ParsedNdlaUrl {
  language?: string;
  target: NdlaUrlTarget;
}

const uiLanguages = new Set(["nb", "nn", "en", "se"]);
const contextIdPattern = /^[0-9a-f]{8,12}$/;
const numeric = /^\d+$/;

const parseContextPath = (segments: string[]): NdlaUrlTarget | undefined => {
  const [previous, last] = segments.slice(-2);
  if (previous && last && numeric.test(last) && contextIdPattern.test(previous)) {
    return { kind: "context", contextId: previous, stepId: Number(last) };
  }
  const contextId = segments.at(-1);
  return contextId && contextIdPattern.test(contextId) ? { kind: "context", contextId } : undefined;
};

/** Mirrors the public routes in ndla-frontend (src/appRoutes.tsx). Returns undefined for URLs that are not NDLA content. */
export const parseNdlaUrl = (input: string): ParsedNdlaUrl | undefined => {
  const trimmed = input.trim();
  const absolute = /^[a-z]+:\/\//i.test(trimmed)
    ? trimmed
    : /^([\w-]+\.)*ndla\.no(\/|$)/i.test(trimmed)
      ? `https://${trimmed}`
      : `https://ndla.no/${trimmed.replace(/^\//, "")}`;
  let url: URL;
  try {
    url = new URL(absolute);
  } catch {
    return undefined;
  }
  if (url.hostname !== "ndla.no" && !url.hostname.endsWith(".ndla.no") && url.hostname !== "localhost")
    return undefined;

  const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const language = segments[0] && uiLanguages.has(segments[0]) ? segments.shift() : undefined;
  const [first, second, third, fourth] = segments;
  const id = second && numeric.test(second) ? Number(second) : undefined;

  const target = ((): NdlaUrlTarget | undefined => {
    switch (first) {
      case "article":
        return id ? { kind: "article", id } : undefined;
      case "learningpaths":
        if (!id) return undefined;
        return {
          kind: "learningpath",
          id,
          stepId: third === "steps" && fourth && numeric.test(fourth) ? Number(fourth) : undefined,
        };
      case "concept":
        return id ? { kind: "concept", id } : undefined;
      case "image":
        return id ? { kind: "image", id } : undefined;
      case "audio":
        return id ? { kind: "audio", id } : undefined;
      case "podkast":
        return id ? { kind: "podcast-series", id } : undefined;
      case "video":
        return second ? { kind: "video", id: second } : undefined;
      case "r":
      case "e":
      case "f":
        return parseContextPath(segments.slice(1));
      case "utdanning":
        return third && contextIdPattern.test(third) ? { kind: "context", contextId: third } : undefined;
      default:
        return undefined;
    }
  })();

  return target ? { language, target } : undefined;
};

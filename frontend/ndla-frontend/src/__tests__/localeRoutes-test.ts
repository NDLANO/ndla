/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { matchRoutes } from "react-router";
import { routes as appRoutes } from "../appRoutes";
import { supportedLanguages } from "../i18n";
import type { NdlaRouteObject } from "../interfaces";
import { withLocalePrefixes } from "../localeRoutes";
import { flattenedRoutes } from "../routes";

const localeRoutes = withLocalePrefixes(appRoutes);

/** The route tree the `:lang?` alternative would produce, kept here only to compare ranking. */
const optionalParamRoutes: NdlaRouteObject[] = appRoutes.map((route) => ({ ...route, path: "/:lang?" }));

/** Identifies the page a path lands on. Every leaf in the tree carries an `importPath`. */
const leafOf = (routes: NdlaRouteObject[], path: string): string | undefined => {
  const matches = matchRoutes(routes, path);
  const leaf = matches?.[matches.length - 1]?.route as NdlaRouteObject | undefined;
  return leaf?.importPath ?? leaf?.path;
};

/** Both variants of a pattern: optional params omitted, and optional params filled in. */
const toConcretePaths = (pattern: string): string[] => {
  const segments = pattern.split("/").filter(Boolean);
  const fill = (segment: string) => (segment.startsWith(":") ? segment.replace(/^:|\?$/g, "") : segment);
  const withOptional = segments.map(fill);
  const withoutOptional = segments.filter((segment) => !segment.endsWith("?")).map(fill);
  return [...new Set([`/${withoutOptional.join("/")}`, `/${withOptional.join("/")}`])];
};

const samplePaths = flattenedRoutes.flatMap(toConcretePaths);

/** Paths the e2e suite actually navigates to, stripped of query strings. */
const e2ePaths = [
  "/",
  "/article/1",
  "/f/ndla-film/24d0e0db3c02",
  "/learningpaths/8",
  "/minndla",
  "/minndla/folders",
  "/minndla/learningpaths",
  "/minndla/profile",
  "/minndla/subjects",
  "/r/yrkesfaglig-fordypning-hs-hsf-vg1/arsplan-helse--og-oppvekstfag/53a49f710c",
  "/search",
];

describe("withLocalePrefixes", () => {
  test("covers the sample corpus", () => {
    expect(samplePaths.length).toBeGreaterThan(30);
    expect(samplePaths).toEqual(expect.arrayContaining(["/", "/search", "/minndla/folders/folderId"]));
  });

  test("leaves unprefixed paths resolving exactly as they do today", () => {
    const changed = samplePaths.filter((path) => leafOf(localeRoutes, path) !== leafOf(appRoutes, path));
    expect(changed).toEqual([]);
  });

  test.each(supportedLanguages)("resolves every route the same way under /%s", (lang) => {
    const changed = samplePaths.filter((path) => {
      const prefixed = path === "/" ? `/${lang}` : `/${lang}${path}`;
      return leafOf(localeRoutes, prefixed) !== leafOf(appRoutes, path);
    });
    expect(changed).toEqual([]);
  });

  test.each(supportedLanguages)("resolves the paths the e2e suite visits under /%s", (lang) => {
    const changed = e2ePaths.filter((path) => {
      const prefixed = path === "/" ? `/${lang}` : `/${lang}${path}`;
      return leafOf(localeRoutes, prefixed) !== leafOf(appRoutes, path);
    });
    expect(changed).toEqual([]);
  });

  test("a bare locale lands on the front page", () => {
    const frontPage = leafOf(appRoutes, "/");
    for (const lang of supportedLanguages) {
      expect(leafOf(localeRoutes, `/${lang}`)).toBe(frontPage);
    }
  });

  test("does not let a locale branch swallow a same-shaped content path", () => {
    expect(leafOf(localeRoutes, "/om/personvern")).toBe("src/containers/AboutPageV2/AboutPageV2.tsx");
    expect(leafOf(localeRoutes, "/nn/om/personvern")).toBe("src/containers/AboutPageV2/AboutPageV2.tsx");
    expect(leafOf(localeRoutes, "/samling/en")).toBe("src/containers/CollectionPage/CollectionPage.tsx");
  });

  test("keeps an unknown first segment a 404, as it is today", () => {
    const notFound = "src/containers/NotFoundPage/NotFoundPage.tsx";
    expect(leafOf(appRoutes, "/xx/search")).toBe(notFound);
    expect(leafOf(localeRoutes, "/xx/search")).toBe(notFound);
    expect(leafOf(localeRoutes, "/da")).toBe(notFound);
  });
});

describe("the `:lang?` alternative", () => {
  test("ranks known locales correctly too", () => {
    expect(leafOf(optionalParamRoutes, "/nn/search")).toBe(leafOf(appRoutes, "/search"));
    expect(leafOf(optionalParamRoutes, "/search")).toBe(leafOf(appRoutes, "/search"));
  });

  // This is why the spike uses static prefixes: `:lang?` matches any first segment, so garbage
  // that is a 404 today would start rendering real pages under a bogus locale.
  test("but treats any unknown first segment as a locale", () => {
    expect(leafOf(appRoutes, "/xx/search")).toBe("src/containers/NotFoundPage/NotFoundPage.tsx");
    expect(leafOf(optionalParamRoutes, "/xx/search")).toBe("src/containers/SearchPage/SearchPage.tsx");
  });
});

describe("route-aware chunk preloading", () => {
  // getLazyLoadedChunks() matches `req.path` (which still carries the locale) against the
  // unprefixed tree, so today every non-default locale preloads the NotFoundPage chunk.
  test("the prefixed tree matches a locale-carrying request path", () => {
    expect(leafOf(appRoutes, "/nn/search")).toBe("src/containers/NotFoundPage/NotFoundPage.tsx");
    expect(leafOf(localeRoutes, "/nn/search")).toBe("src/containers/SearchPage/SearchPage.tsx");
  });
});

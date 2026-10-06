/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { matchRoutes, type RouteObject } from "react-router";
import { LocaleValues, withLocalePrefixes } from "../localeRoutes";
import { routes } from "../routes";

const localeRoutes = withLocalePrefixes(routes);

/** The route tree the `:lang?` alternative would produce, kept here only to compare ranking. */
const optionalParamRoutes: RouteObject[] = routes.map((route) =>
  route.path === "/" ? { ...route, path: "/:lang?" } : route,
);

/** Identifies the page a path lands on. Every leaf in the tree has its own `lazy` function. */
const leafOf = (tree: RouteObject[], path: string) => matchRoutes(tree, path)?.at(-1)?.route.lazy;

const flattenPaths = (tree: RouteObject[], parentPath = ""): string[] =>
  tree.flatMap((route) => {
    const path = route.path ? `${parentPath.replace(/\/$/, "")}/${route.path.replace(/^\//, "")}` : parentPath;
    return [...(route.lazy ? [path || "/"] : []), ...(route.children ? flattenPaths(route.children, path) : [])];
  });

/** Both variants of a pattern: optional params omitted, and optional params filled in. */
const toConcretePaths = (pattern: string): string[] => {
  const segments = pattern.split("/").filter(Boolean);
  const fill = (segment: string) =>
    segment === "*" ? "splat" : segment.startsWith(":") ? segment.replace(/^:|\?$/g, "") : segment;
  const withOptional = segments.map(fill);
  const withoutOptional = segments.filter((segment) => !segment.endsWith("?")).map(fill);
  return [...new Set([`/${withoutOptional.join("/")}`, `/${withOptional.join("/")}`])];
};

const samplePaths = flattenPaths(routes).flatMap(toConcretePaths);

/** Paths the e2e suite actually navigates to, stripped of query strings. */
const e2ePaths = [
  "/",
  "/concept/1/edit/nb",
  "/edit-markup/800/nb",
  "/film/nb",
  "/search/audio",
  "/search/content",
  "/search/image",
  "/structure/",
  "/subject-matter/frontpage-article/800/edit/nb",
  "/subject-matter/frontpage-article/new",
  "/subject-matter/learning-resource/800/edit/nb",
  "/subject-matter/learning-resource/new",
];

const withPrefix = (lang: string, path: string) => (path === "/" ? `/${lang}` : `/${lang}${path}`);

const notFound = leafOf(routes, "/does-not-exist");

describe("withLocalePrefixes", () => {
  test("covers the sample corpus", () => {
    expect(samplePaths.length).toBeGreaterThan(40);
    expect(samplePaths).toEqual(
      expect.arrayContaining(["/", "/learningpath/new", "/subject-matter/learning-resource/id/edit/selectedLanguage"]),
    );
    expect(samplePaths.filter((path) => !leafOf(routes, path))).toEqual([]);
  });

  test("leaves unprefixed paths resolving exactly as they do today", () => {
    const changed = samplePaths.filter((path) => leafOf(localeRoutes, path) !== leafOf(routes, path));
    expect(changed).toEqual([]);
  });

  test.each(LocaleValues)("resolves every route the same way under /%s", (lang) => {
    const changed = samplePaths.filter((path) => leafOf(localeRoutes, withPrefix(lang, path)) !== leafOf(routes, path));
    expect(changed).toEqual([]);
  });

  test.each(LocaleValues)("resolves the paths the e2e suite visits under /%s", (lang) => {
    const changed = e2ePaths.filter((path) => leafOf(localeRoutes, withPrefix(lang, path)) !== leafOf(routes, path));
    expect(changed).toEqual([]);
  });

  test("a bare locale lands on the welcome page", () => {
    const welcomePage = leafOf(routes, "/");
    for (const lang of LocaleValues) {
      expect(leafOf(localeRoutes, `/${lang}`)).toBe(welcomePage);
      expect(leafOf(localeRoutes, `/${lang}/`)).toBe(welcomePage);
    }
  });

  test("does not mistake a content language segment for a locale prefix", () => {
    const film = leafOf(routes, "/film/nb");
    expect(leafOf(localeRoutes, "/film/nn")).toBe(film);
    expect(leafOf(localeRoutes, "/nn/film/en")).toBe(film);
    expect(leafOf(localeRoutes, "/nn/subject-matter/learning-resource/800/edit/nb")).toBe(
      leafOf(routes, "/subject-matter/learning-resource/800/edit/nb"),
    );
  });

  test("keeps an unknown or content-only locale as the first segment a 404, as it is today", () => {
    expect(notFound).toBeDefined();
    for (const path of ["/xx/structure", "/da", "/nnorsk", "/se/structure", "/ukr"]) {
      expect(leafOf(routes, path)).toBe(notFound);
      expect(leafOf(localeRoutes, path)).toBe(notFound);
    }
  });

  test("prefixes the routes outside of the main layout", () => {
    const h5p = leafOf(routes, "/h5p");
    expect(h5p).toBeDefined();
    expect(leafOf(localeRoutes, "/h5p")).toBe(h5p);
    expect(leafOf(localeRoutes, "/nn/h5p")).toBe(h5p);
  });
});

describe("the `:lang?` alternative", () => {
  test("ranks known locales correctly too", () => {
    expect(leafOf(optionalParamRoutes, "/nn/structure")).toBe(leafOf(routes, "/structure"));
    expect(leafOf(optionalParamRoutes, "/structure")).toBe(leafOf(routes, "/structure"));
  });

  // This is why static prefixes are used: `:lang?` matches any first segment, so garbage that is a 404
  // today would start rendering real pages under a bogus locale.
  test("but treats any unknown first segment as a locale", () => {
    expect(leafOf(routes, "/xx/structure")).toBe(notFound);
    expect(leafOf(optionalParamRoutes, "/xx/structure")).toBe(leafOf(routes, "/structure"));
  });
});

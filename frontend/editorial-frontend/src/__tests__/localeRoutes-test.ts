/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type AppRoute, routes as appRoutes } from "../appRoutes";
import { LocaleValues } from "../localeRoutes";
import routeConfig from "../routes";
import { leafOf, toRouteObjects } from "./routeTestUtils";

/** The route tree without locale prefixes, which every locale branch is generated from. */
const unprefixedRoutes = toRouteObjects(appRoutes);

/** The route config React Router serves, with a branch per locale. */
const localeRoutes = toRouteObjects(routeConfig);

/** The route tree the `:lang?` alternative would produce, kept here only to compare ranking. */
const optionalParamRoutes = unprefixedRoutes.map((route) =>
  route.path === "/" ? { ...route, path: "/:lang?" } : route,
);

const flattenPaths = (routes: AppRoute[], parentPath = ""): string[] =>
  routes.flatMap((route) => {
    const path = route.path ? `${parentPath.replace(/\/$/, "")}/${route.path.replace(/^\//, "")}` : parentPath;
    return [...(route.file ? [path || "/"] : []), ...(route.children ? flattenPaths(route.children, path) : [])];
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

const samplePaths = flattenPaths(appRoutes).flatMap(toConcretePaths);

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

const welcomePage = "containers/WelcomePage/WelcomePage.tsx";
const notFound = "containers/NotFoundPage/NotFoundPage.tsx";

describe("locale branches", () => {
  test("covers the sample corpus", () => {
    expect(samplePaths.length).toBeGreaterThan(40);
    expect(samplePaths).toEqual(
      expect.arrayContaining(["/", "/learningpath/new", "/subject-matter/learning-resource/id/edit/selectedLanguage"]),
    );
    expect(samplePaths.filter((path) => !leafOf(unprefixedRoutes, path))).toEqual([]);
  });

  test("leaves unprefixed paths resolving exactly as in the route tree", () => {
    const changed = samplePaths.filter((path) => leafOf(localeRoutes, path) !== leafOf(unprefixedRoutes, path));
    expect(changed).toEqual([]);
  });

  test.each(LocaleValues)("resolves every route the same way under /%s", (lang) => {
    const changed = samplePaths.filter(
      (path) => leafOf(localeRoutes, withPrefix(lang, path)) !== leafOf(unprefixedRoutes, path),
    );
    expect(changed).toEqual([]);
  });

  test.each(LocaleValues)("resolves the paths the e2e suite visits under /%s", (lang) => {
    const changed = e2ePaths.filter(
      (path) => leafOf(localeRoutes, withPrefix(lang, path)) !== leafOf(unprefixedRoutes, path),
    );
    expect(changed).toEqual([]);
  });

  test("a bare locale lands on the welcome page", () => {
    expect(leafOf(localeRoutes, "/")).toBe(welcomePage);
    for (const lang of LocaleValues) {
      expect(leafOf(localeRoutes, `/${lang}`)).toBe(welcomePage);
      expect(leafOf(localeRoutes, `/${lang}/`)).toBe(welcomePage);
    }
  });

  test("resolves the relative learningpath paths under a locale", () => {
    expect(leafOf(localeRoutes, "/nn/learningpath/new")).toBe("containers/LearningpathPage/CreateLearningpathPage.tsx");
  });

  test("does not mistake a content language segment for a locale prefix", () => {
    const film = "containers/NdlaFilm/NdlaFilmEditor.tsx";
    expect(leafOf(localeRoutes, "/film/nn")).toBe(film);
    expect(leafOf(localeRoutes, "/nn/film/en")).toBe(film);
    expect(leafOf(localeRoutes, "/nn/subject-matter/learning-resource/800/edit/nb")).toBe(
      "containers/ArticlePage/LearningResourcePage/EditLearningResource.tsx",
    );
  });

  test("keeps an unknown or content-only locale as the first segment a 404", () => {
    for (const path of ["/xx/structure", "/da", "/nnorsk", "/se/structure", "/ukr"]) {
      expect(leafOf(unprefixedRoutes, path)).toBe(notFound);
      expect(leafOf(localeRoutes, path)).toBe(notFound);
    }
  });

  test("prefixes the routes outside of the main layout", () => {
    const h5p = "components/H5pRedirect.tsx";
    expect(leafOf(localeRoutes, "/h5p")).toBe(h5p);
    expect(leafOf(localeRoutes, "/nn/h5p")).toBe(h5p);
  });
});

describe("the `:lang?` alternative", () => {
  test("ranks known locales correctly too", () => {
    expect(leafOf(optionalParamRoutes, "/nn/structure")).toBe(leafOf(unprefixedRoutes, "/structure"));
    expect(leafOf(optionalParamRoutes, "/structure")).toBe(leafOf(unprefixedRoutes, "/structure"));
  });

  // This is why static prefixes are used: `:lang?` matches any first segment, so garbage that is a 404
  // today would start rendering real pages under a bogus locale.
  test("but treats any unknown first segment as a locale", () => {
    expect(leafOf(unprefixedRoutes, "/xx/structure")).toBe(notFound);
    expect(leafOf(optionalParamRoutes, "/xx/structure")).toBe(leafOf(unprefixedRoutes, "/structure"));
  });
});

describe("route ids", () => {
  const collectIds = (entries: typeof routeConfig): string[] =>
    entries.flatMap((entry) => [entry.id ?? "", ...collectIds(entry.children ?? [])]);

  test("are unique, although every locale branch registers the same files", () => {
    const ids = collectIds(routeConfig);
    expect(ids.filter((id) => !id)).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

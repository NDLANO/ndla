/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { routes as appRoutes } from "../appRoutes";
import { supportedLanguages } from "../i18n";
import { flattenedRoutes } from "../routePaths";
import routeConfig from "../routes";
import { leafOf, toRouteObjects } from "./routeTestUtils";

/** The route tree without locale prefixes, which every locale branch is generated from. */
const unprefixedRoutes = toRouteObjects(appRoutes);

/** The route config React Router serves, with a branch per locale. */
const localeRoutes = toRouteObjects(routeConfig);

/** The route tree the `:lang?` alternative would produce, kept here only to compare ranking. */
const optionalParamRoutes = unprefixedRoutes.map((route) => ({ ...route, path: "/:lang?" }));

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

describe("locale branches", () => {
  test("covers the sample corpus", () => {
    expect(samplePaths.length).toBeGreaterThan(30);
    expect(samplePaths).toEqual(expect.arrayContaining(["/", "/search", "/minndla/folders/folderId"]));
  });

  test("leaves unprefixed paths resolving exactly as in the route tree", () => {
    const changed = samplePaths.filter((path) => leafOf(localeRoutes, path) !== leafOf(unprefixedRoutes, path));
    expect(changed).toEqual([]);
  });

  test.each(supportedLanguages)("resolves every route the same way under /%s", (lang) => {
    const changed = samplePaths.filter((path) => {
      const prefixed = path === "/" ? `/${lang}` : `/${lang}${path}`;
      return leafOf(localeRoutes, prefixed) !== leafOf(unprefixedRoutes, path);
    });
    expect(changed).toEqual([]);
  });

  test.each(supportedLanguages)("resolves the paths the e2e suite visits under /%s", (lang) => {
    const changed = e2ePaths.filter((path) => {
      const prefixed = path === "/" ? `/${lang}` : `/${lang}${path}`;
      return leafOf(localeRoutes, prefixed) !== leafOf(unprefixedRoutes, path);
    });
    expect(changed).toEqual([]);
  });

  test("a bare locale lands on the front page", () => {
    const frontPage = leafOf(unprefixedRoutes, "/");
    for (const lang of supportedLanguages) {
      expect(leafOf(localeRoutes, `/${lang}`)).toBe(frontPage);
    }
  });

  test("does not let a locale branch swallow a same-shaped content path", () => {
    expect(leafOf(localeRoutes, "/om/personvern")).toBe("containers/AboutPageV2/AboutPageV2.tsx");
    expect(leafOf(localeRoutes, "/nn/om/personvern")).toBe("containers/AboutPageV2/AboutPageV2.tsx");
    expect(leafOf(localeRoutes, "/samling/en")).toBe("containers/CollectionPage/CollectionPage.tsx");
  });

  test("keeps an unknown first segment a 404", () => {
    const notFound = "containers/NotFoundPage/NotFoundPage.tsx";
    expect(leafOf(unprefixedRoutes, "/xx/search")).toBe(notFound);
    expect(leafOf(localeRoutes, "/xx/search")).toBe(notFound);
    expect(leafOf(localeRoutes, "/da")).toBe(notFound);
  });

  test("resolves the standalone pages outside the locale branches", () => {
    expect(leafOf(localeRoutes, "/article-iframe/nb/article/1")).toBe("iframe/IframePageContainer.tsx");
    expect(leafOf(localeRoutes, "/article-iframe/urn:topic:1/1")).toBe("iframe/IframePageContainer.tsx");
    expect(leafOf(localeRoutes, "/embed-iframe/nn/video/1")).toBe("iframe/EmbedIframePageContainer.tsx");
    expect(leafOf(localeRoutes, "/embed-iframe/video/1")).toBe("iframe/EmbedIframePageContainer.tsx");
    expect(leafOf(localeRoutes, "/lti")).toBe("lti/LtiProvider.tsx");
    expect(leafOf(localeRoutes, "/lti/article-iframe/nb/urn:topic:1/1")).toBe("lti/LtiIframePage.tsx");
  });
});

describe("the `:lang?` alternative", () => {
  test("ranks known locales correctly too", () => {
    expect(leafOf(optionalParamRoutes, "/nn/search")).toBe(leafOf(unprefixedRoutes, "/search"));
    expect(leafOf(optionalParamRoutes, "/search")).toBe(leafOf(unprefixedRoutes, "/search"));
  });

  // This is why the locale branches use static prefixes: `:lang?` matches any first segment, so garbage
  // that is a 404 today would start rendering real pages under a bogus locale.
  test("but treats any unknown first segment as a locale", () => {
    expect(leafOf(unprefixedRoutes, "/xx/search")).toBe("containers/NotFoundPage/NotFoundPage.tsx");
    expect(leafOf(optionalParamRoutes, "/xx/search")).toBe("containers/SearchPage/SearchPage.tsx");
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

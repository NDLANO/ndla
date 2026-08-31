/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { matchPath, matchRoutes } from "react-router";
import { routes as appRoutes } from "../appRoutes";
import { authenticatedRoutes, flattenedRoutes, flattenRoutes, privateRoutes } from "../routes";

const toConcretePath = (pattern: string) =>
  `/${pattern
    .split("/")
    .filter(Boolean)
    .filter((segment) => !segment.endsWith("?"))
    .map((segment) => (segment.startsWith(":") ? "x" : segment))
    .join("/")}`;

const matchedRoute = (pattern: string) => {
  const matches = matchRoutes(appRoutes, toConcretePath(pattern));
  return matches?.[matches.length - 1]?.route;
};

describe("flattenRoutes", () => {
  test("joins nested paths and resolves index routes to their parent", () => {
    expect(
      flattenRoutes([
        {
          path: "/",
          children: [
            { index: true },
            { path: "search" },
            { path: "podkast", children: [{ index: true }, { path: ":id" }] },
          ],
        },
      ]).map((route) => route.path),
    ).toEqual(["/", "/search", "/podkast", "/podkast/:id"]);
  });

  test("skips splat routes, which would match every unmatched request", () => {
    expect(flattenRoutes([{ path: "/", children: [{ path: "404" }, { path: "*" }] }]).map((r) => r.path)).toEqual([
      "/404",
    ]);
  });

  test("keeps optional parameters so a pattern still matches with and without them", () => {
    const pattern = flattenRoutes([{ path: "r", children: [{ path: ":contextId/:stepId?" }] }])[0]?.path;
    expect(pattern).toBe("/r/:contextId/:stepId?");
    expect(matchPath(pattern!, "/r/abc")).toBeTruthy();
    expect(matchPath(pattern!, "/r/abc/1")).toBeTruthy();
  });

  test("applies `private` to the whole subtree, however deeply nested", () => {
    expect(
      flattenRoutes([
        {
          path: "minndla",
          children: [
            { index: true },
            {
              path: "learningpaths",
              private: true,
              children: [
                { index: true },
                { path: ":id/edit", children: [{ path: "steps", children: [{ path: "new" }] }] },
              ],
            },
          ],
        },
      ]),
    ).toEqual([
      { path: "/minndla", private: false, requiresAuth: false },
      { path: "/minndla/learningpaths", private: true, requiresAuth: false },
      { path: "/minndla/learningpaths/:id/edit/steps/new", private: true, requiresAuth: false },
    ]);
  });

  test("does not leak `private` to sibling routes", () => {
    const flat = flattenRoutes([{ path: "a", children: [{ path: "secret", private: true }, { path: "public" }] }]);
    expect(flat).toEqual([
      { path: "/a/secret", private: true, requiresAuth: false },
      { path: "/a/public", private: false, requiresAuth: false },
    ]);
  });

  test("requiring auth implies private", () => {
    expect(flattenRoutes([{ path: "a", requiresAuth: true }])).toEqual([
      { path: "/a", private: true, requiresAuth: true },
    ]);
  });

  test("a child can opt out of an inherited `requiresAuth` but stay private", () => {
    expect(
      flattenRoutes([
        {
          path: "minndla",
          requiresAuth: true,
          children: [{ index: true, requiresAuth: false, private: true }, { path: "profile" }],
        },
      ]),
    ).toEqual([
      { path: "/minndla", private: true, requiresAuth: false },
      { path: "/minndla/profile", private: true, requiresAuth: true },
    ]);
  });

  test("opting out of `requiresAuth` keeps the subtree private", () => {
    expect(
      flattenRoutes([
        {
          path: "a",
          requiresAuth: true,
          children: [{ path: "open", requiresAuth: false, children: [{ path: "deep" }] }, { path: "closed" }],
        },
      ]),
    ).toEqual([
      { path: "/a/open/deep", private: true, requiresAuth: false },
      { path: "/a/closed", private: true, requiresAuth: true },
    ]);
  });

  test("a page can be made cacheable again only by saying so explicitly", () => {
    expect(
      flattenRoutes([
        {
          path: "a",
          requiresAuth: true,
          children: [{ path: "open", requiresAuth: false, private: false }],
        },
      ]),
    ).toEqual([{ path: "/a/open", private: false, requiresAuth: false }]);
  });
});

describe("flattenedRoutes", () => {
  test("covers the pages the app renders", () => {
    expect(flattenedRoutes).toEqual(
      expect.arrayContaining(["/", "/search", "/subjects", "/minndla", "/article/:articleId"]),
    );
  });

  test("contains no splat patterns, so an unmatched request stays unmatched", () => {
    expect(flattenedRoutes.filter((route) => route.includes("*"))).toEqual([]);
  });

  test("every derived pattern resolves back to a real route", () => {
    const unresolved = flattenedRoutes.filter((route) => matchedRoute(route)?.path === "*");
    expect(unresolved).toEqual([]);
  });
});

describe("privateRoutes", () => {
  test("covers every page below /minndla, including the landing page", () => {
    const myNdlaPages = flattenedRoutes.filter((route) => route.startsWith("/minndla"));
    expect(myNdlaPages.filter((route) => !privateRoutes.includes(route))).toEqual([]);
    expect(myNdlaPages.length).toBeGreaterThan(1);
  });

  test("covers the nested learningpath editor and preview steps", () => {
    expect(privateRoutes).toEqual(
      expect.arrayContaining([
        "/minndla/learningpaths/:learningpathId/edit/steps/new",
        "/minndla/learningpaths/:learningpathId/edit/steps/:stepId",
        "/minndla/learningpaths/:learningpathId/preview/:stepId?",
      ]),
    );
  });

  test("contains only pages that exist in the route tree", () => {
    const missing = privateRoutes.filter((route) => {
      const matched = matchedRoute(route);
      return !matched || matched.path === "*";
    });
    expect(missing).toEqual([]);
  });

  test("marks nothing outside My NDLA as private", () => {
    expect(privateRoutes.filter((route) => !route.startsWith("/minndla"))).toEqual([]);
  });
});

describe("authenticatedRoutes", () => {
  // NDLA wants to keep My NDLA landing page viewable without auth session
  test("leaves the My NDLA landing page reachable while logged out", () => {
    expect(authenticatedRoutes).not.toContain("/minndla");
    expect(privateRoutes).toContain("/minndla");
  });

  test("covers every other page below /minndla", () => {
    const myNdlaPages = flattenedRoutes.filter((route) => route.startsWith("/minndla"));
    expect(myNdlaPages.filter((route) => !authenticatedRoutes.includes(route))).toEqual(["/minndla"]);
  });

  test("is a subset of the pages that are never cached", () => {
    expect(authenticatedRoutes.filter((route) => !privateRoutes.includes(route))).toEqual([]);
  });

  test("requires auth for nothing outside My NDLA", () => {
    expect(authenticatedRoutes.filter((route) => !route.startsWith("/minndla"))).toEqual([]);
  });
});

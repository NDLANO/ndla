/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, renderHook, waitFor } from "@testing-library/react";
import { type ReactNode, useEffect } from "react";
import { createMemoryRouter, MemoryRouter, Outlet, RouterProvider, useParams, type RouteObject } from "react-router";
import { LinkPathContext } from "../LinkPathContext";
import {
  createLocalePathHelpers,
  LocaleNavigate,
  useLocaleHref,
  useLocaleNavigate,
  useRawLocation,
} from "../localePath";

const { createLocalePathResolver, useBasePathname } = createLocalePathHelpers(["nb", "nn", "en"]);

const renderAt = <T,>(path: string, locale: string, hook: () => T) =>
  renderHook(hook, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[path]}>
        <LinkPathContext value={createLocalePathResolver(locale)}>{children}</LinkPathContext>
      </MemoryRouter>
    ),
  }).result.current;

describe("createLocalePathResolver", () => {
  const resolve = createLocalePathResolver("nn");

  test("prefixes absolute paths", () => {
    expect(resolve("/search")).toBe("/nn/search");
    expect(resolve("/login?returnTo=%2Fnn%2Fsearch")).toBe("/nn/login?returnTo=%2Fnn%2Fsearch");
  });

  test("turns the root path into the bare prefix, as basename did", () => {
    expect(resolve("/")).toBe("/nn");
    expect(resolve("/?query=test")).toBe("/nn?query=test");
    expect(resolve("/#main")).toBe("/nn#main");
  });

  test("leaves paths that already name a locale alone", () => {
    expect(resolve("/nb/search")).toBe("/nb/search");
    expect(resolve("/nn")).toBe("/nn");
    expect(resolve("/en?query=test")).toBe("/en?query=test");
  });

  test("does not mistake a segment that starts like a locale for one", () => {
    expect(resolve("/nnorsk")).toBe("/nn/nnorsk");
  });

  test("only treats the given locales as prefixes", () => {
    expect(resolve("/se/search")).toBe("/nn/se/search");
    expect(createLocalePathHelpers(["nn", "se"]).createLocalePathResolver("nn")("/se/search")).toBe("/se/search");
  });

  test("is the identity without a locale", () => {
    expect(createLocalePathResolver("")("/search")).toBe("/search");
  });
});

describe("useBasePathname", () => {
  test.each([
    ["/nn/folders/1", "nn", "/folders/1"],
    ["/nn", "nn", "/"],
    ["/nn/article/800/edit/nn", "nn", "/article/800/edit/nn"],
    ["/nnorsk", "nn", "/nnorsk"],
    ["/folders/1", "", "/folders/1"],
    ["/", "", "/"],
  ] as const)("%s is %s", (path, locale, expected) => {
    expect(renderAt(path, locale, useBasePathname)).toBe(expected);
  });
});

describe("useLocaleHref", () => {
  test("prefixes an unprefixed target", () => {
    expect(renderAt("/nn/search", "nn", () => useLocaleHref("/logout?returnTo=/"))).toBe("/nn/logout?returnTo=/");
  });

  test("leaves the current location as it is", () => {
    expect(renderAt("/nn/search?query=test", "nn", () => useLocaleHref(useRawLocation()))).toBe(
      "/nn/search?query=test",
    );
  });
});

describe("navigation", () => {
  const renderRouter = (routes: RouteObject[], path: string) => {
    const router = createMemoryRouter(
      routes.flatMap((route) => [route, { ...route, path: `/nn${route.path}` }]),
      { initialEntries: [path] },
    );
    render(
      <LinkPathContext value={createLocalePathResolver("nn")}>
        <RouterProvider router={router} />
      </LinkPathContext>,
    );
    return router;
  };

  test("useLocaleNavigate prefixes absolute targets", async () => {
    const Navigator = () => {
      const navigate = useLocaleNavigate();
      useEffect(() => {
        navigate("/search");
      }, [navigate]);
      return null;
    };
    const router = renderRouter([{ path: "/", element: <Navigator />, children: [{ path: "*" }] }], "/nn");
    await waitFor(() => expect(router.state.location.pathname).toBe("/nn/search"));
  });

  test("LocaleNavigate resolves relative targets against the prefixed route", () => {
    const Redirect = () => {
      const { selectedLanguage } = useParams();
      return selectedLanguage ? <Outlet /> : <LocaleNavigate to="nb" replace />;
    };
    const router = renderRouter(
      [
        {
          path: "/",
          children: [{ path: "article/:id/edit", element: <Redirect />, children: [{ path: ":selectedLanguage?" }] }],
        },
      ],
      "/nn/article/1/edit",
    );
    expect(router.state.location.pathname).toBe("/nn/article/1/edit/nb");
  });
});

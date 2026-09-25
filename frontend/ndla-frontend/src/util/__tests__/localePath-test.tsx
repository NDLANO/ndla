/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LinkPathContext } from "@ndla/safelink";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router";
import type { PathLocale } from "../../interfaces";
import { createLocalePathResolver, useBasePathname, useLocaleHref } from "../localePath";

const renderAt = <T,>(path: string, locale: PathLocale, hook: () => T) =>
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
    expect(resolve("/login?returnTo=/nn/minndla")).toBe("/nn/login?returnTo=/nn/minndla");
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

  test("is the identity for the default locale", () => {
    expect(createLocalePathResolver("")("/search")).toBe("/search");
  });
});

describe("useBasePathname", () => {
  test.each([
    ["/nn/minndla/folders", "nn", "/minndla/folders"],
    ["/nn", "nn", "/"],
    ["/minndla/folders", "", "/minndla/folders"],
    ["/", "", "/"],
  ] as const)("%s is %s", (path, locale, expected) => {
    expect(renderAt(path, locale, useBasePathname)).toBe(expected);
  });
});

describe("useLocaleHref", () => {
  test("prefixes an unprefixed target", () => {
    expect(renderAt("/nn/minndla", "nn", () => useLocaleHref("/logout?returnTo=/"))).toBe("/nn/logout?returnTo=/");
  });

  test("leaves the current location as it is", () => {
    expect(renderAt("/nn/search?query=test", "nn", () => useLocaleHref(useLocation()))).toBe("/nn/search?query=test");
  });
});

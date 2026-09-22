/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LinkPathContext } from "@ndla/safelink";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import type { PathLocale } from "../../interfaces";
import { createLocalePathResolver } from "../../util/localePath";
import { PageTitle } from "../PageTitle";
import { SocialMediaMetadata } from "../SocialMediaMetadata";

const renderAt = (path: string, locale: PathLocale, ui: ReactNode) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LinkPathContext value={createLocalePathResolver(locale)}>{ui}</LinkPathContext>
    </MemoryRouter>,
  );

const renderMetadata = (path: string, locale: PathLocale, canonicalPath?: string) => {
  const { unmount } = renderAt(
    path,
    locale,
    canonicalPath ? (
      <SocialMediaMetadata title="Title" canonicalPath={canonicalPath} />
    ) : (
      <SocialMediaMetadata title="Title" useLocationForCanonicalPath />
    ),
  );
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
  const alternates = [...document.querySelectorAll('link[rel="alternate"]')].map(
    (link) => `${link.getAttribute("hreflang")} ${link.getAttribute("href")}`,
  );
  unmount();
  return { canonical, alternates };
};

describe("SocialMediaMetadata", () => {
  test.each([
    ["/search", "", undefined, "https://test.ndla.no/search"],
    ["/nb/search", "nb", undefined, "https://test.ndla.no/search"],
    ["/nn/search", "nn", undefined, "https://test.ndla.no/nn/search"],
    ["/r/fag/emne/123", "", "/r/fag/emne/123", "https://test.ndla.no/r/fag/emne/123"],
    ["/nb/r/fag/emne/123", "nb", "/r/fag/emne/123", "https://test.ndla.no/r/fag/emne/123"],
    ["/nn/r/fag/emne/123", "nn", "/r/fag/emne/123", "https://test.ndla.no/nn/r/fag/emne/123"],
    ["/en/r/fag/emne/123", "en", "/r/fag/emne/123", "https://test.ndla.no/en/r/fag/emne/123"],
  ] as const)("canonical for %s with prefix %j and canonicalPath %j is %s", (path, locale, canonicalPath, expected) => {
    expect(renderMetadata(path, locale, canonicalPath).canonical).toBe(expected);
  });

  test.each([
    ["/search", "", "/search"],
    ["/nn/search", "nn", "/search"],
    ["/", "", "/"],
    ["/nn", "nn", "/"],
    ["/en", "en", "/"],
  ] as const)("alternates for %s with prefix %j are those of %s", (path, locale, basePath) => {
    expect(renderMetadata(path, locale).alternates).toEqual([
      `nb https://test.ndla.no/nb${basePath}`,
      `nn https://test.ndla.no/nn${basePath}`,
    ]);
  });
});

describe("PageTitle", () => {
  beforeEach(() => {
    window._mtm = [];
  });

  test.each([
    ["/search", "", "/search"],
    ["/nn/search", "nn", "/search"],
    ["/", "", "/"],
    ["/nn", "nn", "/"],
  ] as const)("tracks %s with prefix %j as %s", (path, locale, expected) => {
    renderAt(path, locale, <PageTitle title="Title" useLocationForCustomPath />);
    expect(window._mtm).toEqual([
      expect.objectContaining({ CustomPath: expected, CustomUrl: `https://test.ndla.no${expected}` }),
    ]);
  });
});

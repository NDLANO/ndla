/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LinkPathContext } from "@ndla/safelink";
import { act, render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { RelatedArticle, RelatedArticleList } from "../RelatedArticleList";

test("shows all related articles and their urls when printing", () => {
  const { container } = render(
    <MemoryRouter>
      <RelatedArticleList>
        {[1, 2, 3, 4].map((i) => (
          <RelatedArticle key={i} title={`Article ${i}`} to={`/article/${i}`} />
        ))}
      </RelatedArticleList>
    </MemoryRouter>,
  );
  expect(container.querySelector("[data-expanded='false']")).not.toBeNull();
  act(() => {
    window.dispatchEvent(new Event("beforeprint"));
  });
  expect(container.textContent).toContain("/article/4");
});

test("printed url matches the locale-prefixed link href", () => {
  const { container } = render(
    <MemoryRouter>
      <LinkPathContext value={(to) => `/nn${to}`}>
        <RelatedArticle title="Article" to="/article/1" />
      </LinkPathContext>
    </MemoryRouter>,
  );
  act(() => {
    window.dispatchEvent(new Event("beforeprint"));
  });
  const href = container.querySelector("a")?.href;
  expect(href).toBe(`${window.location.origin}/nn/article/1`);
  expect(container.textContent).toContain(href);
});

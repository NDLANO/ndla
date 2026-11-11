/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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

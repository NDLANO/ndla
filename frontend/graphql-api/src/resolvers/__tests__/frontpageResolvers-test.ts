/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ArticleV2DTO } from "@ndla/types-backend/article-api";
import type { MenuDTO } from "@ndla/types-backend/frontpage-api";
import DataLoader from "dataloader";
import { describe, expect, it } from "vitest";
import { resolvers } from "../frontpageResolvers";

const menuItem = (articleId: number, menu: MenuDTO[] = []): MenuDTO => ({ articleId, menu });

const contextWithArticles = (existingIds: number[]) =>
  ({
    loaders: {
      articlesLoader: new DataLoader<string, ArticleV2DTO | undefined>(async (ids) =>
        ids.map((id) => (existingIds.includes(Number(id)) ? ({ id: Number(id) } as ArticleV2DTO) : undefined)),
      ),
    },
  }) as unknown as ContextWithLoaders;

describe("FrontpageMenu.menu", () => {
  it("removes menu items whose article does not exist", async () => {
    const menu = menuItem(1, [menuItem(2), menuItem(3, [menuItem(4)]), menuItem(5)]);
    const result = await resolvers.FrontpageMenu.menu(menu, {}, contextWithArticles([1, 2, 5]));
    expect(result.map((item) => item.articleId)).toEqual([2, 5]);
  });

  it("keeps all menu items when every article exists", async () => {
    const menu = menuItem(1, [menuItem(2), menuItem(3)]);
    const result = await resolvers.FrontpageMenu.menu(menu, {}, contextWithArticles([1, 2, 3]));
    expect(result).toEqual(menu.menu);
  });

  it("throws when articles fail to load", async () => {
    const context = {
      loaders: {
        articlesLoader: new DataLoader<string, ArticleV2DTO | undefined>(async () => {
          throw new Error("article-api unavailable");
        }),
      },
    } as unknown as ContextWithLoaders;
    await expect(resolvers.FrontpageMenu.menu(menuItem(1, [menuItem(2)]), {}, context)).rejects.toThrow(
      "article-api unavailable",
    );
  });
});

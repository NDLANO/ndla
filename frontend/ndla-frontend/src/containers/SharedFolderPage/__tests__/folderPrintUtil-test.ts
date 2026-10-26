/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GQLMyNdlaResourceFragment } from "../../../graphqlTypes";
import { getAllResources } from "../folderPrintUtil";

const resource = (id: string, resourceId: string, resourceType = "article", path = `/r/${resourceId}`) =>
  ({
    __typename: "MyNdlaResource",
    id,
    resourceId,
    resourceType,
    path,
    created: "2026-01-01T00:00:00Z",
    tags: [],
  }) satisfies GQLMyNdlaResourceFragment;

test("includes resources from nested subfolders", () => {
  const folder = {
    resources: [resource("1", "100")],
    subfolders: [
      { resources: [resource("2", "200")], subfolders: [{ resources: [resource("3", "300")] }] },
      { resources: [resource("4", "400")] },
    ],
  };
  expect(getAllResources(folder).map((r) => r.id)).toEqual(["1", "2", "3", "4"]);
});

test("keeps only the first occurrence of the same content", () => {
  const folder = {
    resources: [resource("1", "100", "article", "/a/100")],
    subfolders: [{ resources: [resource("2", "100", "article", "/b/100"), resource("3", "100", "image")] }],
  };
  expect(getAllResources(folder).map((r) => r.id)).toEqual(["1", "3"]);
});

test("handles folders without resources", () => {
  expect(getAllResources({ resources: [], subfolders: [{ resources: [] }] })).toEqual([]);
});

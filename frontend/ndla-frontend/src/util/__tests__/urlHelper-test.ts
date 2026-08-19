/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { isValidContextId, removeTrackingQueryParams } from "../urlHelper";

test("isValidContextId", () => {
  expect(isValidContextId("1022072a8411")).toBe(true);
  expect(isValidContextId("5ad439a5dacb")).toBe(true);
  expect(isValidContextId("_vendor-DAL8SGeP.js")).toBe(false);
  expect(isValidContextId("83ce68bc-19c9-4f2b-8dba-caf401428f21")).toBe(false);
});

test("removeTrackingQueryParams", () => {
  expect(removeTrackingQueryParams("/some/path?fbclid=123&foo=bar")).toBe("/some/path?foo=bar");
  expect(removeTrackingQueryParams("/some/path?gclid=456&foo=bar")).toBe("/some/path?foo=bar");
  expect(removeTrackingQueryParams("/some/path?fbclid=123&gclid=456")).toBe("/some/path");
  expect(removeTrackingQueryParams("/some/path?foo=bar")).toBe("/some/path?foo=bar");
  expect(removeTrackingQueryParams("/some/path")).toBe("/some/path");
  expect(removeTrackingQueryParams("https://ndla.no/some/path?fbclid=123&foo=bar")).toBe(
    "https://ndla.no/some/path?foo=bar",
  );
});

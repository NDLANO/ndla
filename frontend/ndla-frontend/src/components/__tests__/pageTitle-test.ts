/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getCampaignQuery, getTrackedPath } from "../PageTitle";

test.each([
  ["", ""],
  ["?query=test&page=2", ""],
  ["?a=1&b=2&mtm_campaign=x", "?mtm_campaign=x"],
  ["?mtm_campaign=varsling&mtm_source=banner", "?mtm_campaign=varsling&mtm_source=banner"],
  ["?query=test&utm_source=newsletter&utm_medium=email", "?utm_source=newsletter&utm_medium=email"],
  ["?pk_campaign=spring&pk_kwd=math&pk_vid=abc", "?pk_campaign=spring&pk_kwd=math"],
  [
    "?matomo_campaign=a&piwik_kwd=b&mtm_cid=c&mtm_group=d&mtm_placement=e",
    "?matomo_campaign=a&piwik_kwd=b&mtm_cid=c&mtm_group=d&mtm_placement=e",
  ],
  ["?mtm_campaign=hello%20world", "?mtm_campaign=hello+world"],
])("getCampaignQuery(%j) is %j", (search, expected) => {
  expect(getCampaignQuery(search)).toBe(expected);
});

test("getTrackedPath with article-url and empty language", () => {
  const url = getTrackedPath("/article/123");
  expect(url).toMatch("/article/123");
});

test("getTrackedPath with article-url and non-default language", () => {
  const url = getTrackedPath("/nn/article/123");
  expect(url).toMatch("/article/123");
});

test("getTrackedPath with article-url and default language", () => {
  const url = getTrackedPath("/nb/article/123");
  expect(url).toMatch("/article/123");
});

test("getTrackedPath with iframe-url and nb language", () => {
  const url = getTrackedPath("/article-iframe/nb/urn:topic:123/1");
  expect(url).toMatch("/article-iframe/urn:topic:123/1");
});

test("getTrackedPath with iframe-url and nn language", () => {
  const url = getTrackedPath("/article-iframe/nn/urn:topic:123/1");
  expect(url).toMatch("/article-iframe/urn:topic:123/1");
});

test("getTrackedPath with iframe-url and no language", () => {
  const url = getTrackedPath("/article-iframe/urn:topic:123/1");
  expect(url).toMatch("/article-iframe/urn:topic:123/1");
});

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { isAllowedSpecUrl } from "../specUrl.js";

const prod = { apiDomain: "https://api.test.ndla.no", allowLocalhost: false };
const local = { ...prod, allowLocalhost: true };

it("allows specs served from the api domain", () => {
  expect(isAllowedSpecUrl("https://api.test.ndla.no/article-api/api-docs", prod)).toBe(true);
  expect(isAllowedSpecUrl("https://api.test.ndla.no", prod)).toBe(true);
});

it("rejects specs from any other origin", () => {
  expect(isAllowedSpecUrl("https://evil.example.com/api-docs", prod)).toBe(false);
  expect(isAllowedSpecUrl("http://api.test.ndla.no/api-docs", prod)).toBe(false);
  expect(isAllowedSpecUrl("https://api.test.ndla.no.evil.example.com/api-docs", prod)).toBe(false);
  expect(isAllowedSpecUrl("https://api.test.ndla.no:8080/api-docs", prod)).toBe(false);
  expect(isAllowedSpecUrl("https://evil.example.com/?x=https://api.test.ndla.no", prod)).toBe(false);
});

it("rejects urls that are not absolute http(s) urls", () => {
  expect(isAllowedSpecUrl("/article-api/api-docs", prod)).toBe(false);
  expect(isAllowedSpecUrl("//api.test.ndla.no/api-docs", prod)).toBe(false);
  expect(isAllowedSpecUrl("javascript:alert(1)", prod)).toBe(false);
  expect(isAllowedSpecUrl("data:application/json,{}", prod)).toBe(false);
  expect(isAllowedSpecUrl("", prod)).toBe(false);
});

it("allows localhost only when localhost is allowed", () => {
  expect(isAllowedSpecUrl("http://localhost:3000/api-docs", local)).toBe(true);
  expect(isAllowedSpecUrl("http://127.0.0.1:3000/api-docs", local)).toBe(true);
  expect(isAllowedSpecUrl("http://[::1]:3000/api-docs", local)).toBe(true);

  expect(isAllowedSpecUrl("http://localhost:3000/api-docs", prod)).toBe(false);
  expect(isAllowedSpecUrl("http://evil.localhost.example.com/api-docs", local)).toBe(false);
});

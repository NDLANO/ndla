/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getCookieString } from "../cookieHandler";
import { getCookie, getDecodedCookie, isValidCookie } from "../index";

const testCookieKey = "COOKIE_KEY";
const dummyCookies =
  'COOKIE_KEY={"1":true,"2":true,"3":true}; OTHER_COOKIE_KEYS={"test":true}; THIRD_COOKIE=ONEWITH=IN;';

const dupeCookies = "FIRST=one; FIRST_NAME_AND_LAST_NAME=Jesus=Christ; FIRST_NAME=Mark;";

test("getCookie should return the requested value", () => {
  expect(getCookie(testCookieKey, dummyCookies)).toBe('{"1":true,"2":true,"3":true}');
});

test("getCookie should return undefined for missing cookie", () => {
  expect(getCookie("NEW_COOKIE_KEY", dummyCookies)).toBe(undefined);
});

test("getCookie should match the exact cookie passed in", () => {
  expect(getCookie("FIRST_NAME", dupeCookies)).toBe("Mark");
});

test("test that cookies with = signs work", () => {
  expect(getCookie("THIRD_COOKIE", dummyCookies)).toBe("ONEWITH=IN");
});

test("getDecodedCookie should decode a percent-encoded value", () => {
  expect(getDecodedCookie("RETURN_TO", "RETURN_TO=%2Fminndla%2Fmeny%3Fvisning%3Dliste;")).toBe(
    "/minndla/meny?visning=liste",
  );
});

test("getDecodedCookie should return undefined for a missing or malformed value", () => {
  expect(getDecodedCookie("NEW_COOKIE_KEY", dummyCookies)).toBe(undefined);
  expect(getDecodedCookie("RETURN_TO", "RETURN_TO=%;")).toBe(undefined);
});

test("test isValidCookie existingCookie", () => {
  expect(isValidCookie(testCookieKey, dummyCookies)).toBe(true);
});

test("test isValidCookie newCookie", () => {
  expect(isValidCookie("NEW_COOKIE_KEY", dummyCookies)).toBe(false);
});

test("removeCookie produces an expires attribute the browser can parse", () => {
  const cookieString = getCookieString({ cookieName: testCookieKey, cookieValue: "", removeCookie: true });
  expect(cookieString).toContain("expires=Thu, 01 Jan 1970 00:00:01 GMT");
});

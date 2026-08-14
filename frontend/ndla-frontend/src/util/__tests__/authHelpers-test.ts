/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getCookie } from "@ndla/util";
import { afterEach, expect, test, vi } from "vitest";
import { FEIDE_ID_TOKEN_COOKIE, SESSION_EXPIRY_COOKIE } from "../../constants";
import { invalidateSession, isActiveSession, subscribeToSession } from "../authHelpers";

const startSession = () => {
  const expiry = new Date().getTime() + 60 * 60 * 1000;
  document.cookie = `${FEIDE_ID_TOKEN_COOKIE}=an-id-token; path=/`;
  document.cookie = `${SESSION_EXPIRY_COOKIE}=${expiry}; path=/`;
};

afterEach(() => {
  document.cookie = `${FEIDE_ID_TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/`;
  document.cookie = `${SESSION_EXPIRY_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/`;
});

test("invalidateSession clears the auth cookies and notifies subscribers", () => {
  startSession();
  const listener = vi.fn();
  const unsubscribe = subscribeToSession(listener);

  invalidateSession();

  expect(listener).toHaveBeenCalledTimes(1);
  expect(getCookie(FEIDE_ID_TOKEN_COOKIE, document.cookie)).toBeUndefined();
  expect(isActiveSession(getCookie(SESSION_EXPIRY_COOKIE, document.cookie))).toBe(false);

  unsubscribe();
});

test("invalidateSession is a no-op without an active session, so a batch of 401s only acts once", () => {
  startSession();
  const listener = vi.fn();
  const unsubscribe = subscribeToSession(listener);

  invalidateSession();
  invalidateSession();
  invalidateSession();

  expect(listener).toHaveBeenCalledTimes(1);

  unsubscribe();
});

test("unsubscribing stops the listener from being notified", () => {
  startSession();
  const listener = vi.fn();

  subscribeToSession(listener)();
  invalidateSession();

  expect(listener).not.toHaveBeenCalled();
});

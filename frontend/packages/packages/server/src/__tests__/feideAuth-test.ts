/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { feideTokenExpiry, type FeideTokens, upsertMyNdlaUser } from "../feideAuth";

const tokensWithClaims = (claims: { exp?: number } | undefined): FeideTokens =>
  ({ claims: () => claims }) as unknown as FeideTokens;

describe("feideTokenExpiry", () => {
  it("converts the exp claim from seconds to a date", () => {
    expect(feideTokenExpiry(tokensWithClaims({ exp: 1767225600 }))).toEqual(new Date("2026-01-01T00:00:00.000Z"));
  });

  it("is undefined rather than the epoch when exp is missing", () => {
    expect(feideTokenExpiry(tokensWithClaims({}))).toBeUndefined();
    expect(feideTokenExpiry(tokensWithClaims(undefined))).toBeUndefined();
  });
});

describe("upsertMyNdlaUser", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const stubFetch = (response: Response) => {
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    return async () => {
      const [input, init] = fetchMock.mock.calls[0] as [Request | string, RequestInit | undefined];
      const request = input instanceof Request ? input : new Request(input, init);
      return {
        url: request.url,
        method: request.method,
        feideAuthorization: request.headers.get("FeideAuthorization"),
        contentType: request.headers.get("Content-Type"),
        body: await request.text(),
      };
    };
  };

  it("puts the access token to myndla-api with the id token as Feide authorization", async () => {
    const readRequest = stubFetch(Response.json({ id: 1 }, { status: 200 }));

    const data = await upsertMyNdlaUser({
      apiUrl: "https://api.test.ndla.no",
      idToken: "an-id-token",
      accessToken: "an-access-token",
    });

    expect(await readRequest()).toEqual({
      url: "https://api.test.ndla.no/myndla-api/v1/users",
      method: "PUT",
      feideAuthorization: "Bearer an-id-token",
      contentType: "application/json",
      body: JSON.stringify({ accessToken: "an-access-token" }),
    });
    expect(data).toEqual({ id: 1 });
  });

  const upsert = () =>
    upsertMyNdlaUser({
      apiUrl: "https://api.test.ndla.no",
      idToken: "an-id-token",
      accessToken: "an-access-token",
    });

  it("includes the status and the backend error description when the request fails", async () => {
    const body = {
      code: "UNAUTHORIZED",
      description: "Missing user",
      occurredAt: "now",
      statusCode: 401,
    };
    stubFetch(Response.json(body, { status: 401 }));

    await expect(upsert()).rejects.toMatchObject({
      status: 401,
      messages: "Missing user",
      json: body,
    });
  });

  it("names the reason in the error message", async () => {
    stubFetch(Response.json({ code: "UNAUTHORIZED", description: "Missing user" }, { status: 401 }));

    await expect(upsert()).rejects.toThrow("failed with status 401: Missing user");
  });

  it("throws with just the status when the failure has no parsable body", async () => {
    stubFetch(new Response("nope", { status: 502 }));

    await expect(upsert()).rejects.toMatchObject({ status: 502, messages: "nope" });
  });
});

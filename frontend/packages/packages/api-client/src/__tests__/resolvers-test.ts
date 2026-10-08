/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ApiError, isApiError, isApiNotFoundError } from "../apiError";
import { resolveJsonOATS, resolveJsonOrRejectWithError, resolveOATS, resolveResponse } from "../resolvers";

type SdkResult<TData, TError = unknown> = ({ data: TData; error: undefined } | { data: undefined; error: TError }) & {
  request?: Request;
  response?: Response;
};

const fetchResponse = (response: Response, body: unknown) => {
  const parsed = response.ok ? { data: body, error: undefined } : { data: undefined, error: body };
  return { ...parsed, request: new Request("http://ndla-api"), response } as any;
};

const failure = (status: number, body: unknown, statusText = "") =>
  fetchResponse(new Response(null, { status, statusText }), body);

const networkFailure = (error: unknown) => ({ data: undefined, error, response: undefined });

describe("resolveJsonOATS", () => {
  it("returns the body of a successful call", async () => {
    await expect(resolveJsonOATS(fetchResponse(Response.json({ id: 1 }), { id: 1 }))).resolves.toEqual({ id: 1 });
  });

  it("throws when a successful call answers with no body", async () => {
    await expect(resolveJsonOATS(fetchResponse(new Response(null, { status: 204 }), {}))).rejects.toThrow(ApiError);
  });

  it("rethrows what the fetch threw when the call never got an answer", async () => {
    const error = new TypeError("fetch failed");

    await expect(resolveJsonOATS(networkFailure(error))).rejects.toBe(error);
  });

  it("keeps the status, the reason and the raw body on the error", async () => {
    const body = {
      code: "NOT_FOUND",
      description: "No such article",
      occurredAt: "now",
      statusCode: 404,
    };

    const error = await resolveJsonOATS(failure(404, body, "Not Found")).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 404,
      messages: "No such article",
      json: body,
      statusText: "Not Found",
    });
    expect((error as ApiError).message).toContain("failed with status 404 Not Found: No such article");
  });

  it("prefers a string messages field over description", async () => {
    const error = await resolveJsonOATS(failure(400, { description: "d", messages: "m" })).catch((e: unknown) => e);

    expect((error as ApiError).messages).toBe("m");
  });

  it("falls back to the status text when the body carries no reason", async () => {
    const error = await resolveJsonOATS(failure(500, { unexpected: true }, "Internal Server Error")).catch(
      (e: unknown) => e,
    );

    expect((error as ApiError).messages).toBe("Internal Server Error");
  });

  it("survives a non-json body, which the sdk hands back as raw text", async () => {
    const error = await resolveJsonOATS(failure(502, "upstream is down")).catch((e: unknown) => e);

    expect((error as ApiError).messages).toBe("upstream is down");
    expect((error as ApiError).json).toBe("upstream is down");
  });

  it("does not compile for an endpoint that answers without a json body", () => {
    const typeChecks = () => {
      const json = {} as SdkResult<{ id: number }>;
      const bodyless = {} as SdkResult<void>;

      const data: Promise<{ id: number }> = Promise.resolve(json).then(resolveJsonOATS);
      void data;
      // @ts-expect-error -- a bodyless endpoint has to go through resolveOATS
      void resolveJsonOATS(bodyless);
      void resolveOATS(bodyless);
    };

    expect(typeChecks).toBeTypeOf("function");
  });
});

describe("resolveOATS", () => {
  it("allows a successful call to answer with no body", async () => {
    await expect(resolveOATS(fetchResponse(new Response(null, { status: 204 }), {}))).resolves.toBeUndefined();
  });

  it("throws on a failure just like resolveJsonOATS", async () => {
    await expect(resolveOATS(failure(403, { description: "Nope" }))).rejects.toMatchObject({
      status: 403,
      messages: "Nope",
    });
  });
});

describe("resolveResponse", () => {
  it("returns the response, whatever its status", () => {
    const response = new Response(null, { status: 404 });

    expect(resolveResponse(fetchResponse(response, undefined))).toBe(response);
  });

  it("rethrows what the fetch threw when the call never got an answer", () => {
    const error = new TypeError("fetch failed");

    expect(() => resolveResponse(networkFailure(error))).toThrow(error);
  });
});

describe("resolveJsonOrRejectWithError", () => {
  it("returns the parsed body of a successful call", async () => {
    await expect(resolveJsonOrRejectWithError(Response.json({ id: 1 }))).resolves.toEqual({ id: 1 });
  });

  it("keeps the status, the reason and the raw body on the error", async () => {
    const body = { description: "No such article", statusCode: 404 };

    const error = await resolveJsonOrRejectWithError(
      Response.json(body, { status: 404, statusText: "Not Found" }),
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 404,
      messages: "No such article",
      json: body,
    });
  });

  it("reads the message field our own express routes answer with", async () => {
    const error = await resolveJsonOrRejectWithError(Response.json({ message: "Unauthorized" }, { status: 401 })).catch(
      (e: unknown) => e,
    );

    expect((error as ApiError).messages).toBe("Unauthorized");
  });

  it("keeps a non-json error body as text instead of failing to parse it", async () => {
    const error = await resolveJsonOrRejectWithError(
      new Response("<html>Bad gateway</html>", {
        status: 502,
        statusText: "Bad Gateway",
      }),
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).messages).toBe("<html>Bad gateway</html>");
  });

  it("throws when a successful call answers with no body", async () => {
    const error = await resolveJsonOrRejectWithError(new Response(null, { status: 204 })).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).messages).toBe("The call succeeded, but answered without a json body");
  });
});

describe("isApiError / isApiNotFoundError", () => {
  it("recognises an ApiError and nothing else", () => {
    const error = new ApiError({
      status: 404,
      messages: "Not found",
      json: null,
    });

    expect(isApiError(error)).toBe(true);
    expect(isApiError(new Error("Not found"))).toBe(false);
    expect(isApiError(undefined)).toBe(false);
  });

  it("narrows a not found by status", () => {
    expect(isApiNotFoundError(new ApiError({ status: 404, messages: "", json: null }))).toBe(true);
    expect(isApiNotFoundError(new ApiError({ status: 410, messages: "", json: null }))).toBe(false);
  });

  it("names the api call in the message even without a url", () => {
    expect(new ApiError({ status: 401, messages: "Missing token", json: null }).message).toBe(
      "Api call failed with status 401: Missing token",
    );
  });
});

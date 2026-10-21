/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createServer, type Server } from "node:http";
import express from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createLocaleRedirectMiddleware } from "../localeRedirectMiddleware";

describe("createLocaleRedirectMiddleware", () => {
  let server: Server;
  let url: string;

  beforeEach(async () => {
    const app = express();
    app.use(createLocaleRedirectMiddleware(["nb", "nn", "en"]));
    app.use((req, res) => {
      res.send(req.url);
    });
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    const address = server.address();
    url = `http://localhost:${typeof address === "object" && address !== null ? address.port : ""}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const request = async (path: string, method = "GET") => {
    const res = await fetch(`${url}${path}`, { method, redirect: "manual" });
    return { status: res.status, location: res.headers.get("location") };
  };

  it.each([
    ["/NN", "/nn"],
    ["/NN/", "/nn/"],
    ["/Nn/search", "/nn/search"],
    ["/EN/search?query=Test#main", "/en/search?query=Test"],
    ["/NB/subject/NN", "/nb/subject/NN"],
  ])("redirects %s to %s", async (path, location) => {
    expect(await request(path)).toEqual({ status: 301, location });
  });

  it("redirects HEAD requests", async () => {
    expect(await request("/NN/search", "HEAD")).toEqual({ status: 301, location: "/nn/search" });
  });

  it.each(["/", "/nn/search", "/search/NN", "/NNorsk", "/SE/search"])("leaves %s alone", async (path) => {
    expect(await request(path)).toEqual({ status: 200, location: null });
  });

  it("leaves other methods alone", async () => {
    expect(await request("/NN/search", "POST")).toEqual({ status: 200, location: null });
  });
});

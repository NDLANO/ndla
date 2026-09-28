/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { afterAll, beforeAll, expect, test } from "vitest";
import { createApp } from "../app";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createServer(createApp().app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const post = (body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${baseUrl}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...headers },
    body: JSON.stringify(body),
  });

test("serves modern clients over streamable http", async () => {
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`)));
  expect(client.getInstructions()).toMatch(/NDLA/);
  const { tools } = await client.listTools();
  expect(tools.length).toBe(10);
  await client.close();
});

test("serves 2025-era clients statelessly", async () => {
  const init = await post({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "legacy", version: "1" } },
  });
  expect(init.status).toBe(200);
  expect(await init.text()).toContain('"protocolVersion":"2025-06-18"');

  const list = await post({ jsonrpc: "2.0", id: 2, method: "tools/list" }, { "mcp-protocol-version": "2025-06-18" });
  expect(list.status).toBe(200);
  expect(await list.text()).toContain('"name":"get_article"');
});

test("answers CORS preflight for browser-based clients", async () => {
  const res = await fetch(`${baseUrl}/mcp`, {
    method: "OPTIONS",
    headers: { origin: "https://example.com", "access-control-request-method": "POST" },
  });
  expect(res.status).toBe(204);
  expect(res.headers.get("access-control-allow-origin")).toBe("*");
});

test("explains itself to browsers", async () => {
  const res = await fetch(`${baseUrl}/mcp`, { headers: { accept: "text/html" } });
  expect(res.status).toBe(200);
  expect(await res.text()).toMatch(/NDLA's MCP server/);
});

test("exposes health and metrics", async () => {
  expect((await fetch(`${baseUrl}/health`)).status).toBe(200);
  const metrics = await (await fetch(`${baseUrl}/metrics`)).text();
  expect(metrics).toContain("mcp_tool_calls_total");
});

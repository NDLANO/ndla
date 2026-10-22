/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ApolloServer } from "@apollo/server";
import { trace, type Tracer } from "@opentelemetry/api";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { operationSpanPlugin } from "../operationSpanPlugin";

const span = { updateName: vi.fn(), setAttribute: vi.fn(), end: vi.fn() };
const startSpan = vi.fn(() => span);

const server = new ApolloServer({
  typeDefs: "type Query { hello: String } type Mutation { ping: Boolean }",
  resolvers: { Query: { hello: () => "hi" }, Mutation: { ping: () => true } },
  plugins: [operationSpanPlugin],
});

beforeAll(() => {
  trace.setGlobalTracerProvider({ getTracer: () => ({ startSpan }) as unknown as Tracer });
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await server.stop();
  trace.disable();
});

test("names span after a named operation", async () => {
  await server.executeOperation({ query: "query GetHello { hello }" });

  expect(startSpan).toHaveBeenCalledOnce();
  expect(span.updateName).toHaveBeenCalledWith("query GetHello");
  expect(span.setAttribute).toHaveBeenCalledWith("graphql.operation.type", "query");
  expect(span.setAttribute).toHaveBeenCalledWith("graphql.operation.name", "GetHello");
  expect(span.end).toHaveBeenCalledOnce();
});

test("names span after the operation type for anonymous operations", async () => {
  await server.executeOperation({ query: "mutation { ping }" });

  expect(span.updateName).toHaveBeenCalledWith("mutation");
  expect(span.setAttribute).toHaveBeenCalledExactlyOnceWith("graphql.operation.type", "mutation");
  expect(span.end).toHaveBeenCalledOnce();
});

test("ends span when the operation fails to parse", async () => {
  await server.executeOperation({ query: "query {" });

  expect(span.updateName).not.toHaveBeenCalled();
  expect(span.end).toHaveBeenCalledOnce();
});

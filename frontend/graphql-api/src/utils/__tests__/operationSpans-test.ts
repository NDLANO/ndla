/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { ApolloServer } from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { context, ROOT_CONTEXT, trace, type Context, type ContextManager, type Tracer } from "@opentelemetry/api";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { operationSpanPlugin, withOperationSpans } from "../operationSpans";

const storage = new AsyncLocalStorage<Context>();
const contextManager: ContextManager = {
  active: () => storage.getStore() ?? ROOT_CONTEXT,
  with: (ctx, fn, thisArg, ...args) => storage.run(ctx, () => fn.call(thisArg, ...args)),
  bind: (_ctx, target) => target,
  enable: () => contextManager,
  disable: () => contextManager,
};

const createSpan = () => ({ updateName: vi.fn(), setAttribute: vi.fn(), end: vi.fn() });
const startSpan = vi.fn(createSpan);
const startedSpans = () => startSpan.mock.results.map((result) => result.value);

const resolvedIn: { operation?: string; span: unknown }[] = [];

const server = new ApolloServer({
  schema: withOperationSpans(
    makeExecutableSchema({
      typeDefs: "type Query { article: Article } type Article { title: String } type Mutation { ping: Boolean }",
      resolvers: {
        Query: {
          article: async (_, __, ___, info) => {
            await Promise.resolve();
            resolvedIn.push({ operation: info.operation.name?.value, span: trace.getActiveSpan() });
            return {};
          },
        },
        Article: {
          title: (_, __, ___, info) => {
            resolvedIn.push({ operation: info.operation.name?.value, span: trace.getActiveSpan() });
            return "title";
          },
        },
        Mutation: { ping: () => true },
      },
    }),
  ),
  plugins: [operationSpanPlugin],
});

beforeAll(() => {
  context.setGlobalContextManager(contextManager);
  trace.setGlobalTracerProvider({ getTracer: () => ({ startSpan }) as unknown as Tracer });
});

afterEach(() => {
  vi.clearAllMocks();
  resolvedIn.length = 0;
});

afterAll(async () => {
  await server.stop();
  trace.disable();
  context.disable();
});

test("names span after a named operation", async () => {
  await server.executeOperation({ query: "query GetArticle { article { title } }" });

  const [span] = startedSpans();
  expect(startSpan).toHaveBeenCalledOnce();
  expect(span?.updateName).toHaveBeenCalledWith("query GetArticle");
  expect(span?.setAttribute).toHaveBeenCalledWith("graphql.operation.type", "query");
  expect(span?.setAttribute).toHaveBeenCalledWith("graphql.operation.name", "GetArticle");
  expect(span?.end).toHaveBeenCalledOnce();
});

test("names span after the operation type for anonymous operations", async () => {
  await server.executeOperation({ query: "mutation { ping }" });

  const [span] = startedSpans();
  expect(span?.updateName).toHaveBeenCalledWith("mutation");
  expect(span?.setAttribute).toHaveBeenCalledExactlyOnceWith("graphql.operation.type", "mutation");
  expect(span?.end).toHaveBeenCalledOnce();
});

test("ends span when the operation fails to parse", async () => {
  await server.executeOperation({ query: "query {" });

  const [span] = startedSpans();
  expect(span?.updateName).not.toHaveBeenCalled();
  expect(span?.end).toHaveBeenCalledOnce();
});

test("runs resolvers with their own operation's span active", async () => {
  await Promise.all([
    server.executeOperation({ query: "query A { article { title } }" }),
    server.executeOperation({ query: "query B { article { title } }" }),
  ]);

  const spanFor = (operation: string) =>
    startedSpans().find((span) => span.updateName.mock.calls.some(([name]) => name === `query ${operation}`));
  expect(resolvedIn).toHaveLength(4);
  for (const { operation, span } of resolvedIn) {
    expect(span).toBeDefined();
    expect(span).toBe(spanFor(operation ?? ""));
  }
});

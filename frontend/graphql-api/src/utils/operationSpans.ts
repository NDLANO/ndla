/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApolloServerPlugin } from "@apollo/server";
import { context, trace, type Span } from "@opentelemetry/api";
import { GraphQLObjectType, type GraphQLSchema } from "graphql";

const tracer = trace.getTracer("graphql-api");

// Keyed by the context value, which Apollo clones per operation (also within a batch).
const operationSpans = new WeakMap<object, Span>();

/**
 * Emits one span per GraphQL operation, named and attributed per the OTel GraphQL semantic conventions. Needed
 * because the bundled `graphql` module cannot be patched by `@opentelemetry/instrumentation-graphql`.
 */
export const operationSpanPlugin: ApolloServerPlugin = {
  async requestDidStart({ contextValue }) {
    const span = tracer.startSpan("GraphQL Operation");
    operationSpans.set(contextValue, span);
    return {
      async didResolveOperation({ operation, operationName }) {
        if (!operation) return;
        const type = operation.operation;
        span.updateName(operationName ? `${type} ${operationName}` : type);
        span.setAttribute("graphql.operation.type", type);
        if (operationName) {
          span.setAttribute("graphql.operation.name", operationName);
        }
      },
      async willSendResponse() {
        span.end();
      },
    };
  },
};

/**
 * Wraps the schema's resolvers in place so they run with their operation's span active, making spans for outgoing
 * requests its children. Loaders are shared within a batch, so a batched load belongs to the operation that
 * triggered it first.
 */
export const withOperationSpans = (schema: GraphQLSchema): GraphQLSchema => {
  for (const type of Object.values(schema.getTypeMap())) {
    if (!(type instanceof GraphQLObjectType) || type.name.startsWith("__")) continue;
    for (const field of Object.values(type.getFields())) {
      const resolve = field.resolve;
      if (!resolve) continue;
      field.resolve = (source, args, contextValue: object, info) => {
        const span = operationSpans.get(contextValue);
        if (!span) return resolve(source, args, contextValue, info);
        return context.with(trace.setSpan(context.active(), span), () => resolve(source, args, contextValue, info));
      };
    }
  }
  return schema;
};

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApolloServerPlugin } from "@apollo/server";
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("graphql-api");

/**
 * Emits one span per GraphQL operation, named and attributed per the OTel GraphQL semantic conventions. Needed
 * because the bundled `graphql` module cannot be patched by `@opentelemetry/instrumentation-graphql`. Batched
 * operations share context and loaders, so the spans are siblings of the outgoing fetch spans rather than parents.
 */
export const operationSpanPlugin: ApolloServerPlugin = {
  async requestDidStart() {
    const span = tracer.startSpan("GraphQL Operation");
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

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// NOTE: This module MUST be imported before anything else (especially http/express) so the OpenTelemetry
// instrumentations can patch Node's built-in `http` and `undici` (global `fetch`) before they are first
// used. See the first import in each app's `server.ts`. It is listed in `sideEffects` in `package.json` so that
// bare import is not tree-shaken. The SDK runs in-process (the OTel operator only injects `OTEL_*` config
// via `inject-sdk`) so it shares one `@opentelemetry/api` with the app. If the app's API were newer than the SDK's,
// API calls like `trace.getActiveSpan()` would silently no-op.

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace";

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const tracesExporter = process.env.OTEL_TRACES_EXPORTER;
const enabled = Boolean(otlpEndpoint || tracesExporter);

let sdk: NodeSDK | undefined;

if (enabled) {
  const traceExporter = tracesExporter === "console" ? new ConsoleSpanExporter() : new OTLPTraceExporter();

  sdk = new NodeSDK({
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();
}

export { sdk };

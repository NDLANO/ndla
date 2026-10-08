/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { renderToPipeableStream } from "react-dom/server";
import { type EntryContext, type HandleErrorFunction, type RouterContextProvider, ServerRouter } from "react-router";
import serialize from "serialize-javascript";
import { AppShell } from "./AppShell";
import { ConfigScriptContext } from "./components/ConfigScript";
import config from "./config";
import { getSessionStateFromCookie } from "./containers/Session/SessionProvider";
import { getLocaleInfoFromPath, initializeI18n } from "./i18n";
import log from "./server/logger";
import { requestInfoContext } from "./server/requestInfo";
import { createQueryClient } from "./util/queryClient";

export const streamTimeout = 5_000;

const configScript = `window.config = ${serialize(config)};`;

/**
 * Slightly modified version of React Router's default `entry.server.node.tsx`.
 * See: https://github.com/remix-run/react-router/blob/266915e1223045ac59b1233afd2ad68d20fc8e61/packages/react-router-dev/config/defaults/entry.server.node.tsx
 */
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: RouterContextProvider,
) {
  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, { status: responseStatusCode, headers: responseHeaders });
  }

  const { accessToken } = loadContext.get(requestInfoContext);
  const { basename, abbreviation } = getLocaleInfoFromPath(new URL(request.url).pathname);

  return new Promise<Response>((resolve, reject) => {
    let shellRendered = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(() => abort(), streamTimeout + 1000);

    const { pipe, abort } = renderToPipeableStream(
      <ConfigScriptContext value={configScript}>
        <AppShell
          pathLocale={basename}
          i18n={initializeI18n(abbreviation)}
          queryClient={createQueryClient()}
          session={getSessionStateFromCookie(accessToken)}
        >
          <ServerRouter context={routerContext} url={request.url} />
        </AppShell>
      </ConfigScriptContext>,
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = undefined;
              callback();
            },
          });
          responseHeaders.set("Content-Type", "text/html; charset=utf-8");
          pipe(body);
          resolve(
            new Response(createReadableStreamFromReadable(body), {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          // Shell errors reject the promise above, and React Router logs those through `handleError`
          if (shellRendered) {
            log.error("Error while streaming the document", error);
          }
        },
      },
    );
  });
}

export const handleError: HandleErrorFunction = (error, { request }) => {
  if (request.signal.aborted) return;
  log.error("Error while rendering", error);
};

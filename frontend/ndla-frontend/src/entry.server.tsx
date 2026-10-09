/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NormalizedCacheObject } from "@apollo/client";
import { prerenderStatic } from "@apollo/client/react/ssr";
import type { ReactNode } from "react";
import { prerenderToNodeStream } from "react-dom/static";
import { type EntryContext, type HandleErrorFunction, type RouterContextProvider, ServerRouter } from "react-router";
import { AppShell } from "./AppShell";
import type { RedirectInfo } from "./components/RedirectContext";
import config from "./config";
import type { WindowData } from "./interfaces";
import { initializeI18n, stringifiedLanguages } from "./server/locales/locales";
import { requestInfoContext } from "./server/requestInfo";
import { injectWindowData } from "./server/serverHelpers";
import { MOVED_PERMANENTLY } from "./statusCodes";
import { createApolloClient } from "./util/apiHelpers";
import { getAppPathInfo } from "./util/appPath";
import { NDLAError } from "./util/error/NDLAError";
import { ensureError, handleError as logError } from "./util/handleError";

const readStream = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array[]> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return chunks;
};

const replayStream = (chunks: Uint8Array[]): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    },
  });

/**
 * Makes `ServerRouter` safe to render more than once per request.
 *
 * Apollo's `prerenderStatic` renders the whole tree once per pass, until a pass starts no new queries.
 * `context.serverHandoffStream` carries the router state (loader data, action data and errors) to the browser, and
 * `ServerRouter` calls `getReader()` on it every time it renders. A stream can only have one reader, so the second
 * pass would throw because the stream is locked.
 *
 * Instead, the stream is read to the end once, before the first pass, and every pass gets a new stream that replays
 * the same bytes. Waiting for the whole stream up front doesn't delay the response, since the prerender waits for
 * all of it anyway.
 *
 * `prerenderStatic` wraps the tree in its own provider and hands the wrapped element to `renderFunction`, so the
 * tree can't be rebuilt for each pass. `renderFunction` swaps in the pass's context just before the pass starts,
 * and `RenderRouter` reads it when React renders it. The context only changes between passes, because
 * `prerenderStatic` waits for a pass to finish before it starts the next one.
 */
const createRenderRouter = async (context: EntryContext, url: string) => {
  const handoffChunks = context.serverHandoffStream ? await readStream(context.serverHandoffStream) : undefined;
  let renderContext = context;
  const RenderRouter = () => <ServerRouter context={renderContext} url={url} />;
  const renderFunction = (tree: ReactNode) => {
    renderContext = { ...context, serverHandoffStream: handoffChunks && replayStream(handoffChunks) };
    return prerenderToNodeStream(tree);
  };
  return { RenderRouter, renderFunction };
};

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: RouterContextProvider,
) {
  const { restrictedMode, versionHash, siteTheme, disableSSR, ltiData } = loadContext.get(requestInfoContext);
  const url = new URL(request.url);
  const { appType, pathLocale, locale } = getAppPathInfo(url.pathname);
  const isDefaultApp = appType === "default";
  const client = createApolloClient(locale, isDefaultApp ? versionHash : undefined);
  const i18n = initializeI18n(locale);
  const redirect: RedirectInfo = {};

  const { RenderRouter, renderFunction } = await createRenderRouter(routerContext, request.url);

  const { result } = await prerenderStatic({
    tree: (
      <AppShell
        appType={appType}
        language={pathLocale}
        i18n={i18n}
        client={client}
        restrictedMode={restrictedMode}
        siteTheme={isDefaultApp ? siteTheme : undefined}
        versionHash={isDefaultApp ? versionHash : undefined}
        setRedirect={(info) => Object.assign(redirect, info)}
        disableSSR={disableSSR}
        ltiData={ltiData}
      >
        <RenderRouter />
      </AppShell>
    ),
    renderFunction,
  });

  if (redirect.url) {
    return new Response(null, {
      status: redirect.status || MOVED_PERMANENTLY,
      headers: { Location: redirect.url },
    });
  }

  const status = redirect.status ?? responseStatusCode;
  if (status >= 500) {
    logError(new NDLAError(`Returning code ${status} for ${url.pathname}${url.search}`), { statusCode: status });
  }

  const windowData: WindowData = {
    serverPath: url.pathname,
    serverQuery: Object.fromEntries(url.searchParams),
    initialProps: { locale, ltiData },
    translations: stringifiedLanguages[locale],
    restrictedMode,
    siteTheme: isDefaultApp ? siteTheme : undefined,
    config: { ...config, disableSSR },
    apolloState: client.extract() as NormalizedCacheObject,
    serverResponse: redirect.status,
  };

  responseHeaders.set("Content-Type", "text/html; charset=utf-8");
  return new Response(injectWindowData(result, windowData), {
    status,
    headers: responseHeaders,
  });
}

export const handleError: HandleErrorFunction = (error, { request }) => {
  if (request.signal.aborted) return;
  logError(ensureError(error));
};

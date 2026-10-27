/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { createStaticHandler, createStaticRouter, type LoaderFunction, StaticRouterProvider } from "react-router";
import { type RedirectInfo, RedirectContext } from "../components/RedirectContext";
import { ErrorElement } from "../RouteErrorElement";
import { initializeI18n } from "../server/locales/locales";
import { handleError } from "../util/handleError";

vi.mock("../config.ts", () => {
  return {
    default: {
      zendeskWidgetKey: "123",
      runtimeType: "production",
      defaultLocale: "nb",
    },
  };
});

vi.mock("../util/handleError", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../util/handleError")>()),
  handleError: vi.fn(),
}));

const renderRequest = async (request: Request, loader?: LoaderFunction) => {
  const { query, dataRoutes } = createStaticHandler([
    { id: "root", path: "/", loader, Component: () => null, ErrorBoundary: () => <ErrorElement /> },
  ]);
  const context = await query(request);
  if (context instanceof Response) throw new Error("Expected a render, got a response");

  const redirect: RedirectInfo = {};
  render(
    <RedirectContext value={(info) => Object.assign(redirect, info)}>
      <I18nextProvider i18n={initializeI18n("nb")}>
        <StaticRouterProvider router={createStaticRouter(dataRoutes, context)} context={context} hydrate={false} />
      </I18nextProvider>
    </RedirectContext>,
  );
  return redirect.status;
};

beforeEach(() => {
  vi.mocked(handleError).mockClear();
});

test("a request method the route can't handle keeps its 405 status and isn't reported", async () => {
  const status = await renderRequest(new Request("http://localhost/", { method: "PUT" }));

  expect(status).toBe(405);
  expect(handleError).not.toHaveBeenCalled();
});

test("an error thrown by a loader is reported and returns 500", async () => {
  const status = await renderRequest(new Request("http://localhost/"), () => {
    throw new Error("boom");
  });

  expect(status).toBe(500);
  expect(handleError).toHaveBeenCalledWith(expect.objectContaining({ message: "boom" }));
});

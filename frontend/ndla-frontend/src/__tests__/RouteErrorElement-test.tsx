/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render, screen, waitFor } from "@testing-library/react";
import { lazy, Suspense } from "react";
import { I18nextProvider } from "react-i18next";
import {
  createMemoryRouter,
  createStaticHandler,
  createStaticRouter,
  type LoaderFunction,
  RouterProvider,
  StaticRouterProvider,
} from "react-router";
import { type RedirectInfo, RedirectContext } from "../components/RedirectContext";
import { ErrorElement } from "../RouteErrorElement";
import { initializeI18n } from "../server/locales/locales";
import { reloadPage } from "../util/browserLocation";
import { handleError } from "../util/handleError";

vi.mock("../util/browserLocation", () => ({ assignLocation: vi.fn(), reloadPage: vi.fn() }));

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

test("a request method the route can't handle keeps its 405 status and is logged as info", async () => {
  const status = await renderRequest(new Request("http://localhost/", { method: "PUT" }));

  expect(status).toBe(405);
  expect(screen.getByText("405 / Hunden spiste siden")).toBeTruthy();
  expect(screen.getByText("405")).toBeTruthy();
  expect(handleError).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining('You made a PUT request to "/"'),
      status: 405,
      logLevel: "info",
    }),
  );
});

test("an error thrown by a loader is reported and returns 500", async () => {
  const status = await renderRequest(new Request("http://localhost/"), () => {
    throw new Error("boom");
  });

  expect(status).toBe(500);
  expect(handleError).toHaveBeenCalledWith(expect.objectContaining({ message: "boom" }));
});

describe("chunk load errors", () => {
  const chunkError = () =>
    new TypeError("Failed to fetch dynamically imported module: https://ndla.no/assets/MastheadSearchForm-abc.js");

  const renderLazyChunkError = () => {
    const LazyForm = lazy(() => Promise.reject(chunkError()));
    const router = createMemoryRouter([
      {
        id: "root",
        path: "/",
        ErrorBoundary: () => <ErrorElement />,
        Component: () => (
          <Suspense fallback={null}>
            <LazyForm />
          </Suspense>
        ),
      },
    ]);
    render(
      <I18nextProvider i18n={initializeI18n("nb")}>
        <RouterProvider router={router} />
      </I18nextProvider>,
    );
  };

  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(reloadPage).mockClear();
  });

  test("the first chunk load error reloads the page without reporting", async () => {
    renderLazyChunkError();

    await waitFor(() => expect(reloadPage).toHaveBeenCalled());
    expect(reloadPage).toHaveBeenCalledOnce();
    expect(handleError).not.toHaveBeenCalled();
  });

  test("a chunk load error right after a reload is reported", async () => {
    sessionStorage.setItem("ndla_skew_reloaded", String(Date.now() - 1000));
    renderLazyChunkError();

    expect(await screen.findByText("500")).toBeTruthy();
    expect(handleError).toHaveBeenCalledWith(expect.objectContaining({ message: chunkError().message }));
    expect(reloadPage).not.toHaveBeenCalled();
  });
});

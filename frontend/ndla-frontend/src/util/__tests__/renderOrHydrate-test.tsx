/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createBrowserRouter, RouterProvider, type RouteObject } from "react-router";
import { renderOrHydrate } from "../renderOrHydrate";
import { triggerCrashReload } from "../skewDetection";

vi.mock("../../config.ts", () => {
  return {
    default: {
      disableSSR: true,
      runtimeType: "test",
    },
  };
});

vi.mock("../skewDetection", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../skewDetection")>()),
  triggerCrashReload: vi.fn(),
}));

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(triggerCrashReload).mockReset();
});

const Page = () => <div>page</div>;

const lazyRoutes = (): RouteObject[] => [
  { path: "/", children: [{ index: true, lazy: () => Promise.resolve({ Component: Page }) }] },
];

const failingRoutes = (): RouteObject[] => [
  {
    path: "/",
    children: [
      {
        index: true,
        lazy: () => Promise.reject(new TypeError("Failed to fetch dynamically imported module: /assets/page.js")),
      },
    ],
  },
];

test("creates the router only once the matched lazy modules have loaded", async () => {
  const routes = lazyRoutes();
  let initializedWhenRendered: boolean | undefined;

  await renderOrHydrate(document.createElement("div"), routes, "/", () => {
    const router = createBrowserRouter(routes);
    initializedWhenRendered = router.state.initialized;
    return <RouterProvider router={router} />;
  });

  // A router built while a matched route still has an unresolved `lazy` starts uninitialised,
  // so it renders its fallback instead of the route - and hydration replaces the server markup.
  expect(initializedWhenRendered).toBe(true);
});

test("writes the resolved module onto the routes the router is built from", async () => {
  const routes = lazyRoutes();

  await renderOrHydrate(document.createElement("div"), routes, "/", () => null);

  const leaf = routes[0]!.children![0]!;
  expect(leaf.lazy).toBeUndefined();
  expect(leaf.Component).toBe(Page);
});

test("reloads instead of rendering when a matched lazy module fails to load", async () => {
  const createTree = vi.fn(() => null);

  await renderOrHydrate(document.createElement("div"), failingRoutes(), "/", createTree);

  expect(triggerCrashReload).toHaveBeenCalledOnce();
  expect(createTree).not.toHaveBeenCalled();
});

test("rethrows the chunk error when a reload was just attempted", async () => {
  sessionStorage.setItem("ndla_skew_reloaded", String(Date.now()));

  await expect(renderOrHydrate(document.createElement("div"), failingRoutes(), "/", () => null)).rejects.toThrow(
    "Failed to fetch dynamically imported module",
  );
  expect(triggerCrashReload).not.toHaveBeenCalled();
});

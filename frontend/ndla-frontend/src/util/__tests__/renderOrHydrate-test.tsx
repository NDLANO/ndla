/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createBrowserRouter, RouterProvider, type RouteObject } from "react-router";
import { renderOrHydrate } from "../renderOrHydrate";

vi.mock("../../config.ts", () => {
  return {
    default: {
      disableSSR: true,
      runtimeType: "test",
    },
  };
});

const Page = () => <div>page</div>;

const lazyRoutes = (): RouteObject[] => [
  { path: "/", children: [{ index: true, lazy: () => Promise.resolve({ Component: Page }) }] },
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

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ApolloClient, ApolloLink, InMemoryCache, type TypedDocumentNode } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { parse } from "graphql";
import type { ReactNode } from "react";
import { type EntryContext, RouterContextProvider } from "react-router";
import { delay, of } from "rxjs";
import { DefaultErrorMessagePage } from "../components/DefaultErrorMessage";
import handleRequest from "../entry.server";
import { requestInfoContext } from "../server/requestInfo";
import { NDLAError } from "../util/error/NDLAError";
import { handleError } from "../util/handleError";

const mocks = vi.hoisted(() => ({ Page: (): ReactNode => null }));

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    ServerRouter: ({ url }: { url: string }) => (
      <actual.MemoryRouter initialEntries={[new URL(url).pathname]}>
        <mocks.Page />
      </actual.MemoryRouter>
    ),
  };
});

vi.mock("../util/apiHelpers", () => ({
  createApolloClient: () =>
    new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(() => of({ data: { ping: "pong" } }).pipe(delay(0))),
      ssrMode: true,
      defaultOptions: {
        watchQuery: { errorPolicy: "all" },
        query: { errorPolicy: "all" },
        mutate: { errorPolicy: "all" },
      },
    }),
}));

vi.mock("../util/handleError", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../util/handleError")>()),
  handleError: vi.fn(),
}));

vi.mock("../util/logger/logger", () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const pingQuery: TypedDocumentNode<{ ping: string }> = parse("query ping { ping }");

const renderPage = (Page: () => ReactNode) => {
  mocks.Page = Page;
  const loadContext = new RouterContextProvider();
  loadContext.set(requestInfoContext, { restrictedMode: { restricted: false }, disableSSR: false });
  return handleRequest(new Request("http://localhost/quiz/1"), 200, new Headers(), {} as EntryContext, loadContext);
};

const errorPageReports = () =>
  vi.mocked(handleError).mock.calls.filter(([, context]) => context && "errorPage" in context);

const renders: string[] = [];

const usePing = () => {
  const { data } = useQuery(pingQuery);
  renders.push(data ? "loaded" : "loading");
  return data;
};

const ErrorPageWhileLoading = () => {
  const data = usePing();
  if (!data) return <DefaultErrorMessagePage error={new NDLAError("Missing ping in ping response")} />;
  return <p>{data.ping}</p>;
};

beforeEach(() => {
  renders.length = 0;
  vi.mocked(handleError).mockClear();
});

test("an error page rendered in every render pass is reported once", async () => {
  const error = new NDLAError("Missing quiz in quiz response");
  await renderPage(() => {
    usePing();
    return <DefaultErrorMessagePage error={error} />;
  });

  expect(renders).toEqual(["loading", "loaded"]);
  expect(errorPageReports()).toEqual([[error, { errorPage: "internal" }]]);
});

test("an error page that a later render pass replaced is not reported", async () => {
  await renderPage(ErrorPageWhileLoading);

  expect(renders).toEqual(["loading", "loaded"]);
  expect(errorPageReports()).toEqual([]);
});

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// @vitest-environment node

import nock from "nock";
import { afterEach, expect, test } from "vitest";
import { DRAFT, NODES, TRANFSFORM_ARTICLE } from "../../../queryKeys";
import { runWithAccessToken } from "../../../util/authHelpers";
import { loader } from "../PreviewDraftPage";

const api = "http://ndla-api";

const draft = {
  id: 42,
  articleType: "standard",
  title: { title: "Tittel", htmlTitle: "Tittel", language: "nb" },
  content: { content: "<section><p>Innhold</p></section>", language: "nb" },
  supportedLanguages: ["nb"],
};

afterEach(() => {
  nock.cleanAll();
});

const runLoader = (accessToken?: string) =>
  runWithAccessToken(accessToken, () =>
    loader({ params: { draftId: "42", language: "nb" } } as unknown as Parameters<typeof loader>[0]),
  );

test("fetches the preview with the access token of the request", async () => {
  nock(api, { reqheaders: { authorization: "Bearer token" } })
    .get("/draft-api/v1/drafts/42")
    .query(true)
    .reply(200, draft);
  nock(api, { reqheaders: { authorization: "Bearer token" } })
    .get("/taxonomy/v1/nodes")
    .query(true)
    .reply(200, []);
  nock(api)
    .post("/graphql-api/graphql")
    .reply(200, { data: { transformArticleContent: "<section><p>Innhold</p></section>" } });

  const state = await runLoader("token");

  expect(new Set(state.queries.map((query) => query.queryKey[0]))).toEqual(new Set([DRAFT, NODES, TRANFSFORM_ARTICLE]));
  expect(nock.isDone()).toBe(true);
});

test("leaves fetching to the browser when the draft can't be fetched", async () => {
  nock(api).get("/draft-api/v1/drafts/42").query(true).reply(401, {});

  const state = await runLoader();

  expect(state.queries).toEqual([]);
  expect(nock.isDone()).toBe(true);
});

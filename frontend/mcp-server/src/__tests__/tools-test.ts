/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { clearCache } from "../api/cache";
import { anonymousFetch } from "../api/clients";
import { buildServer } from "../mcpServer";

type Route = (url: URL, request: Request) => unknown;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const copyright = {
  license: { license: "CC-BY-SA-4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
  creators: [{ type: "writer", name: "Kari Nordmann" }],
  processors: [],
  rightsholders: [],
  processed: false,
};

const article = {
  id: 13818,
  title: { title: "Fotosyntese", htmlTitle: "Fotosyntese", language: "nb" },
  introduction: { introduction: "Om fotosyntese.", htmlIntroduction: "<p>Om fotosyntese.</p>", language: "nb" },
  content: { content: "<section><p>Raw content</p></section>", language: "nb" },
  copyright,
  tags: { tags: ["biologi"], language: "nb" },
  updated: "2026-09-16T10:00:00Z",
  articleType: "standard",
  supportedLanguages: ["nb", "nn"],
  grepCodes: ["KM14047"],
};

const searchResult = {
  totalCount: 1,
  page: 1,
  pageSize: 10,
  language: "nb",
  results: [
    {
      typename: "MultiSearchSummaryDTO",
      id: 13818,
      title: { title: "Fotosyntese", htmlTitle: "Fotosyntese", language: "nb" },
      metaDescription: { metaDescription: "Lys blir til energi.", language: "nb" },
      resourceTypes: [{ id: "urn:resourcetype:subjectMaterial", name: "Fagstoff", language: "nb" }],
      context: { url: "/r/naturfag-sf/fotosyntese/ae19d59d02", breadcrumbs: ["Naturfag (SF)", "Karbon"] },
      learningResourceType: "standard",
      license: "CC-BY-SA-4.0",
    },
  ],
};

let routes: Record<string, Route>;
let requests: Request[];

const fetchMock = vi.fn(async (input: Request) => {
  requests.push(input.clone());
  const url = new URL(input.url);
  const route = Object.entries(routes).find(([path]) => url.pathname === path);
  if (!route) return json({ code: "NOT_FOUND" }, 404);
  const body = await route[1](url, input);
  return body instanceof Response ? body : json(body);
});

const connect = async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await buildServer().connect(serverTransport);
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientTransport);
  return client;
};

const callText = async (name: string, args: Record<string, unknown>) => {
  const client = await connect();
  const result = await client.callTool({ name, arguments: args });
  await client.close();
  const [content] = result.content as { type: string; text: string }[];
  return { isError: !!result.isError, text: content?.text ?? "" };
};

beforeEach(() => {
  clearCache();
  requests = [];
  routes = {};
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockClear();
});

describe("tools", () => {
  test("lists all tools as read-only", async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    await client.close();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "browse_node",
      "fetch_ndla_url",
      "get_article",
      "get_learningpath",
      "list_subjects",
      "search",
      "search_audio",
      "search_concepts",
      "search_curriculum",
      "search_images",
    ]);
    expect(tools.every((t) => t.annotations?.readOnlyHint === true)).toBe(true);
  });

  test("search maps arguments to search-api parameters and formats results", async () => {
    routes["/search-api/v1/search"] = () => searchResult;
    const { isError, text } = await callText("search", {
      query: "fotosyntese",
      grepCodes: ["KM1", "KM2"],
      contentType: "article",
      pageSize: 5,
    });

    expect(isError).toBe(false);
    const url = new URL(requests[0]!.url);
    expect(url.searchParams.get("query")).toBe("fotosyntese");
    expect(url.searchParams.get("grep-codes")).toBe("KM1,KM2");
    expect(url.searchParams.get("context-types")).toBe("standard");
    expect(url.searchParams.get("page-size")).toBe("5");
    expect(url.searchParams.get("language")).toBe("nb");
    expect(text).toContain("1. **Fotosyntese** — Fagstoff · Naturfag (SF) › Karbon");
    expect(text).toContain(
      "Article id 13818 · License: CC-BY-SA-4.0 · URL: https://test.ndla.no/r/naturfag-sf/fotosyntese/ae19d59d02",
    );
  });

  test("rejects page sizes above the maximum", async () => {
    const { isError, text } = await callText("search", { query: "x", pageSize: 500 });
    expect(isError).toBe(true);
    expect(text).toMatch(/pageSize/);
    expect(requests).toHaveLength(0);
  });

  test("get_article combines metadata, taxonomy placement and transformed content", async () => {
    routes["/article-api/v2/articles/13818"] = () => article;
    routes["/taxonomy/v1/nodes"] = () => [
      {
        contexts: [
          {
            isActive: true,
            isArchived: false,
            isVisible: true,
            isPrimary: true,
            url: "/r/naturfag-sf/fotosyntese/ae19d59d02",
            breadcrumbs: { nb: ["Naturfag (SF)", "Karbon"] },
          },
        ],
      },
    ];
    routes["/graphql-api/graphql"] = () => ({
      data: { article: { transformedContent: { content: "<section><h2>Lys</h2><p>Transformed</p></section>" } } },
    });

    const { isError, text } = await callText("get_article", { id: 13818 });

    expect(isError).toBe(false);
    expect(text).toContain("# Fotosyntese\n\nOm fotosyntese.");
    expect(text).toContain("- URL: https://test.ndla.no/r/naturfag-sf/fotosyntese/ae19d59d02");
    expect(text).toContain(
      "- License: CC-BY-SA-4.0 (https://creativecommons.org/licenses/by-sa/4.0/) · Creators: Kari Nordmann",
    );
    expect(text).toContain("## Lys\n\nTransformed");
    expect(text).not.toContain("Raw content");
  });

  test("get_article falls back to raw content when graphql-api fails", async () => {
    routes["/article-api/v2/articles/13818"] = () => article;
    routes["/taxonomy/v1/nodes"] = () => [];
    routes["/graphql-api/graphql"] = () => json({ errors: [{ message: "boom" }] }, 500);

    const { isError, text } = await callText("get_article", { id: 13818 });
    expect(isError).toBe(false);
    expect(text).toContain("Raw content");
    expect(text).toContain("- URL: https://test.ndla.no/article/13818");
  });

  test("maps backend errors to helpful tool errors", async () => {
    routes["/article-api/v2/articles/1"] = () => json({ code: "ACCESS_DENIED" }, 401);
    routes["/taxonomy/v1/nodes"] = () => [];

    expect(await callText("get_article", { id: 404 })).toEqual({
      isError: true,
      text: "Not found. Check the id or URL, or use search to find the resource.",
    });
    expect((await callText("get_article", { id: 1 })).text).toMatch(/not openly available/);
  });

  test("fetch_ndla_url resolves context urls through taxonomy", async () => {
    routes["/taxonomy/v1/nodes"] = (url) =>
      url.searchParams.get("contextId") === "ae19d59d02"
        ? [{ id: "urn:resource:1", nodeType: "RESOURCE", contentUri: "urn:article:13818", contexts: [] }]
        : [];
    routes["/article-api/v2/articles/13818"] = () => article;
    routes["/graphql-api/graphql"] = () => ({ data: { article: { transformedContent: { content: "<p>Body</p>" } } } });

    const { isError, text } = await callText("fetch_ndla_url", {
      url: "https://ndla.no/nn/r/naturfag-sf/fotosyntese/ae19d59d02",
    });
    expect(isError).toBe(false);
    expect(text).toContain("# Fotosyntese");
    const articleRequest = requests.find((r) => r.url.includes("/article-api/"));
    expect(new URL(articleRequest!.url).searchParams.get("language")).toBe("nn");
  });

  test("search_curriculum posts a grep search", async () => {
    routes["/search-api/v1/search/grep"] = async (_url, request) => {
      expect(request.method).toBe("POST");
      expect(await request.json()).toMatchObject({ query: "bærekraft", prefixFilter: ["KM"], language: "nb" });
      return {
        totalCount: 1,
        page: 1,
        pageSize: 10,
        language: "nb",
        results: [
          {
            typename: "GrepKompetansemaalDTO",
            code: "KM1",
            status: "Published",
            title: { title: "forklare bærekraft", language: "nb" },
            laereplan: { code: "NAT01-04", title: "Læreplan i naturfag" },
            kompetansemaalSett: { code: "KV1", title: "Vg1" },
            kjerneelementer: [{ code: "KE1", title: "Naturvitenskapelige praksiser" }],
            tverrfagligeTemaer: [],
          },
        ],
      };
    };
    const { text } = await callText("search_curriculum", { query: "bærekraft", types: ["KM"] });
    expect(text).toContain("- **KM1** competence goal: forklare bærekraft");
    expect(text).toContain("Core elements: KE1 Naturvitenskapelige praksiser");
  });

  test("never sends credentials to the backends", async () => {
    routes["/search-api/v1/search"] = () => searchResult;
    await callText("search", { query: "x" });
    await anonymousFetch(
      new Request("https://api.test.ndla.no/search-api/v1/search", {
        headers: { authorization: "Bearer secret", feideauthorization: "Bearer secret" },
      }),
    );
    expect(requests.length).toBe(2);
    for (const request of requests) {
      expect(request.headers.get("authorization")).toBeNull();
      expect(request.headers.get("feideauthorization")).toBeNull();
    }
  });
});

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, test } from "vitest";
import { articleToMarkdown } from "../format/markdown";

const attr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const embed = (meta: { resource: string } & Record<string, unknown>, inner = "", attrs = "") =>
  `<ndlaembed data-resource="${meta.resource}"${attrs} data-json="${attr(JSON.stringify(meta))}">${inner}</ndlaembed>`;

const copyright = {
  license: { license: "CC-BY-SA-4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
  creators: [{ type: "photographer", name: "Ola Nordmann" }],
  processors: [],
  rightsholders: [{ type: "supplier", name: "NTB" }],
};

const imageMeta = (embedData: Record<string, string>) => ({
  resource: "image",
  status: "success",
  embedData: { resource: "image", resourceId: "1", alt: "", ...embedData },
  data: {
    id: "1",
    alttext: { alttext: "A plant", language: "nb" },
    image: { imageUrl: "https://images.ndla.no/plant.jpg" },
    copyright,
  },
});

describe("articleToMarkdown", () => {
  test("converts regular html to markdown", () => {
    const md = articleToMarkdown(
      "<section><h2>Title</h2><p>Some <strong>bold</strong> text with CO<sub>2</sub>.</p></section>",
    );
    expect(md).toBe("## Title\n\nSome **bold** text with CO<sub>2</sub>.");
  });

  test("renders images with alt text, sized url, caption and credit", () => {
    const md = articleToMarkdown(embed(imageMeta({ alt: "Green plant", caption: "Photosynthesis" })));
    expect(md).toContain("![Green plant](https://images.ndla.no/plant.jpg?width=1024)");
    expect(md).toContain("Photosynthesis (Image: CC-BY-SA-4.0, Ola Nordmann, NTB)");
  });

  test("skips decorative images", () => {
    expect(articleToMarkdown(`<p>Before</p>${embed(imageMeta({ isDecorative: "true" }))}`)).toBe("Before");
  });

  test("falls back to the embed's own attributes when data-json is missing", () => {
    const md = articleToMarkdown(
      '<p><ndlaembed data-resource="image" data-alt="Raw alt"></ndlaembed><ndlaembed data-resource="content-link" data-content-id="42">link</ndlaembed></p>',
    );
    expect(md).toContain("**Image:** Raw alt");
    expect(md).toContain("[link](https://test.ndla.no/article/42)");
  });

  test("renders failed embeds as placeholders", () => {
    const md = articleToMarkdown(
      embed({ resource: "image", status: "error", embedData: { resource: "image", resourceId: "1", alt: "Missing" } }),
    );
    expect(md).toBe("**Image:** Missing");
  });

  test("keeps inline concept text and lists the definition", () => {
    const meta = {
      resource: "concept",
      status: "success",
      embedData: { resource: "concept", contentId: "7", type: "inline" },
      data: {
        concept: {
          id: 7,
          title: { title: "fotosyntese" },
          content: { content: "Plants turn light into energy.", htmlContent: "Plants turn light into energy." },
          copyright,
        },
      },
    };
    const md = articleToMarkdown(`<p>Plants do ${embed(meta, "fotosyntese")} every day.</p>`);
    expect(md).toContain("Plants do fotosyntese every day.");
    expect(md).toContain("## Concepts\n\n- **fotosyntese**: Plants turn light into energy.");
    expect(md).toContain("Source: https://test.ndla.no/concept/7");
  });

  test("renders videos, h5p and external content as labelled links", () => {
    const md = articleToMarkdown(
      [
        embed({
          resource: "brightcove",
          status: "success",
          embedData: { resource: "brightcove", videoid: "123", caption: "About &quot;plants&quot;", title: "" },
          data: { name: "Plant video", sources: [], copyright },
        }),
        embed({
          resource: "h5p",
          status: "success",
          embedData: { resource: "h5p", path: "/resource/abc", url: "https://h5p.ndla.no/resource/abc" },
          data: {
            h5pUrl: "https://h5p.ndla.no/resource/abc",
            h5pLicenseInformation: { h5p: { title: "Quiz", authors: [] } },
          },
        }),
        embed({
          resource: "external",
          status: "error",
          embedData: { resource: "external", url: "https://youtu.be/x", title: "Clip" },
        }),
      ].join(""),
    );
    expect(md).toContain(
      '**Video:** [Plant video](https://test.ndla.no/video/123) – About "plants" (CC-BY-SA-4.0, Ola Nordmann, NTB)',
    );
    expect(md).toContain("**Interactive H5P content:** [Quiz](https://h5p.ndla.no/resource/abc)");
    expect(md).toContain("**Embedded content:** [Clip](https://youtu.be/x)");
  });

  test("collects footnotes as references", () => {
    const meta = {
      resource: "footnote",
      status: "success",
      embedData: {
        resource: "footnote",
        title: "A book",
        type: "Book",
        year: "2020",
        edition: "",
        publisher: "Pub",
        authors: "Kari; Ola",
      },
      data: { entryNum: 1, authors: ["Kari", "Ola"], year: "2020" },
    };
    const md = articleToMarkdown(`<p>Claim${embed(meta)}.</p>`);
    expect(md).toContain("Claim<sup>[1]</sup>.");
    expect(md).toContain("## References\n\n[1] Kari, Ola (2020). A book. Pub");
  });

  test("renders code blocks as fenced code", () => {
    const meta = {
      resource: "code-block",
      status: "success",
      embedData: {
        resource: "code-block",
        codeFormat: "python",
        codeContent: "print(&#x22;hi&#x22;)",
        title: "Example",
      },
      data: { decodedContent: 'print("hi")', highlightedCode: "" },
    };
    expect(articleToMarkdown(embed(meta))).toBe('**Example**\n\n```python\nprint("hi")\n```');
  });

  test("turns related content into a list", () => {
    const related = (title: string, url: string) =>
      embed({ resource: "related-content", status: "success", embedData: { resource: "related-content", url, title } });
    const md = articleToMarkdown(
      `<div data-type="related-content">${related("First", "https://example.com/1")}${related("Second", "https://example.com/2")}</div>`,
    );
    expect(md).toBe("**Related content**\n\n- [First](https://example.com/1)\n- [Second](https://example.com/2)");
  });

  test("links content-links to their ndla.no path", () => {
    const meta = {
      resource: "content-link",
      status: "success",
      embedData: { resource: "content-link", contentId: "5" },
      data: { path: "/r/naturfag/foo/abc123" },
    };
    expect(articleToMarkdown(`<p>See ${embed(meta, "this")}</p>`)).toBe(
      "See [this](https://test.ndla.no/r/naturfag/foo/abc123)",
    );
  });

  test("decodes entities in embed text before escaping", () => {
    const meta = {
      resource: "campaign-block",
      status: "success",
      embedData: {
        resource: "campaign-block",
        title: "Start",
        description: "Try &quot;this&quot; & that",
        headingLevel: "h2",
      },
      data: {},
    };
    expect(articleToMarkdown(embed(meta))).toBe('**Start** Try "this" & that');
  });

  test("restores math from data-math and unwraps symbols and details", () => {
    const md = articleToMarkdown(
      [
        '<p><math data-math="&lt;mi&gt;x&lt;/mi&gt;"></math></p>',
        `<p>a ${embed({ resource: "symbol", status: "success", embedData: { resource: "symbol" }, data: null }, "→")} b</p>`,
        "<details><summary>Answer</summary><p>42</p></details>",
      ].join(""),
    );
    expect(md).toContain("<math><mi>x</mi></math>");
    expect(md).toContain("a → b");
    expect(md).toContain("**Answer**\n\n42");
  });

  test("strips editorial comments but keeps the commented text", () => {
    const meta = {
      resource: "comment",
      status: "success",
      embedData: { resource: "comment", text: "Fix this", type: "inline" },
    };
    expect(articleToMarkdown(`<p>Keep ${embed(meta, "this")} text</p>`)).toBe("Keep this text");
  });
});

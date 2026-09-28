/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { EmbedMetaData, FootnoteEmbedData } from "@ndla/types-embed";
import { type CheerioAPI, load } from "cheerio";
import TurndownService from "turndown";
import { creditLine, shortCredit } from "./credits";
import { articleUrl, audioPageUrl, conceptUrl, sizedImageUrl, toNdlaUrl, videoPageUrl } from "./links";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "_",
});
turndown.keep(["math", "sub", "sup", "table"]);
turndown.remove(["script", "style", "noscript"]);

interface DomListItem {
  nextSibling: unknown;
  parentNode: { nodeName: string; children: ArrayLike<unknown>; getAttribute: (name: string) => string | null } | null;
}

turndown.addRule("compactListItem", {
  filter: "li",
  replacement: (content, node, options) => {
    const item = node as unknown as DomListItem;
    const parent = item.parentNode;
    const index = parent ? Array.prototype.indexOf.call(parent.children, item) : 0;
    const start = Number(parent?.getAttribute("start") ?? 1);
    const prefix = parent?.nodeName === "OL" ? `${start + index}. ` : `${options.bulletListMarker} `;
    const body = content
      .replace(/^\n+/, "")
      .replace(/\n+$/, "")
      .replace(/\n/gm, `\n${" ".repeat(prefix.length)}`);
    return `${prefix}${body}${item.nextSibling ? "\n" : ""}`;
  },
});

const escapeHtml = (text: string | undefined | null): string =>
  (text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const htmlToText = (html: string): string => load(html, null, false).text().trim();

/** Embed attributes may contain markup or entities; reduce them to escaped plain text. */
const plain = (value: string | undefined | null): string => escapeHtml(htmlToText(value ?? ""));

const link = (href: string | undefined, text: string | undefined): string => {
  const label = plain(text || href);
  return href ? `<a href="${escapeHtml(href)}">${label}</a>` : label;
};

const placeholder = (kind: string, content: string, credit?: string): string =>
  `<p><strong>${kind}:</strong> ${content}${credit ? ` (${plain(credit)})` : ""}</p>`;

export const htmlToMarkdown = (html: string | undefined | null): string => (html ? turndown.turndown(html).trim() : "");

interface EmbedContext {
  footnotes: Map<number, string>;
  concepts: Map<number, string>;
}

const formatFootnote = (entryNum: number, embed: FootnoteEmbedData): string => {
  const authors = embed.authors
    ?.split(";")
    .map((a) => a.trim())
    .filter(Boolean)
    .join(", ");
  const parts = [authors, embed.year ? `(${embed.year})` : undefined].filter(Boolean).join(" ");
  const rest = [embed.title, embed.publisher, embed.edition].filter(Boolean).join(". ");
  return `[${entryNum}] ${[parts, rest].filter(Boolean).join(". ")}`;
};

/** Compile-time exhaustiveness check that still degrades gracefully if the backend adds an embed type. */
const unhandledEmbed = (_meta: never, inner: string): string => inner;

const renderEmbed = (meta: EmbedMetaData, inner: string, ctx: EmbedContext): string => {
  switch (meta.resource) {
    case "image": {
      const alt = meta.embedData.alt || (meta.status === "success" ? meta.data.alttext.alttext : "");
      if (meta.status === "error") return alt ? placeholder("Image", plain(alt)) : "";
      if (meta.embedData.isDecorative === "true") return "";
      const caption = meta.embedData.caption?.trim() ? `${meta.embedData.caption.trim()} ` : "";
      return `<figure><img src="${escapeHtml(sizedImageUrl(meta.data.image.imageUrl))}" alt="${plain(alt)}"><figcaption>${caption}(Image: ${plain(shortCredit(meta.data.copyright))})</figcaption></figure>`;
    }
    case "audio": {
      const url = audioPageUrl(meta.embedData.resourceId);
      if (meta.status === "error") return placeholder("Audio", link(url, url));
      return placeholder("Audio", link(url, meta.data.title.title), shortCredit(meta.data.copyright));
    }
    case "brightcove": {
      const url = videoPageUrl(meta.embedData.videoid);
      const caption = meta.embedData.caption ? ` – ${plain(meta.embedData.caption)}` : "";
      if (meta.status === "error") return placeholder("Video", `${link(url, meta.embedData.title)}${caption}`);
      return placeholder(
        "Video",
        `${link(url, meta.data.name ?? meta.embedData.title)}${caption}`,
        shortCredit(meta.data.copyright),
      );
    }
    case "h5p": {
      const info = meta.status === "success" ? meta.data.h5pLicenseInformation?.h5p : undefined;
      return placeholder(
        "Interactive H5P content",
        link(meta.embedData.url, info?.title ?? meta.embedData.title ?? "H5P"),
        info?.license ?? undefined,
      );
    }
    case "external": {
      const title = meta.embedData.title || (meta.status === "success" ? meta.data.oembed.title : undefined);
      const caption = meta.embedData.caption ? ` – ${plain(meta.embedData.caption)}` : "";
      return placeholder("Embedded content", `${link(meta.embedData.url, title)}${caption}`);
    }
    case "iframe": {
      const caption = meta.embedData.caption ? ` – ${plain(meta.embedData.caption)}` : "";
      return placeholder("Embedded content", `${link(meta.embedData.url, meta.embedData.title)}${caption}`);
    }
    case "file":
      return placeholder("File", `${link(meta.embedData.url, meta.embedData.title)} (${plain(meta.embedData.type)})`);
    case "concept": {
      if (meta.status === "error") return inner;
      const { concept } = meta.data;
      const title = concept.title.title;
      const gloss = concept.glossData ? ` (${concept.glossData.gloss}, ${concept.glossData.originalLanguage})` : "";
      const definition = concept.content?.content ?? "";
      if (meta.embedData.type === "inline" && inner) {
        const credit = creditLine({ copyright: concept.copyright, source: conceptUrl(concept.id) });
        ctx.concepts.set(concept.id, `- **${title}**${gloss}: ${definition} (${credit})`);
        return inner;
      }
      return `<blockquote><p><strong>${plain(title)}</strong>${plain(gloss)}: ${concept.content?.htmlContent ?? plain(definition)}</p></blockquote>`;
    }
    case "content-link": {
      const href = meta.status === "success" ? toNdlaUrl(meta.data.path) : articleUrl(meta.embedData.contentId);
      return `<a href="${escapeHtml(href)}">${inner}</a>`;
    }
    case "related-content": {
      if (meta.status === "error") return "";
      const { embedData, data } = meta;
      if (embedData.articleId && data) {
        const href = toNdlaUrl(data.resource?.url) ?? articleUrl(embedData.articleId);
        return `<li>${link(href, data.article.title?.title)}</li>`;
      }
      return embedData.url ? `<li>${link(embedData.url, embedData.title)}</li>` : "";
    }
    case "footnote": {
      if (meta.status === "error") return "";
      ctx.footnotes.set(meta.data.entryNum, formatFootnote(meta.data.entryNum, meta.embedData));
      return `<sup>[${meta.data.entryNum}]</sup>`;
    }
    case "code-block": {
      const code = meta.status === "success" ? meta.data.decodedContent : htmlToText(meta.embedData.codeContent);
      const title = meta.embedData.title ? `<p><strong>${plain(meta.embedData.title)}</strong></p>` : "";
      return `${title}<pre><code class="language-${escapeHtml(meta.embedData.codeFormat)}">${escapeHtml(code)}</code></pre>`;
    }
    case "copyright": {
      const title = meta.embedData.title ? `${meta.embedData.title}: ` : "";
      return `${inner}<p><em>${plain(title)}${plain(creditLine({ copyright: meta.embedData.copyright }))}</em></p>`;
    }
    case "uu-disclaimer": {
      const disclaimer = meta.status === "success" ? meta.data.transformedContent : meta.embedData.disclaimer;
      return `<blockquote><p>Note: ${plain(disclaimer)}</p></blockquote>${inner}`;
    }
    case "pitch": {
      const description = meta.embedData.description ? ` – ${plain(meta.embedData.description)}` : "";
      return `<p>${link(toNdlaUrl(meta.embedData.url), meta.embedData.title)}${description}</p>`;
    }
    case "key-figure":
      return `<p><strong>${plain(meta.embedData.title)}</strong> ${plain(meta.embedData.subtitle)}</p>`;
    case "contact-block":
      return `<p><strong>${plain(meta.embedData.name)}</strong>, ${plain(meta.embedData.jobTitle)}: ${plain(meta.embedData.description)}</p>`;
    case "campaign-block": {
      const url = meta.embedData.url ? ` ${link(toNdlaUrl(meta.embedData.url), meta.embedData.urlText)}` : "";
      return `<p><strong>${plain(meta.embedData.title)}</strong> ${plain(meta.embedData.description)}${url}</p>`;
    }
    case "link-block": {
      const date = meta.embedData.date ? ` (${plain(meta.embedData.date)})` : "";
      return `<p>${link(toNdlaUrl(meta.embedData.url), meta.embedData.title)}${date}</p>`;
    }
    case "symbol":
    case "comment":
      return inner;
    default:
      return unhandledEmbed(meta, inner);
  }
};

/** For embeds without resolved `data-json`, e.g. raw article-api content when graphql-api is unavailable. */
const renderUnresolvedEmbed = (attr: (name: string) => string | undefined, inner: string): string => {
  switch (attr("data-resource")) {
    case "image": {
      const alt = attr("data-alt");
      return alt && attr("data-is-decorative") !== "true" ? placeholder("Image", plain(alt)) : "";
    }
    case "content-link":
      return `<a href="${escapeHtml(articleUrl(attr("data-content-id") ?? ""))}">${inner}</a>`;
    case "brightcove":
      return placeholder("Video", link(videoPageUrl(attr("data-videoid") ?? ""), attr("data-title")));
    case "h5p":
      return placeholder("Interactive H5P content", link(attr("data-url"), attr("data-title") ?? "H5P"));
    case "external":
    case "iframe":
      return placeholder("Embedded content", link(attr("data-url"), attr("data-title")));
    case "code-block":
      return `<pre><code class="language-${escapeHtml(attr("data-code-format"))}">${escapeHtml(htmlToText(attr("data-code-content") ?? ""))}</code></pre>`;
    case "footnote":
    case "related-content":
      return "";
    default:
      return inner;
  }
};

const parseEmbedMeta = (json: string | undefined): EmbedMetaData | undefined => {
  if (!json) return undefined;
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" && "resource" in parsed && "status" in parsed ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const keptAttributes = new Set(["colspan", "rowspan", "scope", "href", "src", "alt"]);

const preprocess = ($: CheerioAPI) => {
  $("math[data-math]").each((_, el) => {
    const node = $(el);
    node.html(node.attr("data-math") ?? "").removeAttr("data-math");
  });
  $("summary").each((_, el) => {
    $(el).replaceWith(`<p><strong>${$(el).html() ?? ""}</strong></p>`);
  });
  $("details").each((_, el) => {
    $(el).replaceWith($(el).html() ?? "");
  });
};

const postprocess = ($: CheerioAPI) => {
  $('div[data-type="related-content"]').each((_, el) => {
    const items = $(el).html()?.trim();
    $(el).replaceWith(items ? `<p><strong>Related content</strong></p><ul>${items}</ul>` : "");
  });
  $("li").each((_, el) => {
    const children = $(el).contents();
    const only = children.first();
    if (children.length === 1 && only.is("p")) only.replaceWith(only.html() ?? "");
  });
  $("table, table *").each((_, el) => {
    for (const name of Object.keys(el.attribs)) {
      if (!keptAttributes.has(name)) $(el).removeAttr(name);
    }
  });
};

/** Converts article HTML (ideally graphql-api `transformedContent`, where embeds carry `data-json`) to Markdown. */
export const articleToMarkdown = (html: string): string => {
  const $ = load(html, null, false);
  const ctx: EmbedContext = { footnotes: new Map(), concepts: new Map() };

  preprocess($);
  $("ndlaembed")
    .toArray()
    .reverse()
    .forEach((el) => {
      const node = $(el);
      const inner = node.html() ?? "";
      const meta = parseEmbedMeta(node.attr("data-json"));
      node.replaceWith(meta ? renderEmbed(meta, inner, ctx) : renderUnresolvedEmbed((name) => node.attr(name), inner));
    });
  postprocess($);

  const sections = [turndown.turndown($.html()).trim()];
  if (ctx.concepts.size) {
    sections.push(`## Concepts\n\n${[...ctx.concepts.values()].reverse().join("\n")}`);
  }
  if (ctx.footnotes.size) {
    const footnotes = [...ctx.footnotes.entries()].sort(([a], [b]) => a - b).map(([, text]) => text);
    sections.push(`## References\n\n${footnotes.join("\n")}`);
  }
  return sections.join("\n\n");
};

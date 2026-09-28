/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { McpServer } from "@modelcontextprotocol/server";
import { resolveJsonOATS } from "@ndla/api-client";
import type { Node, NodeChild } from "@ndla/types-backend/taxonomy-api";
import * as z from "zod";
import { taxonomyApi } from "../api/clients";
import { toNdlaUrl } from "../format/links";
import { languageSchema, readOnlyAnnotations, withToolHandling } from "./tool";

const listedSubjectCategories = new Set(["active", "beta", "otherResources"]);

const relevanceNames: Record<string, string> = {
  "urn:relevance:core": "core",
  "urn:relevance:supplementary": "supplementary",
};

export const describeContentUri = (contentUri: string | undefined): string | undefined => {
  const [, type, id] = contentUri?.match(/^urn:(article|learningpath):(\d+)$/) ?? [];
  if (type === "article") return `article id ${id}`;
  if (type === "learningpath") return `learning path id ${id}`;
  return undefined;
};

const nodeUrl = (node: Node | NodeChild) => toNdlaUrl(node.url ?? node.context?.url);

const formatChild = (child: NodeChild): string => {
  const parts = [
    child.resourceTypes.map((t) => t.name).join(", ") || undefined,
    child.relevanceId ? relevanceNames[child.relevanceId] : undefined,
    describeContentUri(child.contentUri),
    child.nodeType === "TOPIC" ? child.id : undefined,
    nodeUrl(child),
  ].filter(Boolean);
  return `- **${child.name}**${parts.length ? ` — ${parts.join(" · ")}` : ""}`;
};

export const renderNode = async (id: string, language: string): Promise<string> => {
  const path = { id };
  const [node, children, resources] = await Promise.all([
    taxonomyApi
      .GET("/v1/nodes/{id}", { params: { path, query: { language, includeContexts: true } } })
      .then(resolveJsonOATS),
    taxonomyApi
      .GET("/v1/nodes/{id}/nodes", { params: { path, query: { language, nodeType: ["TOPIC"], isVisible: true } } })
      .then(resolveJsonOATS),
    taxonomyApi
      .GET("/v1/nodes/{id}/resources", { params: { path, query: { language, isVisible: true } } })
      .then(resolveJsonOATS),
  ]);

  const byRank = (a: NodeChild, b: NodeChild) => a.rank - b.rank;
  const context = node.context ?? node.contexts.find((c) => c.isPrimary) ?? node.contexts[0];
  const breadcrumbs = (context ? (context.breadcrumbs[language] ?? context.breadcrumbs.nb ?? []) : []).filter(
    (crumb, i, all) => crumb !== all[i - 1],
  );
  const intro = describeContentUri(node.contentUri);
  const details = [
    `- Node id: ${node.id} (${node.nodeType.toLowerCase()})`,
    nodeUrl(node) ? `- URL: ${nodeUrl(node)}` : undefined,
    breadcrumbs.length > 1 ? `- Path: ${breadcrumbs.join(" › ")}` : undefined,
    intro ? `- Introduction: ${intro} (read with get_article)` : undefined,
    node.metadata.grepCodes.length ? `- Curriculum codes: ${node.metadata.grepCodes.join(", ")}` : undefined,
  ].filter(Boolean);

  return [
    `# ${node.name}`,
    details.join("\n"),
    children.length
      ? `## Topics (${children.length})\n\n${children.sort(byRank).map(formatChild).join("\n")}`
      : undefined,
    resources.length
      ? `## Resources (${resources.length})\n\n${resources.sort(byRank).map(formatChild).join("\n")}`
      : undefined,
    children.length
      ? "Browse a topic with browse_node, read resources with get_article or get_learningpath."
      : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
};

const listSubjectsSchema = z.object({
  nameFilter: z.string().trim().min(1).max(100).optional().describe("Only subjects whose name contains this text."),
  includeArchived: z.boolean().default(false).describe("Also include archived and hidden subjects."),
  language: languageSchema,
});

const browseNodeSchema = z.object({
  nodeId: z
    .string()
    .regex(/^urn:(subject|topic|programme|node):/)
    .describe(
      "Taxonomy id of a subject or topic, e.g. urn:subject:1:... from list_subjects or urn:topic:... from browse_node.",
    ),
  language: languageSchema,
});

export const registerTaxonomyTools = (server: McpServer) => {
  server.registerTool(
    "list_subjects",
    {
      title: "List NDLA subjects",
      description:
        "List the subjects (fag) on NDLA with their taxonomy ids and URLs. Use the ids with browse_node to see topics and resources, or as subjectIds in search.",
      inputSchema: listSubjectsSchema,
      annotations: readOnlyAnnotations,
    },
    withToolHandling("list_subjects", async ({ nameFilter, includeArchived, language }) => {
      const subjects = await taxonomyApi
        .GET("/v1/nodes", { params: { query: { nodeType: ["SUBJECT"], language, isVisible: true } } })
        .then(resolveJsonOATS);
      const filter = nameFilter?.toLowerCase();
      const listed = subjects
        .filter((s) => includeArchived || listedSubjectCategories.has(s.metadata.customFields.subjectCategory ?? ""))
        .filter((s) => !filter || s.name.toLowerCase().includes(filter))
        .sort((a, b) => a.name.localeCompare(b.name, "nb"));
      if (!listed.length) return `No subjects found${nameFilter ? ` matching "${nameFilter}"` : ""}.`;
      const lines = listed.map((s) => {
        const category = s.metadata.customFields.subjectCategory;
        const extra = includeArchived && category ? ` (${category})` : "";
        return `- **${s.name}**${extra} — ${s.id}${nodeUrl(s) ? ` · ${nodeUrl(s)}` : ""}`;
      });
      return [`${listed.length} subjects:`, lines.join("\n")].join("\n\n");
    }),
  );

  server.registerTool(
    "browse_node",
    {
      title: "Browse NDLA subject or topic",
      description:
        "Show the structure of an NDLA subject or topic: its introduction, child topics and learning resources (with type, relevance, ids and URLs).",
      inputSchema: browseNodeSchema,
      annotations: readOnlyAnnotations,
    },
    withToolHandling("browse_node", ({ nodeId, language }) => renderNode(nodeId, language)),
  );
};

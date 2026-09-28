/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { McpServer } from "@modelcontextprotocol/server";
import { serverVersion } from "./config";
import { registerArticleTool } from "./tools/article";
import { registerConceptTool } from "./tools/concepts";
import { registerCurriculumTool } from "./tools/curriculum";
import { registerFetchUrlTool } from "./tools/fetchUrl";
import { registerLearningpathTool } from "./tools/learningpath";
import { registerMediaTools } from "./tools/media";
import { registerSearchTool } from "./tools/search";
import { registerTaxonomyTools } from "./tools/taxonomy";

export const instructions = `NDLA (Nasjonal digital læringsarena, https://ndla.no) publishes free, openly licensed learning resources for Norwegian upper secondary school (videregående skole). Content is mostly in Norwegian Bokmål (nb) and Nynorsk (nn), with some English (en) and Northern Sami (se).

Typical workflows:
- Find material: search, then get_article or get_learningpath with the ids from the results. Use fetch_ndla_url when the user shares an ndla.no link.
- Explore a subject: list_subjects, then browse_node from the subject down through topics to resources.
- Curriculum (LK20): search_curriculum finds competence goals (KM…), core elements (KE…) and interdisciplinary topics (TT…); pass their codes as grepCodes to search to find matching resources.
- Media: search_images and search_audio (including podcasts).
- Explanations and glossaries: search_concepts.

Search works best with Norwegian terms. Content is returned as Markdown; embedded media appear as links with their own license.

When you use NDLA content, cite the ndla.no URL of each resource you rely on. Every item has a license: give attribution (creators/rightsholders) when reusing it, and point out that COPYRIGHTED and NC/ND-licensed material has reuse restrictions.`;

export const buildServer = (): McpServer => {
  const server = new McpServer(
    { name: "ndla", title: "NDLA", version: serverVersion, websiteUrl: "https://ndla.no" },
    { instructions },
  );
  registerSearchTool(server);
  registerArticleTool(server);
  registerFetchUrlTool(server);
  registerLearningpathTool(server);
  registerTaxonomyTools(server);
  registerConceptTool(server);
  registerCurriculumTool(server);
  registerMediaTools(server);
  return server;
};

/**
 * Copyright (c) 2022-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { decode } from "he";
import { apiUrl, ndlaEnvironment, uptimeOwner, uptimeRepo, uptimeToken } from "../config";
import { resolveJson } from "../utils/apiHelpers";
import { externalFetch } from "../utils/fetch";
import parseMarkdown from "../utils/parseMarkdown";

interface GithubLabel {
  name: string;
}
interface GithubIssue {
  number: number;
  title: string;
  body: string;
  labels: GithubLabel[];
}

export interface UptimeAlert extends GithubIssue {
  closable: boolean;
}

export async function fetchUptimeIssues(context: ContextWithLoaders): Promise<UptimeAlert[]> {
  const path = `${apiUrl}/repos/${uptimeOwner}/${uptimeRepo}/issues?state=open&labels=${ndlaEnvironment}`;
  const githubAuth = uptimeToken ? { Authorization: `Bearer ${uptimeToken}` } : null;
  // GitHub marks responses to authenticated requests private, but this uses our own token and is the same for everyone.
  const response = await externalFetch(
    path,
    context,
    { headers: { ...githubAuth }, signal: AbortSignal.timeout(3000) },
    { ignoreResponseCacheControl: true },
  );
  const issues: GithubIssue[] = await resolveJson(response);

  return issues.map((issue) => {
    return {
      title: issue.title,
      number: issue.number,
      labels: issue.labels,
      closable: !issue.labels.find((label) => label.name === "permanent"),
      body: issue.body?.length
        ? parseMarkdown({
            markdown: decode(issue.body).replace(/<[^>]*>?/gm, ""),
          })
        : "",
    };
  });
}

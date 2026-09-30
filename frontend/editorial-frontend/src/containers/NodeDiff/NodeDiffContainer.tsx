/**
 * Copyright (c) 2022-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowRightShortLine } from "@ndla/icons";
import { MessageBox, Skeleton } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { NodeChild } from "@ndla/types-backend/taxonomy-api";
import { useQuery } from "@tanstack/react-query";
import type { ParseKeys } from "i18next";
import { isEqual } from "lodash-es";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { nodeTreeQueryOptions } from "../../modules/nodes/nodeQueries";
import { diffTrees, type DiffType, type DiffTypeWithChildren, type RootDiffType } from "./diffUtils";
import NodeDiff from "./NodeDiff";
import { RootNode } from "./TreeNode";

interface Props {
  originalHash: string;
  nodeId: string;
  otherHash: string;
}

const StyledNodeList = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
  },
});

const DiffContainer = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

const StyledBreadCrumb = styled("div", {
  base: {
    flexGrow: "1",
    flexDirection: "row",
    fontStyle: "italic",
  },
});

interface NodeOptions {
  nodeView: string | null;
  fieldView: string | null;
}

const filterNodes = <T,>(diff: DiffType<T>[], options: NodeOptions): DiffType<T>[] => {
  const afterNodeOption =
    options.nodeView !== "changed"
      ? diff
      : diff.filter((d) => d.changed.diffType !== "NONE" || d.childrenChanged?.diffType !== "NONE");

  return afterNodeOption;
};

const getDiffError = (hasOriginal: boolean, hasOther: boolean): ParseKeys | undefined => {
  if (hasOriginal && hasOther) return undefined;
  if (!hasOriginal && !hasOther) return "diff.error.doesNotExist";
  return hasOriginal ? "diff.error.onlyExistsInOriginal" : "diff.error.onlyExistsInOther";
};

const NodeDiffcontainer = ({ originalHash, otherHash, nodeId }: Props) => {
  const [params] = useSearchParams();
  const view = params.get("view") === "flat" ? "flat" : "tree";
  const { t, i18n } = useTranslation();
  const [selectedNode, setSelectedNode] = useState<RootDiffType | DiffTypeWithChildren | undefined>(undefined);
  const [prevHashes, setPrevHashes] = useState({ originalHash, otherHash });

  if (prevHashes.originalHash !== originalHash || prevHashes.otherHash !== otherHash) {
    setPrevHashes({ originalHash, otherHash });
    setSelectedNode(undefined);
  }

  const defaultQuery = useQuery({
    ...nodeTreeQueryOptions({
      id: nodeId,
      language: i18n.language,
      taxonomyVersion: originalHash,
    }),
    enabled: !!nodeId,
    //@ts-expect-error - this is a network error
    retry: (_, err) => err.status !== 404,
  });
  const otherQuery = useQuery({
    ...nodeTreeQueryOptions({
      id: nodeId,
      language: i18n.language,
      taxonomyVersion: otherHash,
    }),
    enabled: !!nodeId && !!otherHash,
    //@ts-expect-error - this is a network error
    retry: (_, err) => err.status !== 404,
  });

  const error =
    defaultQuery.isLoading || otherQuery.isLoading ? undefined : getDiffError(!!defaultQuery.data, !!otherQuery.data);

  const shownNodes = Math.max(
    (defaultQuery.data?.children.length ?? 0) + 1,
    (otherQuery.data?.children.length ?? 0) + 1,
  );

  if (defaultQuery.isLoading || otherQuery.isLoading) {
    return (
      <div>
        {Array.from({ length: shownNodes }).map((_, i) => (
          <Skeleton key={i} css={{ width: "100%", height: "xxlarge", marginBlockEnd: "small" }} />
        ))}
      </div>
    );
  }

  const diff = diffTrees(defaultQuery.data!, otherQuery.data!, view);
  const children: DiffType<NodeChild>[] = diff.children;

  const nodes = filterNodes(children, {
    nodeView: params.get("nodeView") ?? "changed",
    fieldView: params.get("fieldView"),
  });

  const equal =
    (defaultQuery.data || otherQuery.data) &&
    diff.root.changed.diffType === "NONE" &&
    diff.root.resourcesChanged?.diffType === "NONE" &&
    diff.root.childrenChanged?.diffType === "NONE";
  return (
    <DiffContainer id="diffContainer">
      <StyledBreadCrumb>
        {defaultQuery.data?.root?.breadcrumbs?.map((path, index, arr) => {
          return (
            <Fragment key={`${path}_${index}`}>
              {path}
              {index + 1 !== arr.length && <ArrowRightShortLine />}
            </Fragment>
          );
        })}
      </StyledBreadCrumb>
      {!!equal && <MessageBox>{t("diff.equalNodes")}</MessageBox>}
      {!!error && <MessageBox variant="error">{t(error)}</MessageBox>}
      {view === "tree" && <RootNode tree={diff} onNodeSelected={setSelectedNode} selectedNode={selectedNode} />}
      {view === "tree" && !!selectedNode && (
        <NodeDiff node={selectedNode} isRoot={isEqual(selectedNode.id, diff.root.id)} />
      )}
      {view === "flat" && (
        <StyledNodeList>
          <NodeDiff node={diff.root} key={diff.root.id.original ?? diff.root.id.other!} isRoot={true} />
          {nodes.map((node) => (
            <NodeDiff node={node} key={node.id.original ?? node.id.other} />
          ))}
        </StyledNodeList>
      )}
    </DiffContainer>
  );
};

export default NodeDiffcontainer;

/**
 * Copyright (c) 2022-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useQuery } from "@apollo/client/react";
import { CloseLine } from "@ndla/icons";
import { Button, CheckboxGroup, DialogContent, DialogRoot, DialogTrigger, Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { keyBy } from "@ndla/util";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BlockWrapper } from "../../../../components/MyNdla/BlockWrapper";
import type { GQLFolderFragment, GQLMyNdlaResourceFragment } from "../../../../graphqlTypes";
import { myNdlaResourceMetaSearchQuery } from "../../../../mutations/folder/folderQueries";
import { useStableSearchParams } from "../../../../util/useStableSearchParams";
import { keyId, sortAndFilterResources } from "../util";
import { CopyResourcesDialogContent, MoveResourcesDialogContent } from "./BatchProcessResources";
import { DeleteResourcesDialogContent } from "./DeleteResourcesDialogContent";
import { ResourceSortOption } from "./ResourceSortOption";
import { ResourceWithMenu } from "./ResourceWithMenu";
import { TagsFilter } from "./TagsFilter";

const ListContainer = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "medium",
  },
});

const ListOptionsWrapper = styled("div", {
  base: {
    display: "flex",
    gap: "medium",
    alignItems: "flex-end",
    marginLeft: "auto",
  },
});

const ListActionsWrapper = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    gap: "medium",
  },
});

const BatchSelectOptionsWrapper = styled("div", {
  base: {
    display: "flex",
    padding: "xsmall",
    gap: "xsmall",
    alignItems: "center",
    background: "surface.default",
    boxShadow: "xsmall",
    transitionDuration: "fast",
    transitionProperty: "opacity",
    transitionTimingFunction: "ease-in-out",
    opacity: "0",
  },
  variants: {
    visible: {
      true: {
        opacity: "1",
      },
      false: {},
    },
  },
});

const StyledButton = styled(Button, {
  base: {
    whiteSpace: "nowrap",
  },
});

interface Props {
  selectedFolder: GQLFolderFragment | undefined;
  resources: GQLMyNdlaResourceFragment[];
  labelledBy: string;
}

export const ResourceList = ({ selectedFolder, resources, labelledBy }: Props) => {
  const { t } = useTranslation();
  const [params] = useStableSearchParams();
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [isBatchSelecting, setIsBatchSelecting] = useState(false);

  const searchQuery = useQuery(myNdlaResourceMetaSearchQuery, {
    variables: {
      resources: resources.map((r) => ({
        id: r.resourceId,
        path: r.path,
        resourceType: r.resourceType,
      })),
    },
  });

  const onSuccessfulMutation = useCallback(() => {
    setSelectedResourceIds([]);
    setIsBatchSelecting(false);
  }, []);

  const keyedResources = keyBy(resources, (resource) => resource.id);

  const selectedResources = useMemo(() => {
    return selectedResourceIds.reduce<GQLMyNdlaResourceFragment[]>((acc, curr) => {
      const found = keyedResources[curr];
      if (found) {
        acc.push(found);
      }
      return acc;
    }, []);
  }, [keyedResources, selectedResourceIds]);

  const keyedData = keyBy(searchQuery.data?.myNdlaResourceMetaSearch ?? [], (resource) =>
    keyId(resource.type, resource.id),
  );

  const sortedAndFilteredResources = useMemo(() => {
    return sortAndFilterResources(params, keyedData, resources);
  }, [params, keyedData, resources]);

  if (!sortedAndFilteredResources.length) {
    return <Text>{t("myNdla.folder.noResources")}</Text>;
  }

  return (
    <ListContainer>
      <ListActionsWrapper>
        <TagsFilter resources={resources} />
        <ListOptionsWrapper>
          <StyledButton
            variant="secondary"
            onClick={() => {
              if (isBatchSelecting) {
                setSelectedResourceIds([]);
              }
              setIsBatchSelecting((p) => !p);
            }}
            data-state={isBatchSelecting ? "on" : undefined}
          >
            {t("myNdla.resource.batchSelect")}
            {!!isBatchSelecting && <CloseLine />}
          </StyledButton>
          <ResourceSortOption />
        </ListOptionsWrapper>
      </ListActionsWrapper>
      {!!selectedResources.length && (
        <BatchSelectOptionsWrapper visible>
          <DialogRoot>
            <DialogTrigger asChild>
              <Button variant="secondary">{t("myNdla.resource.move")}</Button>
            </DialogTrigger>
            <DialogContent>
              <MoveResourcesDialogContent
                currentFolder={selectedFolder}
                resources={selectedResources}
                onSuccessfulMutation={onSuccessfulMutation}
              />
            </DialogContent>
          </DialogRoot>
          <DialogRoot>
            <DialogTrigger asChild>
              <Button variant="secondary">{t("myNdla.resource.copy")}</Button>
            </DialogTrigger>
            <DialogContent>
              <CopyResourcesDialogContent
                currentFolder={selectedFolder}
                resources={selectedResources}
                onSuccessfulMutation={onSuccessfulMutation}
              />
            </DialogContent>
          </DialogRoot>
          <DialogRoot>
            <DialogTrigger asChild>
              <Button variant="secondary">{t("myNdla.resource.remove")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DeleteResourcesDialogContent
                selectedFolder={selectedFolder}
                resourceIds={selectedResourceIds}
                onSuccessfulMutation={onSuccessfulMutation}
              />
            </DialogContent>
          </DialogRoot>
        </BatchSelectOptionsWrapper>
      )}
      <CheckboxGroup value={selectedResourceIds} onValueChange={setSelectedResourceIds}>
        <BlockWrapper aria-labelledby={labelledBy}>
          {sortedAndFilteredResources.map((resource) => (
            <ResourceWithMenu
              resource={resource}
              key={resource.id}
              loading={searchQuery.loading}
              resourceMeta={keyedData[keyId(resource.resourceType, resource.resourceId)]}
              selectedFolder={selectedFolder}
              isBatchSelecting={isBatchSelecting}
              isSelected={selectedResourceIds.includes(resource.id)}
            />
          ))}
        </BlockWrapper>
      </CheckboxGroup>
    </ListContainer>
  );
};

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, TypedDocumentNode } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { InformationLine } from "@ndla/icons";
import { MessageBox, Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { subjectCategories } from "@ndla/ui";
import { useTranslation } from "react-i18next";
import { TAXONOMY_CUSTOM_FIELD_SUBJECT_CATEGORY } from "../constants";

interface OutdatedSubjectQuery {
  node: {
    id: string;
    metadata: {
      customFields: unknown;
    };
  } | null;
}

interface OutdatedSubjectQueryVariables {
  rootId: string;
}

interface Props {
  rootId?: string | null;
  type: "article" | "topic";
}

const outdatedSubjectQuery: TypedDocumentNode<OutdatedSubjectQuery, OutdatedSubjectQueryVariables> = gql`
  query outdatedSubject($rootId: String!) {
    node(id: $rootId) {
      id
      metadata {
        customFields
      }
    }
  }
`;

const StyledMessageBox = styled(MessageBox, {
  base: {
    width: "100%",
  },
});

export const OutdatedSubjectMessageBox = ({ rootId, type }: Props) => {
  const { t } = useTranslation();
  const query = useQuery(outdatedSubjectQuery, {
    variables: { rootId: rootId ?? "" },
    skip: !rootId,
  });

  const customFields = query.data?.node?.metadata.customFields as Record<string, string | undefined> | undefined;
  const isOutdatedSubject =
    customFields?.[TAXONOMY_CUSTOM_FIELD_SUBJECT_CATEGORY] === subjectCategories.ARCHIVE_SUBJECTS;

  if (!isOutdatedSubject) return null;

  return (
    <StyledMessageBox variant="warning">
      <InformationLine />
      <Text>{t(`messageBoxInfo.outdatedSubject.${type}`)}</Text>
    </StyledMessageBox>
  );
};

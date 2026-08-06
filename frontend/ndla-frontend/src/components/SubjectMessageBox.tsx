/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { InformationLine } from "@ndla/icons";
import { MessageBox, Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { subjectCategories, subjectTypes } from "@ndla/ui";
import { useTranslation } from "react-i18next";
import { TAXONOMY_CUSTOM_FIELD_SUBJECT_CATEGORY, TAXONOMY_CUSTOM_FIELD_SUBJECT_TYPE } from "../constants";

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
  type: "article" | "learningpath" | "topic";
}

type SubjectMessageType = "outdatedContent" | "upcomingContent";

const subjectQuery: TypedDocumentNode<OutdatedSubjectQuery, OutdatedSubjectQueryVariables> = gql`
  query subjectCategory($rootId: String!) {
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

const resolveSubjectMessageType = (
  customFields: Record<string, string | undefined> | undefined,
): SubjectMessageType | null => {
  if (customFields?.[TAXONOMY_CUSTOM_FIELD_SUBJECT_CATEGORY] === subjectCategories.ARCHIVE_SUBJECTS) {
    return "outdatedContent";
  }

  if (
    customFields?.[TAXONOMY_CUSTOM_FIELD_SUBJECT_CATEGORY] === subjectCategories.BETA_SUBJECTS ||
    customFields?.[TAXONOMY_CUSTOM_FIELD_SUBJECT_TYPE] === subjectTypes.BETA_SUBJECT
  ) {
    return "upcomingContent";
  }

  return null;
};

export const SubjectMessageBox = ({ rootId, type }: Props) => {
  const { t } = useTranslation();
  const query = useQuery(subjectQuery, {
    variables: { rootId: rootId ?? "" },
    skip: !rootId,
  });

  const customFields = query.data?.node?.metadata.customFields as Record<string, string | undefined> | undefined;
  const messageType = resolveSubjectMessageType(customFields);
  const contentType = t(`messageBoxInfo.contentType.${type}`);

  if (!messageType) return null;

  return (
    <StyledMessageBox variant="warning">
      <InformationLine />
      <Text>{t(`messageBoxInfo.${messageType}`, { type: contentType })}</Text>
    </StyledMessageBox>
  );
};

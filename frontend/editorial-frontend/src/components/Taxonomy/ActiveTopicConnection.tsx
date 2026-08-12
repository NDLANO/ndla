/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DeleteBinLine } from "@ndla/icons";
import { Button, IconButton, ListItemContent, ListItemHeading, ListItemRoot } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { Node, NodeConnection } from "@ndla/types-backend/taxonomy-api";
import { useTranslation } from "react-i18next";
import Breadcrumb from "./Breadcrumb";
import RelevanceOptionSwitch from "./RelevanceOptionSwitch";
import { MinimalNodeChild } from "./types";

const StyledWrapper = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "3xsmall",
  },
});

const StyledPrimaryConnectionButton = styled(Button, {
  base: {
    opacity: "0.3",
    _hover: { opacity: "1" },
    _focusVisible: { opacity: "1" },
  },
  variants: {
    primary: {
      true: { opacity: "1" },
    },
  },
});

interface Props {
  removeConnection?: (id: string) => void;
  updateConnection?: (
    params: Pick<NodeConnection, "id" | "relevanceId" | "primary">,
    options?: { showPrimaryWarning?: boolean },
  ) => void;
  node: MinimalNodeChild | Node;
  type: "resource" | "topic";
}

const ActiveTopicConnection = ({ removeConnection, type, node, updateConnection }: Props) => {
  const { t } = useTranslation();

  if (type === "topic" || !("connectionId" in node)) {
    return (
      <ListItemRoot asChild consumeCss>
        <li>
          <Breadcrumb node={node} />
        </li>
      </ListItemRoot>
    );
  }
  return (
    <ListItemRoot asChild consumeCss>
      <li>
        <StyledPrimaryConnectionButton
          size="small"
          primary={node.isPrimary}
          variant="success"
          onClick={() => {
            if (node.isPrimary) return;
            updateConnection?.(
              { id: node.connectionId, relevanceId: node.relevanceId, primary: true },
              { showPrimaryWarning: true },
            );
          }}
        >
          {t("form.topics.primaryTopic")}
        </StyledPrimaryConnectionButton>
        <ListItemContent>
          <ListItemHeading>
            <Breadcrumb node={node} />
          </ListItemHeading>
          <StyledWrapper>
            <RelevanceOptionSwitch
              relevanceId={node.relevanceId}
              onChange={(relevanceId) =>
                updateConnection?.({ id: node.connectionId, relevanceId, primary: node.isPrimary })
              }
            />
            <IconButton
              aria-label={!node.isPrimary ? t("taxonomy.removeResource") : t("taxonomy.removeResourceDisabled")}
              title={!node.isPrimary ? t("taxonomy.removeResource") : t("taxonomy.removeResourceDisabled")}
              variant="danger"
              size="small"
              disabled={node.isPrimary}
              onClick={() => removeConnection?.(node.connectionId)}
            >
              <DeleteBinLine />
            </IconButton>
          </StyledWrapper>
        </ListItemContent>
      </li>
    </ListItemRoot>
  );
};

export default ActiveTopicConnection;

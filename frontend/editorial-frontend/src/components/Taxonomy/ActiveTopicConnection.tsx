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
import type { Node, NodeConnection } from "@ndla/types-backend/taxonomy-api";
import { useQuery } from "@tanstack/react-query";
import { useField } from "formik";
import { type ComponentProps, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GREP_CODE_FORMATS } from "../../constants";
import { searchGrepCodesQueryOptions } from "../../modules/search/searchQueries";
import { isGrepCodeValid } from "../../util/articleUtil";
import { AlertDialog } from "../AlertDialog/AlertDialog";
import { FormActionsContainer } from "../FormikForm";
import MatomoStats from "../MatomoStats";
import Breadcrumb from "./Breadcrumb";
import { CompetenceGoalsDialog } from "./CompetenceGoalsDialog";
import { countSelectedCompetenceGoals, removeCompetenceGoals } from "./competenceGoalsUtil";
import RelevanceOptionSwitch from "./RelevanceOptionSwitch";
import type { MinimalNodeChild } from "./types";

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
  matomoStats?: ComponentProps<typeof MatomoStats>;
  subject?: Node;
  readOnly?: boolean;
  isOnlyPlacement?: boolean;
  isPublished?: boolean;
}

interface DeleteWithCompetenceGoalsButtonProps {
  subject: Node;
  onDelete: () => void;
}

const DeleteWithCompetenceGoalsButton = ({ subject, onDelete }: DeleteWithCompetenceGoalsButtonProps) => {
  const { t } = useTranslation();
  const [field, , helpers] = useField<string[]>("grepCodes");
  const setCodes = useMemo(
    () => subject.metadata.grepCodes.filter((code) => isGrepCodeValid(code, [GREP_CODE_FORMATS.KOMPETANSEMALSETT])),
    [subject.metadata.grepCodes],
  );
  const setsQuery = useQuery({
    ...searchGrepCodesQueryOptions({ codes: setCodes, pageSize: setCodes.length }),
    enabled: !!setCodes.length,
  });
  const selectedCount = useMemo(
    () => countSelectedCompetenceGoals(setsQuery.data?.results ?? [], field.value),
    [setsQuery.data, field.value],
  );

  if (!selectedCount) return null;

  return (
    <Button
      variant="danger"
      onClick={() => {
        helpers.setValue(removeCompetenceGoals(setsQuery.data?.results ?? [], field.value));
        onDelete();
      }}
    >
      {t("taxonomy.competenceGoals.deleteWithGoals")}
    </Button>
  );
};

const ActiveTopicConnection = ({
  removeConnection,
  type,
  node,
  updateConnection,
  matomoStats,
  subject,
  readOnly,
  isOnlyPlacement,
  isPublished,
}: Props) => {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (type === "topic" || !("connectionId" in node)) {
    return (
      <ListItemRoot asChild consumeCss>
        <li>
          <ListItemContent>
            <Breadcrumb node={node} />
            <StyledWrapper>
              {!!matomoStats && <MatomoStats {...matomoStats} />}
              {!!subject && <CompetenceGoalsDialog subject={subject} />}
            </StyledWrapper>
          </ListItemContent>
        </li>
      </ListItemRoot>
    );
  }

  const deleteDisabledReason =
    isOnlyPlacement && isPublished
      ? t("taxonomy.removeLastPublishedPlacementDisabled")
      : node.isPrimary && !isOnlyPlacement
        ? t("taxonomy.removeResourceDisabled")
        : undefined;
  const deleteDisabled = !!deleteDisabledReason;

  return (
    <ListItemRoot asChild consumeCss>
      <li>
        <StyledPrimaryConnectionButton
          size="small"
          primary={node.isPrimary}
          variant="success"
          disabled={!!readOnly && !node.isPrimary}
          onClick={() => {
            if (node.isPrimary) return;
            updateConnection?.(
              { id: node.connectionId, relevanceId: node.relevanceId ?? undefined, primary: true },
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
              relevanceId={node.relevanceId ?? undefined}
              disabled={readOnly}
              onChange={(relevanceId) =>
                updateConnection?.({ id: node.connectionId, relevanceId, primary: node.isPrimary })
              }
            />
            {!!matomoStats && <MatomoStats {...matomoStats} />}
            {!!subject && <CompetenceGoalsDialog subject={subject} />}
            {!readOnly && (
              <IconButton
                aria-label={deleteDisabledReason ?? t("taxonomy.removeResource")}
                title={deleteDisabledReason ?? t("taxonomy.removeResource")}
                variant="danger"
                size="small"
                disabled={deleteDisabled}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <DeleteBinLine />
              </IconButton>
            )}
          </StyledWrapper>
        </ListItemContent>
        <AlertDialog
          title={t("taxonomy.removeResource")}
          label={t("taxonomy.removeResource")}
          show={showDeleteConfirm}
          text={t("taxonomy.removeConnectionConfirm")}
          onCancel={() => setShowDeleteConfirm(false)}
        >
          <FormActionsContainer>
            <Button onClick={() => setShowDeleteConfirm(false)} variant="secondary">
              {t("form.abort")}
            </Button>
            <Button
              onClick={() => {
                setShowDeleteConfirm(false);
                removeConnection?.(node.connectionId);
              }}
              variant="danger"
            >
              {t("alertDialog.delete")}
            </Button>
            {!!subject && (
              <DeleteWithCompetenceGoalsButton
                subject={subject}
                onDelete={() => {
                  setShowDeleteConfirm(false);
                  removeConnection?.(node.connectionId);
                }}
              />
            )}
          </FormActionsContainer>
        </AlertDialog>
      </li>
    </ListItemRoot>
  );
};

export default ActiveTopicConnection;

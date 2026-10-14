/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSortable } from "@dnd-kit/react/sortable";
import { PencilLine, CloseLine } from "@ndla/icons";
import { ListItemContent, ListItemRoot, Text } from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import type { GQLMyNdlaLearningpathStepFragment } from "../../../../graphqlTypes";
import { routes } from "../../../../routeHelpers";
import { DraggableListItem } from "../../components/DraggableListItem";
import { DragHandle } from "../../components/DragHandle";
import { learningpathStepCloseButtonId, learningpathStepEditButtonId } from "../utils";
import { LearningpathStepForm } from "./LearningpathStepForm";

export const DragWrapper = styled("div", {
  base: {
    maxWidth: "full",
    height: "full",
    background: "surface.default",
    flexGrow: "1",
  },
});

const StyledListItemRoot = styled(ListItemRoot, {
  base: {
    flexDirection: "column",
  },
});

const TextWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4xsmall",
  },
});

const StyledDragHandle = styled(DragHandle, {
  variants: {
    isHidden: {
      true: {
        opacity: "0",
        pointerEvents: "none",
      },
    },
  },
});

interface LearningpathStepListItemProps {
  learningpathId: number;
  step: GQLMyNdlaLearningpathStepFragment;
  index: number;
  language: string;
  dragDisabled: boolean;
}

export const DraggableLearningpathStepListItem = ({
  step,
  learningpathId,
  index,
  language,
  dragDisabled,
}: LearningpathStepListItemProps) => {
  const { t } = useTranslation();
  const { stepId } = useParams();

  const isEditingStep = useMemo(() => step.id === Number(stepId), [step.id, stepId]);

  const sortableId = step.id.toString();
  const { ref, handleRef, isDragging } = useSortable({
    id: sortableId,
    index,
    disabled: dragDisabled,
    data: { name: step.title },
  });

  return (
    <DraggableListItem id={sortableId} ref={ref} isDragging={isDragging}>
      <StyledDragHandle
        ref={handleRef}
        name={step.title}
        disabled={dragDisabled}
        type="learningpathstep"
        isHidden={!!stepId}
        aria-hidden={stepId ? true : undefined}
        tabIndex={stepId ? -1 : 0}
      />
      <DragWrapper>
        <StyledListItemRoot nonInteractive>
          <ListItemContent>
            <TextWrapper>
              <Text fontWeight="bold" textStyle="label.medium">
                {step.title}
              </Text>
              <Text textStyle="label.small">{t(`myNdla.learningpath.form.options.${step.type}`)}</Text>
            </TextWrapper>
            {!isEditingStep ? (
              <SafeLinkButton
                variant="tertiary"
                id={learningpathStepEditButtonId(step.id)}
                to={routes.myNdla.learningpathEditStep(learningpathId, step.id)}
                state={{ focusStepId: learningpathStepCloseButtonId(step.id) }}
              >
                {t("myNdla.learningpath.form.steps.edit")}
                <PencilLine />
              </SafeLinkButton>
            ) : (
              <SafeLinkButton
                variant="tertiary"
                id={learningpathStepCloseButtonId(step.id)}
                to={routes.myNdla.learningpathEditSteps(learningpathId)}
                state={{ focusStepId: learningpathStepEditButtonId(step.id) }}
              >
                <CloseLine />
                {t("close")}
              </SafeLinkButton>
            )}
          </ListItemContent>
          {!!isEditingStep && <LearningpathStepForm step={step} language={language} />}
        </StyledListItemRoot>
      </DragWrapper>
    </DraggableListItem>
  );
};

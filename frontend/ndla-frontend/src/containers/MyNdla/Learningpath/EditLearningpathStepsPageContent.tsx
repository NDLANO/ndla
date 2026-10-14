/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { Heading } from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { Stack, styled } from "@ndla/styled-system/jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useParams } from "react-router";
import { useToast } from "../../../components/ToastContext";
import config from "../../../config";
import type { GQLMyNdlaLearningpathFragment } from "../../../graphqlTypes";
import { useUpdateLearningpathStepSeqNo } from "../../../mutations/learningpathMutations";
import { routes } from "../../../routeHelpers";
import { useRawLocation } from "../../../util/localePath";
import { dndModifiers, makeDndPlugins } from "../dndUtil";
import { DraggableLearningpathStepListItem } from "./components/DraggableLearningpathStepListItem";
import type { LearningPathOutletContext, LocationState } from "./types";

const StyledOl = styled("ol", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xxsmall",
    listStyle: "none",
    width: "full",
  },
});

interface Props {
  learningpath: GQLMyNdlaLearningpathFragment;
}

export const EditLearningpathStepsPageContent = ({ learningpath }: Props) => {
  const [sortedLearningpathSteps, setSortedLearningpathSteps] = useState(learningpath.learningsteps ?? []);
  const [prevLearningsteps, setPrevLearningsteps] = useState(learningpath.learningsteps);
  const { t, i18n } = useTranslation();
  const { stepId } = useParams();
  const [updateLearningpathStepSeqNo] = useUpdateLearningpathStepSeqNo();
  const toast = useToast();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const location = useRawLocation();

  const language = learningpath.supportedLanguages[0] ?? config.defaultLocale;

  if (learningpath.learningsteps !== prevLearningsteps) {
    setPrevLearningsteps(learningpath.learningsteps);
    if (learningpath.learningsteps) {
      setSortedLearningpathSteps(learningpath.learningsteps);
    }
  }

  useEffect(() => {
    const locationState = location.state as LocationState;
    const focusId = locationState?.focusStepId ?? stepId;
    if (!focusId) return;
    const focusElement = document.getElementById(focusId.toString());
    setTimeout(() => focusElement?.focus(), 0);
  }, [location, stepId]);

  const plugins = useMemo(() => makeDndPlugins("learningpathstep", i18n), [i18n]);

  const onError = () => toast.create({ title: t("myNdla.learningpathstep.error") });

  const onDragEnd = async (event: DragEndEvent) => {
    try {
      const { source } = event.operation;
      if (event.canceled || !isSortable(source)) return;
      const oldIndex = source.initialIndex;
      const newIndex = source.index;

      if (newIndex === oldIndex) return;

      const sortedArr = arrayMove(sortedLearningpathSteps, oldIndex, newIndex);
      const dropped = sortedLearningpathSteps.find((step) => step.id === Number(source.id));

      setSortedLearningpathSteps(sortedArr);
      const res = await updateLearningpathStepSeqNo({
        variables: { learningpathId: learningpath.id, learningpathStepId: dropped?.id ?? -1, seqNo: newIndex },
      });
      if (res.error) {
        onError();
      }
    } catch {
      onError();
    }
  };

  return (
    <>
      <Stack gap="medium" justify="left">
        <Heading textStyle="heading.small" asChild consumeCss ref={headingRef}>
          <h2>{t("myNdla.learningpath.form.content.title")}</h2>
        </Heading>
        {!!sortedLearningpathSteps.length && (
          <DragDropProvider onDragEnd={onDragEnd} plugins={plugins} modifiers={dndModifiers}>
            <StyledOl>
              {sortedLearningpathSteps.map((step, index) => (
                <DraggableLearningpathStepListItem
                  key={step.id.toString()}
                  step={step}
                  learningpathId={learningpath.id}
                  index={index}
                  language={language}
                  dragDisabled={sortedLearningpathSteps.length < 2}
                />
              ))}
            </StyledOl>
          </DragDropProvider>
        )}
        <Outlet context={{ language } satisfies LearningPathOutletContext} />
      </Stack>
      <Stack justify="space-between" direction="row">
        <SafeLinkButton variant="secondary" to={routes.myNdla.learningpathEditTitle(learningpath.id)}>
          {t("myNdla.learningpath.form.back")}
        </SafeLinkButton>
        <SafeLinkButton variant="secondary" to={routes.myNdla.learningpathPreview(learningpath.id)}>
          {t("myNdla.learningpath.form.next")}
        </SafeLinkButton>
      </Stack>
    </>
  );
};

/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DialogContent, DialogHeader, DialogRoot, DialogTitle, DialogTrigger } from "@ndla/primitives";
import type { ElementType, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { DialogCloseButton } from "../DialogCloseButton";
import { type ConceptPreviewProps, PreviewConcept } from "./PreviewConcept";
import { type CompareConceptPreviewProps, PreviewConceptCompare } from "./PreviewConceptCompare";
import { type MarkupPreviewProps, PreviewMarkup } from "./PreviewMarkup";
import { PreviewVersion, type VersionPreviewProps } from "./PreviewVersion";

type PreviewProps = MarkupPreviewProps | VersionPreviewProps | CompareConceptPreviewProps | ConceptPreviewProps;

type Props = PreviewProps & {
  activateButton: ReactElement;
};

const types: Record<Props["type"], { title: string; component: ElementType }> = {
  markup: { title: "editMarkup.previewDialogTitle", component: PreviewMarkup },
  version: { title: "form.previewVersion", component: PreviewVersion },
  conceptCompare: { title: "conceptCompare.title", component: PreviewConceptCompare },
  concept: { title: "conceptPreview.title", component: PreviewConcept },
};

export const PreviewResourceDialog = (props: Props) => {
  const { t } = useTranslation();
  const { component: Component, title } = types[props.type];
  return (
    <DialogRoot size={props.type === "version" ? "full" : "large"}>
      <DialogTrigger asChild>{props.activateButton}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(title)}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <Component {...props} />
      </DialogContent>
    </DialogRoot>
  );
};

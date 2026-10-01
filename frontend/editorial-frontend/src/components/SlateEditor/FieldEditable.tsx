/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useFieldContext } from "@ark-ui/react";
import { useMemo } from "react";
import { Editable } from "slate-react";
import type { EditableProps } from "slate-react/dist/components/editable";

interface Props extends EditableProps {}

export const FieldEditable = (props: Props) => {
  const field = useFieldContext();

  // Including ID somehow crashes the editor.
  const {
    "aria-labelledby": fieldLabelledBy,
    //@ts-expect-error - it exists, but not according to the type
    "data-part": _,
    ...fieldProps
  } = useMemo(() => (field?.getTextareaProps() as EditableProps | undefined) ?? {}, [field]);

  return <Editable {...fieldProps} aria-labelledby={field?.ids.label} {...props} />;
};

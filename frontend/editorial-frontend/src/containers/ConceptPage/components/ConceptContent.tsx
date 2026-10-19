/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useTranslation } from "react-i18next";
import { FormContent } from "../../../components/FormikForm";
import { IngressField, TitleField } from "../../FormikForm";
import VisualElementField from "../../FormikForm/components/VisualElementField";

interface Props {
  inDialog: boolean;
}

const ConceptContent = ({ inDialog }: Props) => {
  const { t } = useTranslation();

  return (
    <FormContent>
      <div>
        <TitleField />
      </div>
      <VisualElementField types={["image"]} inDialog={inDialog} />
      <IngressField name="conceptContent" maxLength={800} placeholder={t("form.name.conceptContent")} />
    </FormContent>
  );
};

export default ConceptContent;

/**
 * Copyright (c) 2020-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { PageContent } from "@ndla/primitives";
import type { FormikErrors } from "formik";
import { useTranslation } from "react-i18next";
import FormAccordion from "../../../components/Accordion/FormAccordion";
import FormAccordions from "../../../components/Accordion/FormAccordions";
import { FormContent } from "../../../components/FormikForm";
import type { SubjectPageFormikType } from "../../../util/subjectHelpers";
import SubjectpageAbout from "./SubjectpageAbout";
import SubjectpageMetadata from "./SubjectpageMetadata";
import SubjectpageSubjectlinks from "./SubjectpageSubjectlinks";

interface Props {
  buildsOn: string[];
  connectedTo: string[];
  errors: FormikErrors<SubjectPageFormikType>;
  leadsTo: string[];
  isSubmitting: boolean;
}

const SubjectpageAccordionPanels = ({ buildsOn, connectedTo, errors, leadsTo, isSubmitting }: Props) => {
  const { t } = useTranslation();

  return (
    <FormAccordions defaultOpen={["about"]}>
      <FormAccordion
        id="about"
        title={t("subjectpageForm.about")}
        hasError={["title", "description", "visualElement"].some((field) => field in errors)}
      >
        <PageContent variant="content">
          <SubjectpageAbout />
        </PageContent>
      </FormAccordion>
      <FormAccordion
        id="metadata"
        title={t("subjectpageForm.metadata")}
        hasError={["metaDescription", "desktopBannerId", "mobileBannerId"].some((field) => field in errors)}
      >
        <SubjectpageMetadata isSubmitting={isSubmitting} />
      </FormAccordion>
      <FormAccordion
        id="subjectlinks"
        title={t("subjectpageForm.subjectlinks")}
        hasError={["connectedTo", "buildsOn", "leadsTo"].some((field) => field in errors)}
      >
        <FormContent>
          <SubjectpageSubjectlinks subjectIds={connectedTo} fieldName={"connectedTo"} />
          <SubjectpageSubjectlinks subjectIds={buildsOn} fieldName={"buildsOn"} />
          <SubjectpageSubjectlinks subjectIds={leadsTo} fieldName={"leadsTo"} />
        </FormContent>
      </FormAccordion>
    </FormAccordions>
  );
};

export default SubjectpageAccordionPanels;

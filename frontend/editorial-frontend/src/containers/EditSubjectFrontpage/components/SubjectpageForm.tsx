/**
 * Copyright (c) 2020-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApiError } from "@ndla/api-client";
import type { SubjectPageDTO, NewSubjectPageDTO, UpdatedSubjectPageDTO } from "@ndla/types-backend/frontpage-api";
import { Formik, type FormikProps } from "formik";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { FormActionsContainer, Form } from "../../../components/FormikForm";
import validateFormik, { type RulesType } from "../../../components/formikValidationSchema";
import SimpleLanguageHeader from "../../../components/HeaderWithLanguage/SimpleLanguageHeader";
import SaveButton from "../../../components/SaveButton";
import { isVisualElementSlateElement } from "../../../components/SlateEditor/helpers";
import { SAVE_BUTTON_ID } from "../../../constants";
import { isFormikFormDirty } from "../../../util/formHelper";
import { type NewlyCreatedLocationState, toEditSubjectpage } from "../../../util/routeHelpers";
import {
  subjectpageApiTypeToFormikType,
  type SubjectPageFormikType,
  subjectpageFormikTypeToPatchType,
  subjectpageFormikTypeToPostType,
} from "../../../util/subjectHelpers";
import { AlertDialogWrapper } from "../../FormikForm";
import usePreventWindowUnload from "../../FormikForm/preventWindowUnloadHook";
import { useMessages } from "../../Messages/MessagesProvider";
import SubjectpageAccordionPanels from "./SubjectpageAccordionPanels";

interface Props {
  subjectpage?: SubjectPageDTO;
  elementName?: string;
  createSubjectpage?: (subjectpage: NewSubjectPageDTO) => Promise<SubjectPageDTO>;
  updateSubjectpage?: (id: number, subjectpage: UpdatedSubjectPageDTO) => Promise<SubjectPageDTO>;
  selectedLanguage: string;
  elementId: string;
}

const subjectpageRules: RulesType<SubjectPageFormikType> = {
  title: { required: true },
  description: { required: true, maxLength: 300 },
  visualElement: {
    required: true,
    test: (values: SubjectPageFormikType) => {
      const element = values?.visualElement[0];
      const data = isVisualElementSlateElement(element) ? element.data : undefined;
      const badVisualElementId = data && "resource_id" in data && data.resource_id === "";
      return badVisualElementId ? { translationKey: "subjectpageForm.missingVisualElement" } : undefined;
    },
  },
  metaDescription: { required: true, maxLength: 300 },
};

const SubjectpageForm = ({
  elementId,
  elementName,
  subjectpage,
  selectedLanguage,
  updateSubjectpage,
  createSubjectpage,
}: Props) => {
  const { t } = useTranslation();
  const [savedToServer, setSavedToServer] = useState(false);
  const { createMessage, applicationError, formatErrorMessage } = useMessages();
  const initialValues = subjectpageApiTypeToFormikType(subjectpage, elementName, elementId, selectedLanguage);
  const [unsaved, setUnsaved] = useState(false);
  const location = useLocation();
  usePreventWindowUnload(unsaved);

  const handleSubmit = async (formik: FormikProps<SubjectPageFormikType>) => {
    const { setSubmitting, values, validateForm } = formik;
    setSubmitting(true);
    try {
      if (values.id) {
        await updateSubjectpage?.(values.id, subjectpageFormikTypeToPatchType(values));
      } else {
        await createSubjectpage?.(subjectpageFormikTypeToPostType(values));
      }
      setSavedToServer(true);
    } catch (e) {
      const err = e as ApiError;
      if (err?.status === 409) {
        createMessage({ message: t("alertDialog.needToRefresh"), timeToLive: 0 });
      } else if (err?.json?.messages) {
        createMessage(formatErrorMessage(err));
      } else {
        applicationError(err);
      }
      setSubmitting(false);
      setSavedToServer(false);
    }
    await validateForm();
  };

  const initialErrors = validateFormik(initialValues, subjectpageRules, t);

  return (
    <Formik
      initialValues={initialValues}
      initialErrors={initialErrors}
      onSubmit={() => {}}
      enableReinitialize
      validate={(values) => validateFormik(values, subjectpageRules, t)}
    >
      {(formik: FormikProps<SubjectPageFormikType>) => {
        const { values, dirty, isSubmitting, errors, isValid } = formik;
        const formIsDirty: boolean = isFormikFormDirty({ values, initialValues, dirty });
        setUnsaved(formIsDirty);
        return (
          <Form>
            <SimpleLanguageHeader
              articleType={values.articleType!}
              editUrl={(_, lang: string) => toEditSubjectpage(values.elementId!, lang, values.id)}
              id={values.id!}
              isSubmitting={isSubmitting}
              language={values.language}
              supportedLanguages={values.supportedLanguages!}
              title={values.name ?? ""}
            />
            <SubjectpageAccordionPanels
              buildsOn={values.buildsOn}
              connectedTo={values.connectedTo}
              errors={errors}
              leadsTo={values.leadsTo}
              isSubmitting={isSubmitting}
            />
            <FormActionsContainer>
              <SaveButton
                id={SAVE_BUTTON_ID}
                loading={isSubmitting}
                showSaved={
                  !formIsDirty && (savedToServer || (location.state as NewlyCreatedLocationState)?.isNewlyCreated)
                }
                formIsDirty={formIsDirty}
                onClick={() => handleSubmit(formik)}
                disabled={!isValid}
              />
            </FormActionsContainer>
            <AlertDialogWrapper
              isSubmitting={isSubmitting}
              formIsDirty={formIsDirty}
              severity="danger"
              text={t("alertDialog.notSaved")}
            />
          </Form>
        );
      }}
    </Formik>
  );
};

export default SubjectpageForm;

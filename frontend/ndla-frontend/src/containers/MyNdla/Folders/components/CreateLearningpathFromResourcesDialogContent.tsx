/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { licenses } from "@ndla/licenses";
import {
  Button,
  DialogBody,
  DialogCloseTrigger,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  MessageBox,
  Text,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { AuthContext } from "../../../../components/AuthenticationContext";
import { DialogCloseButton } from "../../../../components/DialogCloseButton";
import { useToast } from "../../../../components/ToastContext";
import type {
  GQLLearningpathStepNewInput,
  GQLMyNdlaResourceFragment,
  GQLMyNdlaResourceMetaFragment,
} from "../../../../graphqlTypes";
import { useCreateLearningpath } from "../../../../mutations/learningpathMutations";
import { routes } from "../../../../routeHelpers";
import { LearningpathTitleField } from "../../Learningpath/components/LearningpathTitleField";
import { keyId } from "../util";

const StyledWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    paddingBlock: "medium",
    paddingInline: "small",
  },
});

interface Props {
  onSuccessfulMutation: VoidFunction;
  resources: GQLMyNdlaResourceFragment[];
  keyedData: Record<string, GQLMyNdlaResourceMetaFragment | undefined>;
}

interface FormValues {
  title: string;
}

export const CreateLearningpathFromResourcesDialogContent = ({ onSuccessfulMutation, resources, keyedData }: Props) => {
  const { createLearningpath, loading } = useCreateLearningpath();
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { control, handleSubmit } = useForm<FormValues>({ defaultValues: { title: "" } });

  const onSave = async ({ title }: FormValues) => {
    if (!user) {
      return;
    }
    const copyright = {
      license: {
        license: licenses.CC_BY_SA_4,
      },
      contributors: [{ name: user.displayName, type: "writer" }],
    };
    const learningsteps = resources
      .filter((resource) => resource.resourceType === "article")
      .map<GQLLearningpathStepNewInput>((resource) => {
        return {
          articleId: Number(resource.resourceId),
          language: i18n.language,
          showTitle: false,
          title: keyedData[keyId(resource.resourceType, resource.resourceId)]?.title ?? "",
          type: "ARTICLE",
          copyright,
        };
      });

    const res = await createLearningpath({
      variables: {
        params: {
          language: i18n.language,
          title,
          copyright,
          learningsteps,
        },
      },
    });
    if (res.data?.newLearningpath.id) {
      onSuccessfulMutation();
      navigate(routes.myNdla.learningpathEditSteps(res.data.newLearningpath.id));
    }
    if (res.error) {
      toast.create({ title: t("myNdla.learningpath.toast.createdFailed") });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <DialogHeader>
        <DialogTitle>{t("myNdla.resource.createLearningpathDialogTitle")}</DialogTitle>
        <DialogCloseButton />
      </DialogHeader>
      <DialogBody>
        <Text>{t("myNdla.resource.createLearningpathDialogDescription")}</Text>
        <StyledWrapper>
          <MessageBox variant="warning">{t("myNdla.resource.createLearningpathDialogWarning")}</MessageBox>
          <LearningpathTitleField control={control} name="title" />
        </StyledWrapper>
      </DialogBody>
      <DialogFooter>
        <DialogCloseTrigger asChild>
          <Button variant="secondary">{t("cancel")}</Button>
        </DialogCloseTrigger>
        <Button variant="primary" type="submit" loading={loading} aria-label={loading ? t("loading") : undefined}>
          {t("myNdla.resource.createLearningpath")}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Portal } from "@ark-ui/react/portal";
import { AlertLine, CheckLine } from "@ndla/icons";
import {
  Button,
  CheckboxControl,
  CheckboxGroup,
  CheckboxHiddenInput,
  CheckboxIndicator,
  CheckboxLabel,
  CheckboxRoot,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  FieldsetLegend,
  FieldsetRoot,
  Heading,
  Spinner,
  Text,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { Node } from "@ndla/types-backend/taxonomy-api";
import { useQuery } from "@tanstack/react-query";
import { useField } from "formik";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GREP_CODE_FORMATS } from "../../constants";
import { searchGrepCodesQueryOptions } from "../../modules/search/searchQueries";
import { isGrepCodeValid } from "../../util/articleUtil";
import { DialogCloseButton } from "../DialogCloseButton";
import { countSelectedCompetenceGoals, getCompetenceGoalCodes, groupCompetenceGoals } from "./competenceGoalsUtil";
import { CompetenceGoalWarningIcon } from "./CompetenceGoalWarningIcon";

const ContentWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "large",
  },
});

const CurriculumWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
  },
});

const StyledAlertLine = styled(AlertLine, {
  base: {
    color: "text.error",
    flexShrink: "0",
  },
});

const TriggerButton = styled(Button, {
  variants: {
    selected: {
      true: {
        background: "surface.successSubtle",
        boxShadowColor: "stroke.success",
        _hover: { background: "surface.successSubtle.hover" },
        _active: { background: "surface.successSubtle.active" },
        "& svg": { color: "stroke.success" },
      },
    },
  },
});

const SelectedCount = styled("span", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "8",
    height: "8",
    paddingInline: "1",
    borderRadius: "large",
    background: "surface.success",
    color: "text.onAction",
    textStyle: "label.xsmall",
    fontWeight: "bold",
  },
});

interface Props {
  subject: Node;
  hasNoGoalsFromSubject?: boolean;
}

export const CompetenceGoalsDialog = ({ subject, hasNoGoalsFromSubject }: Props) => {
  const { t } = useTranslation();
  const [field] = useField<string[]>("grepCodes");
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

  if (!setCodes.length) return null;

  const showNoGoalsWarning = !!hasNoGoalsFromSubject && !selectedCount;
  let label = t("taxonomy.competenceGoals.buttonLabel", { subject: subject.name });
  if (selectedCount) {
    label = t("taxonomy.competenceGoals.buttonLabelSelected", { subject: subject.name, count: selectedCount });
  } else if (showNoGoalsWarning) {
    label = t("taxonomy.competenceGoals.buttonLabelMissing", { subject: subject.name });
  }

  return (
    <DialogRoot size="large" position="top">
      <DialogTrigger asChild>
        <TriggerButton size="small" variant="secondary" selected={!!selectedCount} aria-label={label} title={label}>
          {!!selectedCount && <CheckLine />}
          {!!showNoGoalsWarning && <CompetenceGoalWarningIcon />}
          {t("taxonomy.competenceGoals.button")}
          {!!selectedCount && <SelectedCount>{selectedCount}</SelectedCount>}
        </TriggerButton>
      </DialogTrigger>
      <Portal>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("taxonomy.competenceGoals.title", { subject: subject.name })}</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody>
            <CompetenceGoalsContent setCodes={setCodes} />
          </DialogBody>
        </DialogContent>
      </Portal>
    </DialogRoot>
  );
};

const CompetenceGoalsContent = ({ setCodes }: { setCodes: string[] }) => {
  const { t } = useTranslation();
  const [field, , helpers] = useField<string[]>("grepCodes");

  const setsQuery = useQuery(searchGrepCodesQueryOptions({ codes: setCodes, pageSize: setCodes.length }));
  const goalCodes = useMemo(() => getCompetenceGoalCodes(setsQuery.data?.results ?? []), [setsQuery.data]);
  const goalsQuery = useQuery({
    ...searchGrepCodesQueryOptions({ codes: goalCodes, pageSize: goalCodes.length }),
    enabled: !!goalCodes.length,
  });

  const curriculums = useMemo(
    () => groupCompetenceGoals(setCodes, setsQuery.data?.results ?? [], goalsQuery.data?.results ?? []),
    [setCodes, setsQuery.data, goalsQuery.data],
  );

  if (setsQuery.isError || goalsQuery.isError) {
    return <Text color="text.error">{t("errorMessage.genericError")}</Text>;
  }

  if (setsQuery.isPending || (!!goalCodes.length && goalsQuery.isPending)) {
    return <Spinner />;
  }

  if (!curriculums.length) {
    return <Text>{t("taxonomy.competenceGoals.empty")}</Text>;
  }

  return (
    <ContentWrapper>
      <Text>{t("taxonomy.competenceGoals.description")}</Text>
      {curriculums.map((curriculum) => (
        <CurriculumWrapper key={curriculum.code}>
          <Heading textStyle="title.small" asChild consumeCss>
            <h2>{`${curriculum.title} (${curriculum.code})`}</h2>
          </Heading>
          {curriculum.sets.map((set) => (
            <FieldsetRoot key={set.code} asChild>
              <CheckboxGroup value={field.value} onValueChange={helpers.setValue}>
                <FieldsetLegend textStyle="label.large">{`${set.title} (${set.code})`}</FieldsetLegend>
                {set.goals.map((goal) => (
                  <CheckboxRoot key={goal.code} value={goal.code}>
                    <CheckboxControl>
                      <CheckboxIndicator asChild>
                        <CheckLine />
                      </CheckboxIndicator>
                    </CheckboxControl>
                    <CheckboxLabel textStyle="body.medium">{`${goal.title.title} (${goal.code})`}</CheckboxLabel>
                    {goal.status !== "Published" && <StyledAlertLine title={t("form.grepCodes.expired")} />}
                    <CheckboxHiddenInput />
                  </CheckboxRoot>
                ))}
              </CheckboxGroup>
            </FieldsetRoot>
          ))}
        </CurriculumWrapper>
      ))}
    </ContentWrapper>
  );
};

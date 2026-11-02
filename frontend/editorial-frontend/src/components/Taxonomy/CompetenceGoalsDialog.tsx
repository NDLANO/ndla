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
import { searchGrepCodesQueryOptions } from "../../modules/search/searchQueries";
import { DialogCloseButton } from "../DialogCloseButton";
import { getCompetenceGoalCodes, groupCompetenceGoals } from "./competenceGoalsUtil";

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

interface Props {
  subject: Node;
}

export const CompetenceGoalsDialog = ({ subject }: Props) => {
  const { t } = useTranslation();
  const setCodes = useMemo(
    () => subject.metadata.grepCodes.filter((code) => code.startsWith("KV")),
    [subject.metadata.grepCodes],
  );

  if (!setCodes.length) return null;

  const label = t("taxonomy.competenceGoals.buttonLabel", { subject: subject.name });

  return (
    <DialogRoot size="large" position="top">
      <DialogTrigger asChild>
        <Button size="small" variant="secondary" aria-label={label} title={label}>
          {t("taxonomy.competenceGoals.button")}
        </Button>
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

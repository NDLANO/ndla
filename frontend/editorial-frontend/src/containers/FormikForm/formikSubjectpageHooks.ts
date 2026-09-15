/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SubjectPageDTO, UpdatedSubjectPageDTO, NewSubjectPageDTO } from "@ndla/types-backend/frontpage-api";
import { useEffect, useState } from "react";
import type { LocaleType } from "../../interfaces";
import * as frontpageApi from "../../modules/frontpage/frontpageApi";
import { putNode } from "../../modules/nodes/nodeApi";
import { getUrnFromId } from "../../util/subjectHelpers";
import { useTaxonomyVersion } from "../StructureVersion/TaxonomyVersionProvider";

export function useFetchSubjectpageData(
  elementId: string,
  selectedLanguage: LocaleType,
  subjectpageId: string | undefined,
) {
  const [subjectpage, setSubjectpage] = useState<SubjectPageDTO>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const { taxonomyVersion } = useTaxonomyVersion();

  const updateSubjectpage = async (id: number, updatedSubjectpage: UpdatedSubjectPageDTO) => {
    const savedSubjectpage = await frontpageApi.updateSubjectpage(updatedSubjectpage, id, selectedLanguage);
    setSubjectpage(savedSubjectpage);
    return savedSubjectpage;
  };

  const createSubjectpage = async (subjectPage: NewSubjectPageDTO) => {
    const savedSubjectpage = await frontpageApi.createSubjectpage(subjectPage);
    await putNode({
      id: elementId,
      body: {
        language: selectedLanguage,
        name: savedSubjectpage.name,
        contentUri: getUrnFromId(savedSubjectpage.id),
      },
      taxonomyVersion,
    });
    setSubjectpage(savedSubjectpage);
    return savedSubjectpage;
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setSubjectpage(undefined);
      const numberId = parseInt(subjectpageId ?? "");
      if (!isNaN(numberId)) {
        try {
          const subjectpage = await frontpageApi.fetchSubjectpage(numberId, selectedLanguage);
          setSubjectpage(subjectpage);
        } catch (e) {
          setError(e as Error);
          setLoading(false);
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [subjectpageId, selectedLanguage]);

  return {
    subjectpage,
    loading,
    updateSubjectpage,
    createSubjectpage,
    error,
  };
}

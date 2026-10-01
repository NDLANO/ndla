/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { get, merge, set } from "lodash-es";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router";
import type { ApiTranslateType } from "../interfaces";
import { fetchNnTranslation } from "../modules/translate/translateApi";

const TranslateContext = createContext<boolean>(false);

interface Props {
  children: ReactNode;
}

export interface TranslateType {
  field: string;
  type: "text" | "html";
}

export const NynorskTranslateProvider = ({ children }: Props) => {
  return <TranslateContext value={true}>{children}</TranslateContext>;
};

export const useTranslateToNN = () => {
  const { selectedLanguage } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [translating, setTranslating] = useState(false);
  const [translatedFields, setTranslatedFields] = useState<string[]>([]);
  const wantsTranslate = searchParams.get("translate") === "true" && selectedLanguage === "nn";
  const [shouldTranslate, setShouldTranslate] = useState(wantsTranslate);
  const [prevWantsTranslate, setPrevWantsTranslate] = useState(wantsTranslate);

  if (wantsTranslate !== prevWantsTranslate) {
    setPrevWantsTranslate(wantsTranslate);
    if (wantsTranslate) {
      setShouldTranslate(true);
    }
  }

  const translate = useCallback(
    async (element: any, fields: TranslateType[], setElement: (element: any) => void) => {
      setTranslating(true);
      const payload = fields.reduce<Record<string, ApiTranslateType>>((acc, { field, type }) => {
        const content = get(element, field);
        if (content) {
          acc[field] = { content: content, type };
        }
        return acc;
      }, {});
      const document = await fetchNnTranslation(payload);
      const cloned = JSON.parse(JSON.stringify(element));
      Object.entries(document).forEach(([key, value]) => {
        set(cloned, key, value);
      });
      setShouldTranslate(false);
      setTranslating(false);
      setElement({ ...merge(element, cloned), language: "nn" });
      setTranslatedFields(
        fields.map((field) => {
          const fieldValue = field.field.split(".");
          return fieldValue.at(-1) ?? "";
        }),
      );
      setSearchParams(
        (params) => {
          params.delete("translate");
          return params;
        },
        { state: location.state, replace: true },
      );
    },
    [location.state, setSearchParams],
  );

  return {
    translating,
    translate,
    translatedFields,
    shouldTranslate,
  };
};

export const useIsTranslatableToNN = () => {
  const context = useContext(TranslateContext);
  return !!context;
};

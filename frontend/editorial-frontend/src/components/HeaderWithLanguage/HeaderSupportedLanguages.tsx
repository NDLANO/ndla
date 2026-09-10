/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SafeLinkButton } from "@ndla/safelink";
import { useTranslation } from "react-i18next";
import type { LanguageKey } from "../../util/messageKeys";
import { HeaderCurrentLanguagePill } from "./HeaderCurrentLanguagePill";

interface Props {
  id: number;
  language: string;
  editUrl: (id: number, url: string) => string;
  supportedLanguages?: string[];
  isSubmitting?: boolean;
  replace?: boolean;
}

const HeaderSupportedLanguages = ({ supportedLanguages = [], id, editUrl, isSubmitting, language, replace }: Props) => {
  const { t } = useTranslation();
  return (
    <>
      {supportedLanguages.map((supportedLanguage) =>
        language === supportedLanguage ? (
          <HeaderCurrentLanguagePill key={`types_${supportedLanguage}`}>
            {t(`languages.${supportedLanguage as LanguageKey}`)}
          </HeaderCurrentLanguagePill>
        ) : (
          <SafeLinkButton
            aria-label={t("languages.change", {
              language: t(`languages.${supportedLanguage as LanguageKey}`),
            })}
            title={t("languages.change", {
              language: t(`languages.${supportedLanguage as LanguageKey}`),
            })}
            size="small"
            variant="tertiary"
            to={editUrl(id, supportedLanguage)}
            replace={replace}
            disabled={isSubmitting}
            key={`types_${supportedLanguage}`}
          >
            {t(`languages.${supportedLanguage as LanguageKey}`)}
          </SafeLinkButton>
        ),
      )}
    </>
  );
};

export default HeaderSupportedLanguages;

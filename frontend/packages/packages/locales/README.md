# @ndla/locales

Translation files for NDLA projects.

## Installation

```sh
pnpm add @ndla/locales
```

## Usage

```ts
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { translationsEN, translationsNB, translationsNN, translationsSE } from "@ndla/ui";

const i18nInstanceWithTranslations = createInstance().use(initReactI18next);

i18nInstanceWithTranslations.init({
  resources: {
    en: {
      translation: translationsEN,
    },
    nn: {
      translation: translationsNN,
    },
    nb: {
      translation: translationsNB,
    },
    se: {
      translation: translationsSE,
    },
  },
});

export { i18nInstanceWithTranslations };
```

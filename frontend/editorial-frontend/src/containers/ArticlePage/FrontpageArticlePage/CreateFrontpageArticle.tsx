/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { PageContent } from "@ndla/primitives";
import type { UpdatedArticleDTO } from "@ndla/types-backend/draft-api";
import { useTranslation } from "react-i18next";
import { WideArticleEditorProvider } from "../../../components/WideArticleEditorProvider";
import { convertUpdateToNewDraft } from "../../../util/articleUtil";
import { useLocaleNavigate } from "../../../util/localePath";
import { toEditArticle } from "../../../util/routeHelpers";
import { useFetchArticleData } from "../../FormikForm/formikDraftHooks";
import PrivateRoute from "../../PrivateRoute/PrivateRoute";
import FrontpageArticleForm from "./components/FrontpageArticleForm";

export const Component = () => <PrivateRoute component={<CreateFrontpageArticle />} />;

const CreateFrontpageArticle = () => {
  const { t, i18n } = useTranslation();
  const navigate = useLocaleNavigate();
  const locale = i18n.language;
  const { createArticle } = useFetchArticleData(undefined, locale);

  const createArticleAndPushRoute = async (createdArticle: UpdatedArticleDTO) => {
    const savedArticle = await createArticle(convertUpdateToNewDraft(createdArticle));
    navigate(toEditArticle(savedArticle.id, savedArticle.articleType, createdArticle.language), {
      state: { isNewlyCreated: true },
    });
    return savedArticle;
  };

  return (
    <WideArticleEditorProvider initialValue={false}>
      <PageContent variant="wide">
        <title>{t("htmlTitles.createFrontPageArticePage")}</title>
        <FrontpageArticleForm
          updateArticle={createArticleAndPushRoute}
          articleChanged={false}
          articleLanguage={i18n.language}
          translatedFieldsToNN={[]}
        />
      </PageContent>
    </WideArticleEditorProvider>
  );
};

/**
 * Copyright (c) 2021-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { PageContent } from "@ndla/primitives";
import type { NewSeriesDTO } from "@ndla/types-backend/audio-api";
import { useTranslation } from "react-i18next";
import { NynorskTranslateProvider } from "../../components/NynorskTranslateProvider";
import { postSeries } from "../../modules/audio/audioApi";
import { useLocaleNavigate } from "../../util/localePath";
import { toEditPodcastSeries } from "../../util/routeHelpers";
import PrivateRoute from "../PrivateRoute/PrivateRoute";
import PodcastSeriesForm from "./components/PodcastSeriesForm";

const Component = () => <PrivateRoute component={<CreatePodcastSeriesPage />} />;

export const CreatePodcastSeriesPage = () => {
  return (
    <NynorskTranslateProvider>
      <PageContent>
        <CreatePodcastSeries />
      </PageContent>
    </NynorskTranslateProvider>
  );
};

const CreatePodcastSeries = () => {
  const { i18n } = useTranslation();
  const navigate = useLocaleNavigate();
  const locale = i18n.language;

  const onUpdate = async (newSeries: NewSeriesDTO): Promise<void> => {
    const createdSeries = await postSeries(newSeries);
    navigate(toEditPodcastSeries(createdSeries.id, newSeries.language), { state: { isNewlyCreated: true } });
  };

  return <PodcastSeriesForm language={locale} onUpdate={onUpdate} translatedFieldsToNN={[]} />;
};

export default Component;

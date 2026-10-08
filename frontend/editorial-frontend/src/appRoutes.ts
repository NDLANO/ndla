/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/** A route in the app. `routes.ts` turns this tree into the React Router route config. */
export interface AppRoute {
  path?: string;
  index?: boolean;
  /** Route module, relative to `src`. A route without one only prefixes its children with `path`. */
  file?: string;
  children?: AppRoute[];
}

export const routes: AppRoute[] = [
  {
    path: "/",
    file: "components/Page/Layout.tsx",
    children: [
      { index: true, file: "containers/WelcomePage/WelcomePage.tsx" },
      { path: "login/failure", file: "containers/Login/LoginFailure.tsx" },
      {
        path: "subjectpage",
        children: [
          {
            path: ":elementId/:subjectpageId/edit/:selectedLanguage",
            file: "containers/EditSubjectFrontpage/EditSubjectpage.tsx",
          },
          { path: ":elementId/new/:selectedLanguage", file: "containers/EditSubjectFrontpage/CreateSubjectpage.tsx" },
        ],
      },
      {
        path: "search",
        file: "containers/SearchPage/SearchPageHeader.tsx",
        children: [
          { path: "content/*", file: "containers/SearchPage/ContentSearch.tsx" },
          { path: "audio/*", file: "containers/SearchPage/AudioSearch.tsx" },
          { path: "image/*", file: "containers/SearchPage/ImageSearch.tsx" },
          { path: "podcast-series/*", file: "containers/SearchPage/PodcastSeriesSearch.tsx" },
        ],
      },
      {
        path: "subject-matter",
        children: [
          {
            path: "topic-article",
            children: [
              { path: "new", file: "containers/ArticlePage/TopicArticlePage/CreateTopicArticle.tsx" },
              {
                path: ":id/edit",
                file: "containers/ArticlePage/ArticleRedirect.tsx",
                children: [
                  { path: ":selectedLanguage?", file: "containers/ArticlePage/TopicArticlePage/EditTopicArticle.tsx" },
                ],
              },
            ],
          },
          {
            path: "learning-resource",
            children: [
              { path: "new", file: "containers/ArticlePage/LearningResourcePage/CreateLearningResource.tsx" },
              {
                path: ":id/edit",
                file: "containers/ArticlePage/ArticleRedirect.tsx",
                children: [
                  {
                    path: ":selectedLanguage?",
                    file: "containers/ArticlePage/LearningResourcePage/EditLearningResource.tsx",
                  },
                ],
              },
            ],
          },
          {
            path: "frontpage-article",
            children: [
              { path: "new", file: "containers/ArticlePage/FrontpageArticlePage/CreateFrontpageArticle.tsx" },
              {
                path: ":id/edit",
                file: "containers/ArticlePage/ArticleRedirect.tsx",
                children: [
                  {
                    path: ":selectedLanguage?",
                    file: "containers/ArticlePage/FrontpageArticlePage/EditFrontpageArticle.tsx",
                  },
                ],
              },
            ],
          },
          { path: "article/:id", file: "containers/ArticlePage/GenericArticleRedirect.tsx" },
        ],
      },
      { path: "edit-markup/:draftId/:language/*", file: "containers/EditMarkupPage/EditMarkupPage.tsx" },
      {
        path: "concept",
        children: [
          { path: "new", file: "containers/ConceptPage/CreateConcept.tsx" },
          {
            path: ":id/edit",
            file: "containers/ConceptPage/ConceptRedirect.tsx",
            children: [{ path: ":selectedLanguage?", file: "containers/ConceptPage/EditConcept.tsx" }],
          },
        ],
      },
      {
        path: "gloss",
        children: [
          { path: "new", file: "containers/GlossPage/CreateGloss.tsx" },
          {
            path: ":id/edit",
            file: "containers/GlossPage/GlossRedirect.tsx",
            children: [{ path: ":selectedLanguage?", file: "containers/GlossPage/EditGloss.tsx" }],
          },
        ],
      },
      { path: "preview/:draftId/:language/*", file: "containers/PreviewDraftPage/PreviewDraftPage.tsx" },
      { path: "compare/:draftId/:language/*", file: "containers/ComparePage/ComparePage.tsx" },
      {
        path: "media",
        children: [
          {
            path: "image-upload",
            children: [
              { path: "new", file: "containers/ImageUploader/CreateImage.tsx" },
              { path: "bulk", file: "containers/ImageUploader/BulkUploadImagePage.tsx" },
              {
                path: ":id/edit",
                file: "containers/ImageUploader/ImageRedirect.tsx",
                children: [{ path: ":selectedLanguage?", file: "containers/ImageUploader/EditImage.tsx" }],
              },
            ],
          },
          {
            path: "audio-upload",
            children: [
              { path: "new", file: "containers/AudioUploader/CreateAudio.tsx" },
              {
                path: ":id/edit",
                file: "containers/AudioUploader/AudioRedirect.tsx",
                children: [{ path: ":selectedLanguage?", file: "containers/AudioUploader/EditAudio.tsx" }],
              },
            ],
          },
          {
            path: "podcast-upload",
            children: [
              { path: "new", file: "containers/Podcast/CreatePodcast.tsx" },
              {
                path: ":id/edit",
                file: "containers/Podcast/PodcastRedirect.tsx",
                children: [{ path: ":selectedLanguage?", file: "containers/Podcast/EditPodcast.tsx" }],
              },
            ],
          },
          {
            path: "podcast-series",
            children: [
              { path: "new", file: "containers/PodcastSeries/CreatePodcastSeries.tsx" },
              {
                path: ":id/edit",
                file: "containers/PodcastSeries/PodcastSeriesRedirect.tsx",
                children: [{ path: ":selectedLanguage?", file: "containers/PodcastSeries/EditPodcastSeries.tsx" }],
              },
            ],
          },
        ],
      },
      { path: "learningpath/step-samples", file: "containers/LearningStepSamples/LearningstepSamplePage.tsx" },
      { path: "learningpath/:id/edit/:language", file: "containers/LearningpathPage/EditLearningpathPage.tsx" },
      { path: "learningpath/new", file: "containers/LearningpathPage/CreateLearningpathPage.tsx" },
      {
        path: "learningpath/:id/preview/:language/:stepId?",
        file: "containers/LearningpathPreviewPage/LearningpathPreviewPage.tsx",
      },
      { path: "film/:selectedLanguage?", file: "containers/NdlaFilm/NdlaFilmEditor.tsx" },
      { path: "structure/*", file: "containers/StructurePage/StructurePage.tsx" },
      { path: "programme/*", file: "containers/StructurePage/ProgrammePage.tsx" },
      { path: "taxonomyVersions/*", file: "containers/TaxonomyVersions/TaxonomyVersionsPage.tsx" },
      { path: "nodeDiff/:nodeId", file: "containers/NodeDiff/NodeDiffPage.tsx" },
      { path: "frontpage", file: "containers/FrontpageEditPage/FrontpageEditPage.tsx" },
      { path: "updateCodes", file: "containers/UpdateCodes/UpdateCodesPage.tsx" },
      { path: "forbidden", file: "containers/ForbiddenPage/ForbiddenPage.tsx" },
      { path: "*", file: "containers/NotFoundPage/NotFoundPage.tsx" },
    ],
  },
  { path: "/h5p", file: "components/H5pRedirect.tsx" },
];

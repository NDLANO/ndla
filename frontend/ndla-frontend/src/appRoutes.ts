/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * A route in the main app. `routes.ts` turns this tree into the React Router route config, and
 * `routePaths.ts` flattens it into the path patterns the server uses for caching and auth.
 */
export interface AppRoute {
  path?: string;
  index?: boolean;
  /** Route module, relative to `src`. A route without one only prefixes its children with `path`. */
  file?: string;
  /** Never cache the response. Inherited by all children. */
  private?: boolean;
  /** Redirect to login without an active session. Inherited by all children, and implies `private`. */
  requiresAuth?: boolean;
  children?: AppRoute[];
}

export const routes: AppRoute[] = [
  {
    path: "/",
    file: "containers/Page/Layout.tsx",
    children: [
      { index: true, file: "containers/WelcomePage/WelcomePage.tsx" },
      { path: "subjects", file: "containers/AllSubjectsPage/AllSubjectsPage.tsx" },
      { path: "search", file: "containers/SearchPage/SearchPage.tsx" },
      { path: "utdanning/:programme/:contextId/:grade?", file: "containers/ProgrammePage/ProgrammePage.tsx" },
      { path: "samling/:collectionId", file: "containers/CollectionPage/CollectionPage.tsx" },
      {
        path: "podkast",
        children: [
          { index: true, file: "containers/PodcastPage/PodcastSeriesListPage.tsx" },
          { path: ":id", file: "containers/PodcastPage/PodcastSeriesPage.tsx" },
        ],
      },
      { path: "article/:articleId", file: "containers/PlainArticlePage/PlainArticlePage.tsx" },
      {
        path: "learningpaths/:learningpathId",
        children: [
          { index: true, file: "containers/PlainLearningpathPage/PlainLearningpathPage.tsx" },
          { path: "steps/:stepId", file: "containers/PlainLearningpathPage/PlainLearningpathPage.tsx" },
        ],
      },
      {
        path: "quiz/:quizId",
        file: "containers/MyNdla/Quiz/QuizFeatureGate.tsx",
        children: [{ index: true, file: "containers/PlainQuizPage/PlainQuizPage.tsx" }],
      },
      {
        path: "r",
        children: [
          { path: ":contextId/:stepId?", file: "containers/ResourcePage/ResourcePage.tsx" },
          { path: ":root/:name/:contextId/:stepId?", file: "containers/ResourcePage/ResourcePage.tsx" },
        ],
      },
      {
        path: "e",
        children: [
          { path: ":contextId", file: "containers/TopicPage/TopicPage.tsx" },
          { path: ":root/:name/:contextId", file: "containers/TopicPage/TopicPage.tsx" },
        ],
      },
      { path: "f/:root?/:name?/:contextId", file: "containers/SubjectPage/SubjectPage.tsx" },
      { path: "video/:videoId", file: "containers/ResourceEmbed/VideoPage.tsx" },
      { path: "image/:imageId", file: "containers/ResourceEmbed/ImagePage.tsx" },
      { path: "concept/:conceptId", file: "containers/ResourceEmbed/ConceptPage.tsx" },
      { path: "audio/:audioId", file: "containers/ResourceEmbed/AudioPage.tsx" },
      { path: "h5p/:h5pId", file: "containers/ResourceEmbed/H5pPage.tsx" },
      { path: "revisions/:articleId", file: "containers/RevisionsPage/RevisionsPage.tsx" },
      {
        path: "minndla",
        requiresAuth: true,
        private: true,
        file: "containers/MyNdla/MyNdlaLayout.tsx",
        children: [
          {
            index: true,
            requiresAuth: false, // Allow users to "preview" MyNdla without being logged in
            file: "containers/MyNdla/MyNdlaPage.tsx",
          },
          {
            path: "folders",
            children: [
              { index: true, file: "containers/MyNdla/Folders/RootFoldersPage.tsx" },
              { path: ":folderId", file: "containers/MyNdla/Folders/SubFolderPage.tsx" },
            ],
          },
          {
            path: "learningpaths",
            file: "containers/MyNdla/Learningpath/LearningpathCheck.tsx",
            children: [
              { index: true, file: "containers/MyNdla/Learningpath/LearningpathPage.tsx" },
              { path: "new", file: "containers/MyNdla/Learningpath/NewLearningpathPage.tsx" },
              {
                path: ":learningpathId/edit",
                children: [
                  { path: "title", file: "containers/MyNdla/Learningpath/EditLearningpathTitlePage.tsx" },
                  {
                    path: "steps",
                    file: "containers/MyNdla/Learningpath/EditLearningpathStepsPage.tsx",
                    children: [
                      {
                        index: true,
                        file: "containers/MyNdla/Learningpath/components/EditLearningpathNewStepLink.tsx",
                      },
                      { path: "new", file: "containers/MyNdla/Learningpath/components/LearningpathStepForm.tsx" },
                      { path: ":stepId", file: "containers/MyNdla/Learningpath/EditLearningpathStepRoute.tsx" },
                    ],
                  },
                ],
              },
              { path: ":learningpathId/save", file: "containers/MyNdla/Learningpath/SaveLearningpathPage.tsx" },
              {
                path: ":learningpathId/preview/:stepId?",
                file: "containers/MyNdla/Learningpath/PreviewLearningpathPage.tsx",
              },
            ],
          },
          {
            path: "quiz",
            file: "containers/MyNdla/Quiz/QuizFeatureGate.tsx",
            children: [
              { index: true, file: "containers/MyNdla/Quiz/QuizPage.tsx" },
              { path: "new", file: "containers/MyNdla/Quiz/NewQuizPage.tsx" },
              { path: ":quizId/edit", file: "containers/MyNdla/Quiz/EditQuizPage.tsx" },
            ],
          },
          { path: "subjects", file: "containers/MyNdla/FavoriteSubjects/FavoriteSubjectsPage.tsx" },
          { path: "profile", file: "containers/MyNdla/MyProfile/MyProfilePage.tsx" },
        ],
      },
      { path: "om/:slug", file: "containers/AboutPageV2/AboutPageV2.tsx" },
      { path: "folder/:folderId", file: "containers/SharedFolderPage/SharedFolderPage.tsx" },
      { path: "film", file: "containers/FilmRedirect/FilmRedirectPage.tsx" },
      { path: "404", file: "containers/NotFoundPage/NotFoundPage.tsx" },
      { path: "403", file: "containers/AccessDeniedPage/AccessDeniedPage.tsx" },
      { path: "*", file: "containers/NotFoundPage/NotFoundPage.tsx" },
      { path: "p/:articleId", file: "containers/PlainArticlePage/PlainArticlePage.tsx" },
    ],
  },
];

/** Standalone pages embedded in other sites. They share the root route, but none of the main app's layout. */
export const standaloneRoutes: AppRoute[] = [
  {
    path: "article-iframe",
    file: "iframe/IframeLayout.tsx",
    children: [
      { path: ":lang?/article/:articleId", file: "iframe/IframePageContainer.tsx" },
      { path: ":lang?/:taxonomyId/:articleId", file: "iframe/IframePageContainer.tsx" },
    ],
  },
  {
    path: "embed-iframe/:lang?/:embedType/:embedId",
    file: "iframe/IframeLayout.tsx",
    children: [{ index: true, file: "iframe/EmbedIframePageContainer.tsx" }],
  },
  {
    path: "lti",
    file: "lti/LtiLayout.tsx",
    children: [
      { index: true, file: "lti/LtiProvider.tsx" },
      { path: "article-iframe/:lang?/article/:articleId", file: "lti/LtiIframePage.tsx" },
      { path: "article-iframe/:lang?/:taxonomyId/:articleId", file: "lti/LtiIframePage.tsx" },
      { path: "*", file: "containers/NotFoundPage/NotFoundPage.tsx" },
    ],
  },
];

/*
 * Part of NDLA search
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.search

/** Default alias names of every Elasticsearch index across the APIs, kept in one place to avoid name collisions between
  * them.
  */
enum IndexName(val defaultName: String) {
  case ArticleApiArticles           extends IndexName("articles")
  case AudioApiAudios               extends IndexName("audios")
  case AudioApiSeries               extends IndexName("series")
  case AudioApiTags                 extends IndexName("tags-audios")
  case ConceptApiDraftConcepts      extends IndexName("concepts")
  case ConceptApiPublishedConcepts  extends IndexName("publishedconcepts")
  case DraftApiArticles             extends IndexName("draft-articles")
  case DraftApiTags                 extends IndexName("draft-tags")
  case ImageApiImages               extends IndexName("images")
  case ImageApiTags                 extends IndexName("tags")
  case LearningpathApiLearningPaths extends IndexName("learningpaths")
  case SearchApiArticles            extends IndexName("search-articles")
  case SearchApiDrafts              extends IndexName("search-drafts")
  case SearchApiLearningPaths       extends IndexName("search-learningpaths")
  case SearchApiDraftConcepts       extends IndexName("search-draftconcepts")
  case SearchApiGreps               extends IndexName("search-greps")
  case SearchApiNodes               extends IndexName("search-nodes")
}

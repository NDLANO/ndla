/*
 * Part of NDLA article-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.articleapi.service

import no.ndla.articleapi.Props
import no.ndla.articleapi.service.search.ArticleIndexService
import no.ndla.common.job.StandaloneJob
import no.ndla.search.Reindexer

import scala.util.Try

/** Reindexes all article-api indexes in a separate instance */
class StandaloneIndexing(using props: Props, articleIndexService: ArticleIndexService) extends StandaloneJob {
  override val name: String = "index"

  override def execute(): Try[Unit] = Reindexer.reindexAll(Seq(articleIndexService))(_.indexDocuments(None))
}

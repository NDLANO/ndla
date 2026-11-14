/*
 * Part of NDLA draft-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.draftapi.service

import no.ndla.common.job.StandaloneJob
import no.ndla.draftapi.Props
import no.ndla.draftapi.service.search.{ArticleIndexService, TagIndexService}
import no.ndla.search.Reindexer

import scala.util.Try

/** Reindexes all draft-api indexes in a separate instance */
class StandaloneIndexing(using props: Props, articleIndexService: ArticleIndexService, tagIndexService: TagIndexService)
    extends StandaloneJob {
  override val name: String = "index"

  override def execute(): Try[Unit] =
    Reindexer.reindexAll(Seq(articleIndexService, tagIndexService))(_.indexDocuments(None))
}

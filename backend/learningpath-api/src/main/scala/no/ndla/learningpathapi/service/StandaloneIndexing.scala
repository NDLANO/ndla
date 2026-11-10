/*
 * Part of NDLA learningpath-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.learningpathapi.service

import no.ndla.common.job.StandaloneJob
import no.ndla.learningpathapi.Props
import no.ndla.learningpathapi.service.search.SearchIndexService
import no.ndla.search.Reindexer

import scala.util.Try

/** Reindexes all learningpath-api indexes in a separate instance */
class StandaloneIndexing(using props: Props, searchIndexService: SearchIndexService) extends StandaloneJob {
  override val name: String = "index"

  override def execute(): Try[Unit] = Reindexer.reindexAll(Seq(searchIndexService))(_.indexDocuments(None))
}

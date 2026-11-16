/*
 * Part of NDLA image-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.imageapi.service

import no.ndla.common.job.StandaloneJob
import no.ndla.imageapi.Props
import no.ndla.imageapi.service.search.{ImageIndexService, TagIndexService}
import no.ndla.search.Reindexer

import scala.util.Try

/** Reindexes all image-api indexes in a separate instance */
class StandaloneIndexing(using props: Props, imageIndexService: ImageIndexService, tagIndexService: TagIndexService)
    extends StandaloneJob {
  override val name: String = "index"

  override def execute(): Try[Unit] =
    Reindexer.reindexAll(Seq(imageIndexService, tagIndexService))(_.indexDocuments(None))
}

/*
 * Part of NDLA concept-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.conceptapi.service

import no.ndla.common.job.StandaloneJob
import no.ndla.conceptapi.Props
import no.ndla.conceptapi.service.search.{DraftConceptIndexService, PublishedConceptIndexService}
import no.ndla.search.Reindexer

import scala.util.Try

/** Reindexes all concept-api indexes in a separate instance */
class StandaloneIndexing(using
    props: Props,
    draftConceptIndexService: DraftConceptIndexService,
    publishedConceptIndexService: PublishedConceptIndexService,
) extends StandaloneJob {
  override val name: String = "index"

  override def execute(): Try[Unit] =
    Reindexer.reindexAll(Seq(draftConceptIndexService, publishedConceptIndexService))(_.indexDocuments(None))
}

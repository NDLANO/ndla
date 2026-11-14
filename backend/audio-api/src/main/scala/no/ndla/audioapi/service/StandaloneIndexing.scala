/*
 * Part of NDLA audio-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.audioapi.service

import no.ndla.audioapi.Props
import no.ndla.audioapi.service.search.{AudioIndexService, SeriesIndexService, TagIndexService}
import no.ndla.common.job.StandaloneJob
import no.ndla.search.Reindexer

import scala.util.Try

/** Reindexes all audio-api indexes in a separate instance */
class StandaloneIndexing(using
    props: Props,
    audioIndexService: AudioIndexService,
    tagIndexService: TagIndexService,
    seriesIndexService: SeriesIndexService,
) extends StandaloneJob {
  override val name: String = "index"

  override def execute(): Try[Unit] =
    Reindexer.reindexAll(Seq(audioIndexService, tagIndexService, seriesIndexService))(_.indexDocuments(None))
}

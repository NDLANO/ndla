/*
 * Part of NDLA search-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.searchapi.service

import no.ndla.common.job.StandaloneJob
import no.ndla.network.clients.MyNDLAApiClient
import no.ndla.search.Reindexer
import no.ndla.searchapi.Props
import no.ndla.searchapi.integration.GrepApiClient
import no.ndla.searchapi.model.domain.IndexingBundle
import no.ndla.searchapi.service.search.*

import scala.util.Try

/** Reindexes all search-api indexes in a separate instance */
class StandaloneIndexing(using
    props: Props,
    grepApiClient: GrepApiClient,
    myndlaApiClient: MyNDLAApiClient,
    learningPathIndexService: LearningPathIndexService,
    articleIndexService: ArticleIndexService,
    draftIndexService: DraftIndexService,
    draftConceptIndexService: DraftConceptIndexService,
    grepIndexService: GrepIndexService,
    nodeIndexService: NodeIndexService,
) extends StandaloneJob {
  override val name: String                      = "index"
  override val legacyEnabledFlag: Option[String] = Some("STANDALONE_INDEXING_ENABLED")

  override def execute(): Try[Unit] = for {
    grepBundle    <- grepApiClient.getGrepBundle()
    myndlaBundle  <- myndlaApiClient.getMyNDLABundle
    indexingBundle =
      IndexingBundle(grepBundle = Some(grepBundle), taxonomyBundle = None, myndlaBundle = Some(myndlaBundle))
    _ <- Reindexer.reindexAll(
      Seq(
        Reindexer.Index(learningPathIndexService)(_.indexDocuments(indexingBundle)),
        Reindexer.Index(articleIndexService)(_.indexDocuments(indexingBundle)),
        Reindexer.Index(draftIndexService)(_.indexDocuments(indexingBundle)),
        Reindexer.Index(draftConceptIndexService)(_.indexDocuments(indexingBundle)),
        Reindexer.Index(grepIndexService)(_.indexDocuments(None, indexingBundle.grepBundle)),
        Reindexer.Index(nodeIndexService)(_.indexDocuments(None, indexingBundle)),
      )
    )
  } yield ()
}

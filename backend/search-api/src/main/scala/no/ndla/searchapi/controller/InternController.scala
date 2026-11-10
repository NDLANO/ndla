/*
 * Part of NDLA search-api
 * Copyright (C) 2018 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.searchapi.controller

import cats.implicits.{catsSyntaxEitherId, toTraverseOps}
import com.typesafe.scalalogging.StrictLogging
import io.circe.Decoder
import no.ndla.common.CirceUtil
import no.ndla.common.model.domain.article.Article
import no.ndla.common.model.domain.draft.Draft
import no.ndla.common.model.domain.Content
import no.ndla.common.model.domain.concept.Concept
import no.ndla.common.model.domain.learningpath.LearningPath
import no.ndla.network.tapir.NoNullJsonPrinter.jsonBody
import no.ndla.network.tapir.{AllErrors, ErrorHandling, ErrorHelpers, TapirController}
import no.ndla.network.tapir.TapirUtil.errorOutputsFor
import no.ndla.searchapi.model.api.InvalidIndexBodyException
import no.ndla.searchapi.service.search.{
  ArticleIndexService,
  DraftConceptIndexService,
  DraftIndexService,
  GrepIndexService,
  IndexService,
  LearningPathIndexService,
}

import sttp.tapir.generic.auto.*

import scala.util.{Failure, Success, Try}
import sttp.tapir.*
import sttp.tapir.server.ServerEndpoint

class InternController(using
    articleIndexService: ArticleIndexService,
    learningPathIndexService: LearningPathIndexService,
    draftIndexService: DraftIndexService,
    draftConceptIndexService: DraftConceptIndexService,
    grepIndexService: GrepIndexService,
    errorHandling: ErrorHandling,
    errorHelpers: ErrorHelpers,
) extends TapirController
    with StrictLogging {
  import errorHelpers.*
  import errorHandling.*

  override val prefix: EndpointInput[Unit] = "intern"
  override val enableSwagger               = false

  override val endpoints: List[ServerEndpoint[Any, Eff]] =
    List(reindexShards, reindexReplicas, deleteDocument, indexSingleDocument, reindexById)

  def deleteDocument: ServerEndpoint[Any, Eff] = endpoint
    .delete
    .in(path[String]("type") / path[Long]("id"))
    .out(noContent)
    .errorOut(errorOutputsFor(400))
    .serverLogicPure { case (indexType, documentId) =>
      (
        indexType match {
          case articleIndexService.documentType      => articleIndexService.deleteDocument(documentId)
          case draftIndexService.documentType        => draftIndexService.deleteDocument(documentId)
          case learningPathIndexService.documentType => learningPathIndexService.deleteDocument(documentId)
          case draftConceptIndexService.documentType => draftConceptIndexService.deleteDocument(documentId)
          case _                                     => Success(())
        }
      ).map(_ => ())
    }

  private def parseBody[T: Decoder](body: String): Try[T] = {
    CirceUtil
      .tryParseAs[T](body)
      .recoverWith { case _ =>
        Failure(InvalidIndexBodyException())
      }
  }

  private def indexRequestWithService[T <: Content: Decoder](
      indexService: IndexService[T],
      body: String,
  ): Either[AllErrors, T] = {
    parseBody[T](body).flatMap(x => indexService.indexDocument(x)) match {
      case Success(doc) => doc.asRight
      case Failure(ex)  =>
        logger.error("Could not index document...", ex)
        returnLeftError(ex)
    }
  }

  def indexSingleDocument: ServerEndpoint[Any, Eff] = endpoint
    .post
    .in(path[String]("type"))
    .in(stringBody)
    .out(
      oneOf[Content](
        oneOfVariant(jsonBody[Article]),
        oneOfVariant(jsonBody[Draft]),
        oneOfVariant(jsonBody[LearningPath]),
        oneOfVariant(jsonBody[Concept]),
      )
    )
    .errorOut(errorOutputsFor(400, 409))
    .serverLogicPure { case (indexType, body) =>
      indexType match {
        case articleIndexService.documentType      => indexRequestWithService(articleIndexService, body)
        case draftIndexService.documentType        => indexRequestWithService(draftIndexService, body)
        case learningPathIndexService.documentType => indexRequestWithService(learningPathIndexService, body)
        case draftConceptIndexService.documentType => indexRequestWithService(draftConceptIndexService, body)
        case _                                     => badRequest(
            s"Bad type passed to POST /:type/, must be one of: '${articleIndexService.documentType}', '${draftIndexService.documentType}', '${learningPathIndexService.documentType}', '${draftConceptIndexService.documentType}'"
          ).asLeft
      }
    }

  def reindexById: ServerEndpoint[Any, Eff] = endpoint
    .post
    .in("reindex" / path[String]("type") / path[Long]("id"))
    .errorOut(errorOutputsFor(400))
    .out(
      oneOf[Content](
        oneOfVariant(jsonBody[Article]),
        oneOfVariant(jsonBody[Draft]),
        oneOfVariant(jsonBody[LearningPath]),
        oneOfVariant(jsonBody[Concept]),
      )
    )
    .serverLogicPure { case (indexType, id) =>
      indexType match {
        case articleIndexService.documentType      => articleIndexService.reindexDocument(id)
        case draftIndexService.documentType        => draftIndexService.reindexDocument(id)
        case learningPathIndexService.documentType => learningPathIndexService.reindexDocument(id)
        case draftConceptIndexService.documentType => draftConceptIndexService.reindexDocument(id)
        case _                                     => badRequest(
            s"Bad type passed to POST /:type/:id, must be one of: '${articleIndexService.documentType}', '${draftIndexService.documentType}', '${learningPathIndexService.documentType}', '${draftConceptIndexService.documentType}'"
          ).asLeft
      }
    }

  def reindexShards: ServerEndpoint[Any, Eff] = endpoint
    .post
    .in("reindex" / "shards" / path[Int]("num_shards"))
    .errorOut(errorOutputsFor(400))
    .out(stringBody)
    .serverLogicPure { case (numShards) =>
      val startTime = System.currentTimeMillis()
      logger.info("Cleaning up unreferenced indexes before reindexing...")
      articleIndexService.cleanupIndexes(): Unit
      draftIndexService.cleanupIndexes(): Unit
      learningPathIndexService.cleanupIndexes(): Unit
      draftConceptIndexService.cleanupIndexes(): Unit
      grepIndexService.cleanupIndexes(): Unit

      val articles      = articleIndexService.reindexWithShards(numShards)
      val drafts        = draftIndexService.reindexWithShards(numShards)
      val learningpaths = learningPathIndexService.reindexWithShards(numShards)
      val concept       = draftConceptIndexService.reindexWithShards(numShards)
      val greps         = grepIndexService.reindexWithShards(numShards)
      List(articles, drafts, learningpaths, concept, greps).sequence match {
        case Success(_) =>
          s"Reindexing with $numShards shards completed in ${System.currentTimeMillis() - startTime}ms".asRight
        case Failure(ex) =>
          logger.error("Could not reindex with shards...", ex)
          returnLeftError(ex)
      }
    }

  def reindexReplicas: ServerEndpoint[Any, Eff] = endpoint
    .post
    .in("reindex" / "replicas" / path[Int]("num_replicas"))
    .errorOut(errorOutputsFor(400))
    .out(stringBody)
    .serverLogicPure { case (numReplicas) =>
      logger.info("Cleaning up unreferenced indexes before updating replications setting...")
      articleIndexService.cleanupIndexes(): Unit
      draftIndexService.cleanupIndexes(): Unit
      learningPathIndexService.cleanupIndexes(): Unit
      draftConceptIndexService.cleanupIndexes(): Unit
      grepIndexService.cleanupIndexes(): Unit

      val articles      = articleIndexService.updateReplicaNumber(numReplicas)
      val drafts        = draftIndexService.updateReplicaNumber(numReplicas)
      val learningpaths = learningPathIndexService.updateReplicaNumber(numReplicas)
      val concepts      = draftConceptIndexService.updateReplicaNumber(numReplicas)
      val greps         = grepIndexService.updateReplicaNumber(numReplicas)
      List(articles, drafts, learningpaths, concepts, greps).sequence match {
        case Success(_) =>
          s"Updated replication setting for indexes to $numReplicas replicas. Populating may take some time.".asRight
        case Failure(ex) =>
          logger.error("Could not update replication settings", ex)
          returnLeftError(ex)
      }
    }
}

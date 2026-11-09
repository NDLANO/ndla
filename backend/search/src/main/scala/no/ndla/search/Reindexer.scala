/*
 * Part of NDLA search
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.search

import com.typesafe.scalalogging.StrictLogging
import no.ndla.search.model.domain.{ElasticIndexingException, ReindexResult}

import java.util.concurrent.Executors
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, ExecutionContext, Future}
import scala.util.{Failure, Success, Try, Using}

/** Reindexes several indexes in parallel, typically as part of a standalone indexing job */
object Reindexer extends StrictLogging {

  /** @param name
    *   Name of the index, used in logs and error messages
    */
  case class Index(name: String, reindex: () => Try[ReindexResult])

  object Index {

    /** An index named after the [[BaseIndexService.searchIndex]] of `indexService` */
    def apply[S <: BaseIndexService](indexService: S)(reindex: S => Try[ReindexResult]): Index =
      Index(indexService.searchIndex, () => reindex(indexService))
  }

  /** Reindexes every one of `indexServices` with `reindex`, see the other overload */
  def reindexAll[S <: BaseIndexService](indexServices: Seq[S])(reindex: S => Try[ReindexResult]): Try[Unit] =
    reindexAll(indexServices.map(indexService => Index(indexService)(reindex)))

  /** Fails if reindexing any of the `indexes` fails, or if any of the documents could not be indexed */
  def reindexAll(indexes: Seq[Index]): Try[Unit] = Using(
    ExecutionContext.fromExecutorService(Executors.newFixedThreadPool(indexes.size.max(1)))
  ) { case given ExecutionContext =>
    val errors = Future.traverse(indexes)(index => Future(reindexAndDescribeError(index)))
    Await.result(errors, Duration.Inf).flatten
  }.flatMap {
    case Seq()  => Success(())
    case errors => Failure(ElasticIndexingException(errors.mkString("\n")))
  }

  private def reindexAndDescribeError(index: Index): Option[String] = Try(index.reindex()).flatten match {
    case Success(result) if result.failedIndexed > 0 =>
      val total   = result.totalIndexed + result.failedIndexed
      val message =
        s"Indexing of '${index.name}' finished with ${result.failedIndexed} errors (${result.totalIndexed}/$total)"
      logger.warn(message)
      Some(message)
    case Success(result) =>
      logger.info(s"Completed indexing of ${result.totalIndexed} ${index.name} in ${result.millisUsed} ms.")
      None
    case Failure(ex) =>
      logger.error(s"Failed to index '${index.name}'", ex)
      Some(s"Indexing of '${index.name}' failed: ${ex.getMessage}")
  }
}

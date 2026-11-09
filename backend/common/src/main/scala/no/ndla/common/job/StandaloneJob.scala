/*
 * Part of NDLA common
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.job

import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.Environment.booleanPropOrFalse
import no.ndla.common.configuration.BaseProps

import scala.util.Properties.propOrNone
import scala.util.{Failure, Success, Try}

/** A job that runs to completion instead of the API server, meant to be spawned by a Kubernetes Job or CronJob. A job
  * is selected by setting the `STANDALONE_JOB` environment variable to its [[name]].
  */
abstract class StandaloneJob(using props: BaseProps) extends StrictLogging {
  val name: String

  // TODO: Remove after this has been deployed to all environments and deploy CLI has been migrated.
  /** Boolean environment variable that also selects this job, for deployments that predate `STANDALONE_JOB` */
  val legacyEnabledFlag: Option[String] = None

  protected def execute(): Try[Unit]

  /** @param setup
    *   Runs before the job, such as database migrations. The job fails without running if this throws.
    */
  def run(setup: => Unit = ()): Try[Unit] = {
    logger.info(s"Starting standalone job '$name'")
    val start = System.currentTimeMillis()

    val result = for {
      _ <- Try(setup)
      _ <- Try(execute()).flatten
    } yield ()

    val elapsed = System.currentTimeMillis() - start

    result match {
      case Success(_)  => logger.info(s"Standalone job '$name' finished successfully in $elapsed ms")
      case Failure(ex) =>
        val message = Option(ex.getMessage).getOrElse(ex.toString)
        logger.error(s"Standalone job '$name' failed after $elapsed ms: $message")
        SlackNotifier.sendError(
          title = s"${props.ApplicationName} ${props.Environment}",
          text = s"Standalone job '$name' failed with:\n$message",
        )
    }

    result
  }
}

object StandaloneJob {
  val EnvKey = "STANDALONE_JOB"

  def select(jobs: Seq[StandaloneJob]): Try[Option[StandaloneJob]] = propOrNone(EnvKey).filter(_.nonEmpty) match {
    case Some(jobName) => jobs.find(_.name == jobName) match {
        case Some(job) => Success(Some(job))
        case None      => Failure(
            IllegalArgumentException(
              s"Unknown standalone job '$jobName' in $EnvKey. Expected one of: ${jobs.map(_.name).mkString(", ")}"
            )
          )
      }
    case None => Success(jobs.find(_.legacyEnabledFlag.exists(booleanPropOrFalse)))
  }
}

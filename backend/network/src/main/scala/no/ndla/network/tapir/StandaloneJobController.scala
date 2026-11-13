/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir

import cats.implicits.*
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import no.ndla.common.DeriveHelpers
import no.ndla.common.job.StandaloneJob
import no.ndla.network.tapir.NoNullJsonPrinter.jsonBody
import no.ndla.network.tapir.TapirUtil.errorOutputsFor
import sttp.model.StatusCode
import sttp.tapir.*
import sttp.tapir.Schema.annotations.description
import sttp.tapir.server.ServerEndpoint

import java.util.concurrent.ConcurrentHashMap
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, Future, Promise}
import scala.util.{Failure, Success, Try}

/** Runs [[StandaloneJob]]s inside the API server instead of in a separate instance, such as for local development or
  * for testing a live pod. A job can only run once at a time per server.
  */
class StandaloneJobController(jobs: Seq[StandaloneJob])(using errorHelpers: ErrorHelpers, errorHandling: ErrorHandling)
    extends TapirController {
  import errorHelpers.*

  override val enableSwagger: Boolean       = false
  protected val prefix: EndpointInput[Unit] = "intern" / "jobs"

  private val runningJobs = ConcurrentHashMap.newKeySet[String]().nn

  override val endpoints: List[ServerEndpoint[Any, Eff]] = List(listJobs, runJob)

  private def listJobs: ServerEndpoint[Any, Eff] = endpoint
    .get
    .out(jsonBody[List[StandaloneJobDTO]])
    .serverLogicPure { _ =>
      jobs.map(job => StandaloneJobDTO(job.name, runningJobs.contains(job.name))).toList.asRight
    }

  private def runJob: ServerEndpoint[Any, Eff] = endpoint
    .post
    .in(path[String]("name"))
    .in(query[Boolean]("run-in-background").default(false))
    .out(statusCode.and(stringBody))
    .errorOut(errorOutputsFor(404, 409, 500))
    .serverLogicPure { (name, runInBackground) =>
      jobs.find(_.name == name) match {
        case None =>
          val validNames = jobs.map(_.name).mkString(", ")
          notFoundWithMsg(s"Unknown standalone job '$name'. Expected one of: $validNames").asLeft
        case Some(job) =>
          if (!runningJobs.add(job.name)) conflict(s"Standalone job '$name' is already running").asLeft
          else {
            val future = start(job)
            if (runInBackground) (StatusCode.Accepted, s"Started standalone job '$name' in the background").asRight
            else Try(Await.result(future, Duration.Inf)) match {
              case Success(_)  => (StatusCode.Ok, s"Standalone job '$name' finished successfully").asRight
              case Failure(ex) =>
                val message = Option(ex.getMessage).getOrElse(ex.toString)
                errorBody(GENERIC, s"Standalone job '$name' failed: $message", 500).asLeft
            }
          }
      }
    }

  /** Runs `job` on its own thread, so that it keeps running if the request that started it is cancelled */
  private def start(job: StandaloneJob): Future[Unit] = {
    val promise = Promise[Unit]()
    Thread
      .ofVirtual()
      .nn
      .name(s"standalone-job-${job.name}")
      .nn
      .start { () =>
        val result =
          try job.run()
          catch {
            case ex: Throwable =>
              logger.error(s"Standalone job '${job.name}' failed unexpectedly", ex)
              Failure(ex)
          }
        runningJobs.remove(job.name)
        promise.complete(result)
      }
    promise.future
  }
}

@description("A standalone job that can be run on this server")
case class StandaloneJobDTO(
    @description("Name of the job, used to run it")
    name: String,
    @description("Whether the job is currently running on this server")
    running: Boolean,
)

object StandaloneJobDTO {
  implicit val encoder: Encoder[StandaloneJobDTO] = deriveEncoder
  implicit val decoder: Decoder[StandaloneJobDTO] = deriveDecoder
  implicit val schema: Schema[StandaloneJobDTO]   = DeriveHelpers.getSchema
}

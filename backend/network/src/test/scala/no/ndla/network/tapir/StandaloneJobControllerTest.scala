/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir

import no.ndla.common.CirceUtil
import no.ndla.common.auth.Permission
import no.ndla.common.configuration.BaseProps
import no.ndla.common.job.StandaloneJob
import no.ndla.scalatestsuite.UnitTestSuite
import no.ndla.tapirtesting.TapirControllerTest
import sttp.client4.quick.*

import java.util.concurrent.{CountDownLatch, TimeUnit}
import java.util.concurrent.atomic.AtomicInteger
import scala.concurrent.duration.DurationInt
import scala.util.{Failure, Try}

class StandaloneJobControllerTest extends UnitTestSuite, TapirControllerTest {
  override implicit lazy val props: BaseProps = new BaseProps {
    override def ApplicationPort: Int             = findFreePort
    override def ApplicationName: String          = "StandaloneJobControllerTest"
    override val ndlaAuth0Scopes: Seq[Permission] = Seq.empty
  }

  private class TestJob(val name: String)(result: => Try[Unit]) extends StandaloneJob {
    val started  = AtomicInteger(0)
    val finished = AtomicInteger(0)

    override protected def execute(): Try[Unit] = {
      started.incrementAndGet(): Unit
      val r = result
      finished.incrementAndGet(): Unit
      r
    }
  }

  private class BlockingJob(name: String) extends TestJob(name)(Try(BlockingJob.await(name))) {
    def release(): Unit = BlockingJob.latches(name).countDown()
  }

  private object BlockingJob {
    val latches: Map[String, CountDownLatch] = Map("background" -> CountDownLatch(1), "abandoned" -> CountDownLatch(1))

    def await(name: String): Unit =
      if (!latches(name).await(10, TimeUnit.SECONDS)) throw RuntimeException(s"Job '$name' was never released")
  }

  private val successJob    = TestJob("success")(Try(Thread.sleep(300)))
  private val failingJob    = TestJob("failing")(Failure(RuntimeException("something broke")))
  private val backgroundJob = BlockingJob("background")
  private val abandonedJob  = BlockingJob("abandoned")

  override val controller: StandaloneJobController =
    new StandaloneJobController(using Seq(successJob, failingJob, backgroundJob, abandonedJob))

  private def jobRequest(name: String, runInBackground: Boolean = false) =
    quickRequest.post(uri"http://localhost:$serverPort/intern/jobs/$name?run-in-background=$runInBackground")

  private def runJob(name: String, runInBackground: Boolean = false) = jobRequest(name, runInBackground).send()

  private def listJobs(): List[StandaloneJobDTO] = {
    val response = quickRequest.get(uri"http://localhost:$serverPort/intern/jobs").send()
    response.code.code should be(200)
    CirceUtil.unsafeParseAs[List[StandaloneJobDTO]](response.body)
  }

  private def isRunning(name: String): Boolean = listJobs().find(_.name == name).exists(_.running)

  test("That all available jobs are listed") {
    listJobs().map(_.name) should be(List("success", "failing", "background", "abandoned"))
  }

  test("That a job is run and the endpoint responds when it is done") {
    val response = runJob("success")

    response.code.code should be(200)
    successJob.finished.get() should be(1)
  }

  test("That an unknown job returns 404 and lists the available jobs") {
    val response = runJob("unknown")

    response.code.code should be(404)
    response.body should include("Expected one of: success, failing, background, abandoned")
  }

  test("That a failing job returns 500 with the failure message, and can be run again") {
    val first  = runJob("failing")
    val second = runJob("failing")

    first.code.code should be(500)
    first.body should include("something broke")
    second.code.code should be(500)
    failingJob.finished.get() should be(2)
  }

  test("That a job runs in the background and cannot be started again while it is running") {
    val started = runJob("background", runInBackground = true)
    started.code.code should be(202)
    blockUntil(() => backgroundJob.started.get() == 1)
    isRunning("background") should be(true)

    runJob("background", runInBackground = true).code.code should be(409)
    runJob("background").code.code should be(409)

    backgroundJob.release()
    blockUntil(() => !isRunning("background"))
    blockUntil(() => runJob("background").code.code == 200)
    backgroundJob.finished.get() should be(2)
  }

  test("That a job keeps running when the request that started it is cancelled") {
    Try(jobRequest("abandoned").readTimeout(500.millis).send()).isFailure should be(true)
    abandonedJob.started.get() should be(1)

    // Give the server time to notice the closed connection, which interrupts the request's server logic
    Thread.sleep(500)
    runJob("abandoned", runInBackground = true).code.code should be(409)

    abandonedJob.release()
    blockUntil(() => abandonedJob.finished.get() == 1)
    blockUntil(() => runJob("abandoned", runInBackground = true).code.code == 202)
  }
}

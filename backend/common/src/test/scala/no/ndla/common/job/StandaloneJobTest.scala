/*
 * Part of NDLA common
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.job

import no.ndla.common.TestProps
import no.ndla.testbase.UnitTestSuiteBase

import scala.util.{Failure, Success, Try}

class StandaloneJobTest extends UnitTestSuiteBase {
  private class TestJob(val name: String, override val legacyEnabledFlag: Option[String] = None)(
      result: => Try[Unit] = Success(())
  ) extends StandaloneJob(using TestProps()) {
    override def execute(): Try[Unit] = result
  }

  private val indexJob   = TestJob("index", Some("LEGACY_INDEX_ENABLED"))()
  private val cleanupJob = TestJob("cleanup")()
  private val jobs       = Seq(indexJob, cleanupJob)

  private def withProps[T](props: (String, String)*)(f: => T): T = {
    props.foreach((key, value) => System.setProperty(key, value))
    try f
    finally props.foreach((key, _) => System.clearProperty(key))
  }

  test("That select picks the job named by STANDALONE_JOB") {
    withProps(StandaloneJob.EnvKey -> "cleanup") {
      StandaloneJob.select(jobs) should be(Success(Some(cleanupJob)))
    }
  }

  test("That select fails for an unknown job name") {
    withProps(StandaloneJob.EnvKey -> "unknown") {
      StandaloneJob.select(jobs).failed.get.getMessage.nn should include("Expected one of: index, cleanup")
    }
  }

  test("That select falls back to legacy enabled flags") {
    withProps("LEGACY_INDEX_ENABLED" -> "true") {
      StandaloneJob.select(jobs) should be(Success(Some(indexJob)))
    }
    withProps("LEGACY_INDEX_ENABLED" -> "false") {
      StandaloneJob.select(jobs) should be(Success(None))
    }
  }

  test("That STANDALONE_JOB takes precedence over legacy enabled flags") {
    withProps(StandaloneJob.EnvKey -> "cleanup", "LEGACY_INDEX_ENABLED" -> "true") {
      StandaloneJob.select(jobs) should be(Success(Some(cleanupJob)))
    }
  }

  test("That select returns no job when nothing is set") {
    StandaloneJob.select(jobs) should be(Success(None))
    withProps(StandaloneJob.EnvKey -> "") {
      StandaloneJob.select(jobs) should be(Success(None))
    }
  }

  test("That the runner returns the job result") {
    val ex         = RuntimeException("failed")
    val failingJob = TestJob("failing")(Failure(ex))

    indexJob.run() should be(Success(()))
    failingJob.run() should be(Failure(ex))
  }

  test("That the runner runs setup before the job") {
    var events = Seq.empty[String]
    val job    = TestJob("ordered")(
      Try {
        events = events :+ "job"
      }
    )

    job.run(setup = events = events :+ "setup") should be(Success(()))
    events should be(Seq("setup", "job"))
  }

  test("That the runner fails without running the job if setup throws") {
    val ex     = RuntimeException("migration failed")
    var jobRan = false
    val job    = TestJob("never")(
      Try {
        jobRan = true
      }
    )

    job.run(setup = throw ex) should be(Failure(ex))
    jobRan should be(false)
  }

  test("That the runner turns thrown exceptions into failures") {
    val ex          = RuntimeException("boom")
    val throwingJob = TestJob("throwing")(throw ex)

    throwingJob.run() should be(Failure(ex))
  }
}

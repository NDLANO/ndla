/*
 * Part of NDLA search
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.search

import no.ndla.search.model.domain.ReindexResult
import no.ndla.testbase.UnitTestSuiteBase

import java.util.concurrent.atomic.AtomicInteger
import scala.util.{Failure, Success}

class ReindexerTest extends UnitTestSuiteBase {
  private def successfulIndex(name: String, calls: AtomicInteger) = Reindexer.Index(
    name,
    () => {
      calls.incrementAndGet(): Unit
      Success(ReindexResult(name, failedIndexed = 0, totalIndexed = 10, millisUsed = 1))
    },
  )

  test("That reindexAll succeeds when all indexes succeed") {
    val calls = AtomicInteger()
    Reindexer.reindexAll(Seq(successfulIndex("a", calls), successfulIndex("b", calls))) should be(Success(()))
    calls.get() should be(2)
  }

  test("That reindexAll succeeds without any indexes") {
    Reindexer.reindexAll(Seq.empty) should be(Success(()))
  }

  test("That reindexAll reports every failing index and still runs the others") {
    val calls   = AtomicInteger()
    val indexes = Seq(
      successfulIndex("ok", calls),
      Reindexer.Index("partial", () => Success(ReindexResult("partial", 2, 8, 1))),
      Reindexer.Index("failed", () => Failure(RuntimeException("elastic is down"))),
      Reindexer.Index("thrown", () => throw RuntimeException("unexpected")),
    )

    val result = Reindexer.reindexAll(indexes)

    calls.get() should be(1)
    result.isFailure should be(true)
    result.failed.get.getMessage should be(
      Seq(
        "Indexing of 'partial' finished with 2 errors (8/10)",
        "Indexing of 'failed' failed: elastic is down",
        "Indexing of 'thrown' failed: unexpected",
      ).mkString("\n")
    )
  }
}

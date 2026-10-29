/*
 * Part of NDLA common
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common

import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.implicits.toOption

import scala.annotation.tailrec
import scala.util.{Failure, Success, Try}

object TryUtil extends StrictLogging {

  /** Recursively checks if the given `Throwable` or any of its causes is an `InterruptedException`. */
  @tailrec
  def containsInterruptedException(t: Throwable): Boolean = {
    (t, t.getCause.toOption) match {
      case (_: InterruptedException, _) => true
      case (_, Some(cause))             => containsInterruptedException(cause)
      case _                            => false
    }
  }

  def rethrowInterruptedWithSuppressed(maybeEx: Option[Throwable]): Nothing = {
    val interruptedEx = new InterruptedException
    maybeEx.foreach(ex => interruptedEx.addSuppressed(ex))
    logger.info("Thread was interrupted in `throwIfInterrupted`", interruptedEx)
    throw interruptedEx
  }

  extension (tryObj: Try.type) {

    /** If the condition is satisfied, return the given `A` in `Success`, otherwise, return the given `Throwable` in
      * `Failure`.
      */
    def cond[A](cond: Boolean)(value: => A, ex: => Throwable): Try[A] = {
      if (cond) Success(value)
      else Failure(ex)
    }

    /** Helper function to re-throw [[InterruptedException]] if the thread has been interrupted, before or during a
      * `Try(...)` block.
      */
    def throwIfInterrupted[T](f: => T): Try[T] = {

      if (Thread.currentThread().toOption.exists(_.isInterrupted)) {
        rethrowInterruptedWithSuppressed(None)
      }

      val result = Try(f).recoverWith {
        case ex if containsInterruptedException(ex) => rethrowInterruptedWithSuppressed(Some(ex))
      }

      if (Thread.currentThread().toOption.exists(_.isInterrupted)) {
        rethrowInterruptedWithSuppressed(result.failed.toOption)
      }

      result
    }
  }

  extension (failure: Failure.type) {

    /** If the condition is satisfied, return the given `Throwable` in `Failure`, otherwise, return a `Unit` in
      * `Success`.
      */
    def when[A](cond: Boolean)(ex: => Throwable): Try[Unit] = {
      if (cond) Failure(ex)
      else Success(())
    }
  }
}

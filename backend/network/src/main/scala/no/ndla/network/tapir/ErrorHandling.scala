/*
 * Part of NDLA network
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir

import cats.implicits.catsSyntaxEitherId
import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.TryUtil
import no.ndla.common.implicits.toOption

trait ErrorHandling(using errorHelpers: ErrorHelpers) extends StrictLogging {

  private def handleUnknownError(e: Throwable): ErrorBody = {
    if (Thread.currentThread().toOption.exists(_.isInterrupted) || TryUtil.containsInterruptedException(e)) {
      logger.info("Thread was interrupted", e)
      errorHelpers.clientClosed
    } else {
      logger.error(s"Unhandled exception: ${e.getMessage}", e)
      errorHelpers.generic
    }
  }

  def handleErrors: PartialFunction[Throwable, AllErrors]
  def returnError(ex: Throwable): AllErrors                   = handleErrors.applyOrElse(ex, handleUnknownError)
  def returnLeftError[R](ex: Throwable): Either[AllErrors, R] = returnError(ex).asLeft[R]
}

/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi.controller

import no.ndla.common.errors.ValidationException
import no.ndla.network.tapir.{AllErrors, ErrorHandling, ErrorHelpers}

class ControllerErrorHandling(using errorHelpers: ErrorHelpers) extends ErrorHandling {
  import errorHelpers.*

  override def handleErrors: PartialFunction[Throwable, AllErrors] = {
    case ex: ValidationException => badRequest(ex.getMessage)
  }
}

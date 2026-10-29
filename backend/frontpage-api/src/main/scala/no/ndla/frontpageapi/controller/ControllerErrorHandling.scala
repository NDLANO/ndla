/*
 * Part of NDLA frontpage-api
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.frontpageapi.controller

import no.ndla.common.errors.{NotFoundException, ValidationException}
import no.ndla.common.implicits.toOption
import no.ndla.frontpageapi.model.domain.Errors.{LanguageNotFoundException, SubjectPageNotFoundException}
import no.ndla.network.tapir.{AllErrors, ErrorHandling, ErrorHelpers}

class ControllerErrorHandling(using errorHelpers: ErrorHelpers) extends ErrorHandling {
  import errorHelpers.*
  override def handleErrors: PartialFunction[Throwable, AllErrors] = {
    case ex: ValidationException          => badRequest(ex.getMessage.toOption.getOrElse(ex.message))
    case ex: SubjectPageNotFoundException => notFoundWithMsg(ex.getMessage.toOption.getOrElse(NOT_FOUND_DESCRIPTION))
    case ex: NotFoundException            => notFoundWithMsg(ex.message)
    case ex: LanguageNotFoundException    => notFoundWithMsg(ex.message)
  }
}

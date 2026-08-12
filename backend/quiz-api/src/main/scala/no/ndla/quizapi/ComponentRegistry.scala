/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi

import no.ndla.common.Clock
import no.ndla.network.tapir.{
  ErrorHelpers,
  Routes,
  SwaggerController,
  SwaggerInfo,
  TapirApplication,
  TapirController,
  TapirHealthController,
}
import no.ndla.quizapi.controller.ControllerErrorHandling

class ComponentRegistry(properties: QuizApiProperties) extends TapirApplication[QuizApiProperties] {
  given props: QuizApiProperties                 = properties
  given clock: Clock                             = new Clock
  given errorHelpers: ErrorHelpers               = new ErrorHelpers
  given errorHandling: ControllerErrorHandling   = new ControllerErrorHandling
  given healthController: TapirHealthController  = new TapirHealthController

  given swaggerInfo: SwaggerInfo =
    SwaggerInfo(prefix = "quiz-api", description = "NDLA API for creating and publishing quizzes.")
  given swagger: SwaggerController = new SwaggerController(healthController)

  given services: List[TapirController] = swagger.allServices
  given routes: Routes                  = new Routes
}

/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi

import no.ndla.common.Clock
import no.ndla.database.{DBMigrator, DBUtility, DataSource}
import no.ndla.network.tapir.{
  ErrorHelpers,
  Routes,
  SwaggerController,
  SwaggerInfo,
  TapirApplication,
  TapirController,
  TapirHealthController,
}
import no.ndla.network.tapir.auth.NdlaAuth
import no.ndla.network.jwt.{DefaultJwsKeySelectorFactory, JwsKeySelectorFactory}
import no.ndla.network.NdlaClient
import no.ndla.quizapi.controller.ControllerErrorHandling
import no.ndla.quizapi.controller.QuizController
import no.ndla.quizapi.model.domain.DBQuiz
import no.ndla.quizapi.repository.QuizRepository
import no.ndla.quizapi.service.{ConverterService, ReadService, WriteService}

class ComponentRegistry(properties: QuizApiProperties) extends TapirApplication[QuizApiProperties] {
  given props: QuizApiProperties                 = properties
  given clock: Clock                             = new Clock
  given dataSource: DataSource                   = DataSource.getDataSource
  given migrator: DBMigrator                     = DBMigrator()
  given dbUtil: DBUtility                        = new DBUtility
  given errorHelpers: ErrorHelpers               = new ErrorHelpers
  given errorHandling: ControllerErrorHandling   = new ControllerErrorHandling
  given healthController: TapirHealthController  = new TapirHealthController
  given ndlaClient: NdlaClient                   = new NdlaClient
  implicit val jwsKeySelectorFactory: JwsKeySelectorFactory = DefaultJwsKeySelectorFactory
  given ndlaAuth: NdlaAuth                       = NdlaAuth()
  given dbQuiz: DBQuiz                           = new DBQuiz
  given quizRepository: QuizRepository           = new QuizRepository
  given converterService: ConverterService       = new ConverterService
  given readService: ReadService                 = new ReadService
  given writeService: WriteService               = new WriteService
  given quizController: QuizController           = new QuizController

  given swaggerInfo: SwaggerInfo =
    SwaggerInfo(prefix = "quiz-api", description = "NDLA API for creating and publishing quizzes.")
  given swagger: SwaggerController = new SwaggerController(healthController, quizController)

  given services: List[TapirController] = swagger.allServices
  given routes: Routes                  = new Routes
}

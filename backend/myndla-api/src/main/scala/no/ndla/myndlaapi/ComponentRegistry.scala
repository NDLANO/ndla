/*
 * Part of NDLA myndla-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi

import no.ndla.common.Clock
import no.ndla.common.aws.NdlaEmailClient
import no.ndla.database.{DBMigrator, DBUtility, DataSource}
import no.ndla.myndlaapi.controller.*
import no.ndla.myndlaapi.db.migrationwithdependencies.V16__MigrateResourcePaths
import no.ndla.myndlaapi.integration.nodebb.NodeBBClient
import no.ndla.myndlaapi.integration.{
  InternalMyNDLAApiClient,
  LearningPathApiClient,
  SearchApiClient,
  TaxonomyApiClient,
}
import no.ndla.myndlaapi.model.domain.*
import no.ndla.myndlaapi.repository.{
  ConfigRepository,
  FolderRepository,
  QuizRepository,
  RobotRepository,
  UserRepository,
}
import no.ndla.myndlaapi.service.*
import no.ndla.myndlaapi.validation.QuizValidator
import no.ndla.network.NdlaClient
import no.ndla.network.clients.FeideApiClient
import no.ndla.network.jwt.{DefaultJwsKeySelectorFactory, JwsKeySelectorFactory}
import no.ndla.network.tapir.auth.{CombinedAuth, FeideAuth, NdlaAuth}
import no.ndla.network.tapir.*

class ComponentRegistry(properties: MyNdlaApiProperties) extends TapirApplication[MyNdlaApiProperties] {
  given props: MyNdlaApiProperties                 = properties
  implicit lazy val clock: Clock                   = new Clock
  given dataSource: DataSource                     = DataSource.getDataSource
  given migrator: DBMigrator                       = DBMigrator(v16__MigrateResourcePaths)
  given dbUtil: DBUtility                          = new DBUtility
  given dbConfigMeta: DBConfigMeta                 = new DBConfigMeta
  given dbMyNDLAUser: DBMyNDLAUser                 = new DBMyNDLAUser
  given dbResourceConnection: DBResourceConnection = new DBResourceConnection
  given dbResource: DBResource                     = new DBResource
  given dbFolder: DBFolder                         = new DBFolder
  given dbSavedSharedFolder: DBSavedSharedFolder   = new DBSavedSharedFolder
  given dbRobotDefinition: DBRobotDefinition       = new DBRobotDefinition
  given dbQuiz: DBQuiz                             = new DBQuiz

  given ndlaClient: NdlaClient                               = new NdlaClient
  implicit lazy val myndlaApiClient: InternalMyNDLAApiClient = new InternalMyNDLAApiClient
  implicit lazy val feideApiClient: FeideApiClient           = new FeideApiClient
  implicit lazy val nodebb: NodeBBClient                     = new NodeBBClient
  given errorHelpers: ErrorHelpers                           = new ErrorHelpers
  given errorHandling: ControllerErrorHandling               = new ControllerErrorHandling
  implicit val jwsKeySelectorFactory: JwsKeySelectorFactory  = DefaultJwsKeySelectorFactory
  implicit lazy val ndlaAuth: NdlaAuth                       = NdlaAuth()
  implicit lazy val feideAuth: FeideAuth                     = FeideAuth()
  given combinedAuth: CombinedAuth                           = CombinedAuth()
  implicit lazy val folderRepository: FolderRepository       = new FolderRepository
  given folderConverterService: FolderConverterService       = new FolderConverterService
  implicit lazy val userRepository: UserRepository           = new UserRepository
  given configRepository: ConfigRepository                   = new ConfigRepository
  given configService: ConfigService                         = new ConfigService
  implicit lazy val folderReadService: FolderReadService     = new FolderReadService
  implicit lazy val folderWriteService: FolderWriteService   = new FolderWriteService
  implicit lazy val userService: UserService                 = new UserService
  given robotRepository: RobotRepository                     = new RobotRepository
  given robotService: RobotService                           = new RobotService
  given quizRepository: QuizRepository                       = new QuizRepository
  given quizConverterService: QuizConverterService           = new QuizConverterService
  given quizValidator: QuizValidator                         = new QuizValidator
  given quizReadService: QuizReadService                     = new QuizReadService
  given quizWriteService: QuizWriteService                   = new QuizWriteService
  implicit lazy val searchApiClient: SearchApiClient         = new SearchApiClient
  given taxonomyApiClient: TaxonomyApiClient                 = new TaxonomyApiClient
  given learningPathApiClient: LearningPathApiClient         = new LearningPathApiClient
  implicit lazy val emailClient: NdlaEmailClient             =
    new NdlaEmailClient(props.outgoingEmail, props.outgoingEmailName, props.AWSEmailRegion)
  lazy val v16__MigrateResourcePaths: V16__MigrateResourcePaths = new V16__MigrateResourcePaths

  given userController: UserController          = new UserController
  lazy val statsController: StatsController     = new StatsController
  given configController: ConfigController      = new ConfigController
  given healthController: TapirHealthController = new TapirHealthController
  given folderController: FolderController      = new FolderController
  given robotController: RobotController        = new RobotController
  given internController: InternController      = new InternController
  given quizController: QuizController          = new QuizController

  given swaggerInfo: SwaggerInfo =
    SwaggerInfo(prefix = "myndla-api", description = "NDLA API to manage users and groups related to MyNDLA")
  given swagger: SwaggerController = new SwaggerController(
    userController,
    statsController,
    configController,
    healthController,
    folderController,
    robotController,
    internController,
    quizController,
  )

  given services: List[TapirController] = swagger.allServices
  given routes: Routes                  = new Routes
}

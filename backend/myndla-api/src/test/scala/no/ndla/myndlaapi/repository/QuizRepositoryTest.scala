/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.repository

import no.ndla.common.model.NDLADate
import no.ndla.common.model.domain.myndla.{MyNDLAUserDocument, UserRole}
import no.ndla.database.{DBMigrator, DBUtility, DataSource}
import no.ndla.myndlaapi.model.api.QuizStatsDTO
import no.ndla.myndlaapi.{TestData, TestEnvironment, UnitSuite}
import no.ndla.scalatestsuite.DatabaseIntegrationSuite
import scalikejdbc.*

import java.net.Socket
import java.util.UUID
import scala.util.{Success, Try}

class QuizRepositoryTest extends DatabaseIntegrationSuite with UnitSuite with TestEnvironment {
  override lazy val schemaName: String              = s"quizrepotest_${ProcessHandle.current().nn.pid()}"
  override implicit lazy val dataSource: DataSource = testDataSource.get
  override implicit lazy val migrator: DBMigrator   = new DBMigrator
  override implicit lazy val DBUtil: DBUtility      = new DBUtility
  var repository: QuizRepository                    = scala.compiletime.uninitialized
  var userRepo: UserRepository                      = scala.compiletime.uninitialized

  def emptyTestDatabase: Boolean = {
    DBUtil.writeSession(implicit session => {
      sql"delete from saved_quizzes;".execute()(using session)
      sql"delete from quizzes;".execute()(using session)
      sql"delete from my_ndla_users;".execute()(using session)
    })
  }

  def serverIsListening: Boolean = {
    val server = props.MetaServer.unsafeGet
    val port   = props.MetaPort.unsafeGet
    Try(new Socket(server, port)) match {
      case Success(c) =>
        c.close()
        true
      case _ => false
    }
  }

  override def beforeEach(): Unit = {
    repository = new QuizRepository
    userRepo = new UserRepository
    if (serverIsListening) {
      emptyTestDatabase
    }
  }

  override def beforeAll(): Unit = {
    super.beforeAll()
    dataSource.connectToDatabase()
    if (serverIsListening) {
      migrator.migrate()
    }
  }

  private def insertUser(feideId: String)(implicit session: DBSession): Unit = {
    userRepo.reserveFeideIdIfNotExists(feideId)
    userRepo
      .insertUser(
        feideId,
        MyNDLAUserDocument(
          favoriteSubjects = Seq.empty,
          userRole = UserRole.STUDENT,
          lastUpdated = NDLADate.of(2024, 1, 1, 12, 0, 0),
          organization = "NDLA",
          groups = Seq.empty,
          username = feideId,
          displayName = feideId,
          email = s"$feideId@ndla.no",
          arenaEnabled = false,
        ),
      )
      .get: Unit
  }

  test("that getStats returns zeroes for an empty database") {
    implicit val session: DBSession = DBUtil.autoSession
    repository.getStats.get should be(QuizStatsDTO(0, 0, 0, 0, 0, 0))
  }

  test("that getStats counts quizzes and saved quizzes") {
    implicit val session: DBSession = DBUtil.autoSession

    val public1 = TestData.publicQuiz(TestData.singleChoiceQuestion).copy(id = UUID.randomUUID().nn)
    val public2 = TestData.publicQuiz(TestData.singleChoiceQuestion).copy(id = UUID.randomUUID().nn)
    val priv    = TestData.privateQuiz.copy(id = UUID.randomUUID().nn)

    repository.insert("owner1", public1).get
    repository.insert("owner1", public2).get
    repository.insert("owner2", priv).get

    insertUser("student1")
    insertUser("student2")

    repository.saveQuiz(public1.id, "student1").get
    repository.saveQuiz(public2.id, "student1").get
    repository.saveQuiz(public1.id, "student2").get

    repository.getStats.get should be(
      QuizStatsDTO(
        total = 3,
        publicQuizzes = 2,
        saved = 3,
        distinctSaved = 2,
        usersWithQuizzes = 2,
        usersWithSavedQuizzes = 2,
      )
    )
  }
}

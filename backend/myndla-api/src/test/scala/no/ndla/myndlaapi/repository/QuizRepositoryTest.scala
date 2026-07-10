/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.repository

import no.ndla.common.model.NDLADate
import no.ndla.database.{DBMigrator, DBUtility, DataSource}
import no.ndla.myndlaapi.model.domain.{
  Choice,
  FreeTextQuestion,
  MultipleChoiceQuestion,
  Quiz,
  QuizLayout,
  QuizStatus,
  SingleChoiceQuestion,
}
import no.ndla.myndlaapi.{TestEnvironment, UnitSuite}
import no.ndla.scalatestsuite.DatabaseIntegrationSuite
import scalikejdbc.*

import java.net.Socket
import java.util.UUID
import scala.util.{Success, Try}

class QuizRepositoryTest extends DatabaseIntegrationSuite with UnitSuite with TestEnvironment {
  override lazy val schemaName: String              = s"quizrepotest_${ProcessHandle.current().pid()}"
  override implicit lazy val dataSource: DataSource = testDataSource.get
  override implicit lazy val migrator: DBMigrator   = new DBMigrator
  override implicit lazy val DBUtil: DBUtility      = new DBUtility
  var repository: QuizRepository                    = scala.compiletime.uninitialized

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
    if (serverIsListening) {
      DBUtil.writeSession(implicit session => sql"delete from quizzes".execute()(using session))
    }
  }

  override def beforeAll(): Unit = {
    super.beforeAll()
    dataSource.connectToDatabase()
    if (serverIsListening) {
      migrator.migrate()
    }
  }

  private val now: NDLADate = NDLADate.now().withNano(0)

  private def sampleQuiz(ownerId: String): Quiz = {
    val optA = Choice(UUID.randomUUID(), "A")
    val optB = Choice(UUID.randomUUID(), "B")
    Quiz(
      id = UUID.randomUUID(),
      ownerId = ownerId,
      name = "Quiz",
      description = Some("desc"),
      status = QuizStatus.PUBLIC,
      layout = QuizLayout.MULTI_PAGE,
      questions = List(
        SingleChoiceQuestion(UUID.randomUUID(), now, now, "single?", List(optA, optB), correctOptionId = optA.id),
        MultipleChoiceQuestion(
          UUID.randomUUID(),
          now,
          now,
          "multi?",
          List(optA, optB),
          correctOptionIds = Set(optA.id),
        ),
        FreeTextQuestion(UUID.randomUUID(), now, now, "free?"),
      ),
      created = now,
      updated = now,
      shared = Some(now),
    )
  }

  test("that inserting and retrieving a quiz round-trips through jsonb") {
    assume(serverIsListening)
    val quiz = sampleQuiz("feide-owner")
    repository.insert(quiz).get
    repository.withId(quiz.id).get should be(Some(quiz))
  }

  test("that updating a quiz persists the new document") {
    assume(serverIsListening)
    val quiz = sampleQuiz("feide-owner")
    repository.insert(quiz).get
    val updated = quiz.copy(name = "Updated name", status = QuizStatus.PRIVATE, shared = None)
    repository.update(updated).get
    repository.withId(quiz.id).get should be(Some(updated))
  }

  test("that listByOwner only returns quizzes for the given owner") {
    assume(serverIsListening)
    val mine     = sampleQuiz("owner-1")
    val alsoMine = sampleQuiz("owner-1")
    val other    = sampleQuiz("owner-2")
    repository.insert(mine).get
    repository.insert(alsoMine).get
    repository.insert(other).get

    val result = repository.listByOwner("owner-1").get
    result.map(_.id).toSet should be(Set(mine.id, alsoMine.id))
  }

  test("that deleting a quiz removes it") {
    assume(serverIsListening)
    val quiz = sampleQuiz("feide-owner")
    repository.insert(quiz).get
    repository.deleteById(quiz.id).get should be(quiz.id)
    repository.withId(quiz.id).get should be(None)
  }
}

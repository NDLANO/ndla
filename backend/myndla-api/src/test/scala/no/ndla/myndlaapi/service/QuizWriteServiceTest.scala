/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.service

import no.ndla.common.model.domain.Title
import no.ndla.common.model.domain.myndla.UserRole
import no.ndla.myndlaapi.TestData
import no.ndla.myndlaapi.TestEnvironment
import no.ndla.myndlaapi.model.api.NewQuizDTO
import no.ndla.myndlaapi.model.domain.{Question, QuestionType, Quiz, QuizStatus}
import no.ndla.network.model.{CombinedUser, CombinedUserWithMyNDLAUser, FeideIdToken, FeideUserWrapper}
import no.ndla.scalatestsuite.UnitTestSuite
import no.ndla.testbase.NullSafeMockito.{any, eqTo, never, reset, spy, verify, when}
import scalikejdbc.DBSession

import java.util.UUID
import scala.util.Success

class QuizWriteServiceTest extends UnitTestSuite with TestEnvironment {

  private val service: QuizWriteService = spy(new QuizWriteService)

  private def owner(feideId: String = "owner-feide-id"): CombinedUserWithMyNDLAUser = CombinedUserWithMyNDLAUser(
    None,
    FeideUserWrapper(TestData.emptyMyNDLAUser.copy(feideId = feideId), mock[FeideIdToken]),
  )

  private val notOwner = CombinedUserWithMyNDLAUser(
    None,
    FeideUserWrapper(TestData.emptyMyNDLAUser.copy(feideId = "someone-else"), mock[FeideIdToken]),
  )

  private val student = CombinedUserWithMyNDLAUser(
    None,
    FeideUserWrapper(
      TestData.emptyMyNDLAUser.copy(feideId = "student-feide-id", userRole = UserRole.STUDENT),
      mock[FeideIdToken],
    ),
  )

  override def resetMocks(): Unit = {
    super.resetMocks()
    reset(service)
  }

  override def beforeEach(): Unit = {
    super.beforeEach()
    resetMocks()
  }

  private def stubCloneQuiz(existing: Quiz, canView: Boolean = true): Unit = {
    when(clock.now()).thenReturn(TestData.today)
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession])).thenReturn(Success(existing))
    when(quizRepository.canView(any[Quiz], any[CombinedUser])).thenReturn(canView)
    when(quizRepository.insert(any[String], any[Quiz])(using any[DBSession])).thenAnswer(invocation =>
      Success(invocation.nn.getArgument[Quiz](1).nn.copy(revision = Some(1)))
    )
  }

  private def quiz(status: QuizStatus): Quiz = TestData
    .publicQuiz(TestData.singleChoiceQuestion)
    .copy(
      title = Seq(Title("Original quiz", "nb")),
      status = status,
      published =
        if (status == QuizStatus.PUBLIC) Some(TestData.today)
        else None,
    )

  test("cloneQuiz clones a public quiz") {
    stubCloneQuiz(quiz(QuizStatus.PUBLIC))

    val result = service.cloneQuiz(TestData.quizId, owner(), "nb")

    result.isSuccess should be(true)
    result.get.title should be("Original quiz (Kopi)")
    result.get.status should be(QuizStatus.PRIVATE)
    result.get.published should be(None)
    result.get.revision should be(1)
  }

  test("cloneQuiz clones a private quiz when the caller is the owner") {
    stubCloneQuiz(quiz(QuizStatus.PRIVATE))

    val result = service.cloneQuiz(TestData.quizId, owner(), "nb")

    result.isSuccess should be(true)
    result.get.title should be("Original quiz (Kopi)")
    result.get.status should be(QuizStatus.PRIVATE)
    result.get.published should be(None)
    result.get.revision should be(1)
  }

  test("cloneQuiz returns Failure for a private quiz when the caller is not the owner") {
    stubCloneQuiz(quiz(QuizStatus.PRIVATE), canView = false)

    val result = service.cloneQuiz(TestData.quizId, notOwner, "nb")

    result.isFailure should be(true)
    result.failed.get.getMessage should be(s"You do not have access to quiz ${TestData.quizId}")
  }

  test("cloneQuiz returns Failure when the caller is a student") {
    stubCloneQuiz(quiz(QuizStatus.PUBLIC))

    val result = service.cloneQuiz(TestData.quizId, student, "nb")

    result.isFailure should be(true)
    result.failed.get.getMessage should be("Only teachers can create quizzes")
    verify(quizRepository, never).insert(any[String], any[Quiz])(using any[DBSession])
  }

  test("newQuiz creates a quiz when the caller is a teacher") {
    when(clock.now()).thenReturn(TestData.today)
    when(quizRepository.insert(any[String], any[Quiz])(using any[DBSession])).thenAnswer(invocation =>
      Success(invocation.nn.getArgument[Quiz](1).nn.copy(revision = Some(1)))
    )

    val result = service.newQuiz(NewQuizDTO("New quiz", None, None), owner(), "nb")

    result.isSuccess should be(true)
    result.get.title should be("New quiz")
  }

  test("newQuiz returns Failure when the caller is a student") {
    val result = service.newQuiz(NewQuizDTO("New quiz", None, None), student, "nb")

    result.isFailure should be(true)
    result.failed.get.getMessage should be("Only teachers can create quizzes")
    verify(quizRepository, never).insert(any[String], any[Quiz])(using any[DBSession])
  }

  private def stubSaveQuiz(existing: Quiz, canView: Boolean = true): Unit = {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession])).thenReturn(Success(existing))
    when(quizRepository.canView(any[Quiz], any[CombinedUser])).thenReturn(canView)
    when(quizRepository.saveQuiz(any, any[String])(using any[DBSession])).thenReturn(Success(()))
  }

  test("saveQuiz saves a public quiz owned by someone else") {
    stubSaveQuiz(quiz(QuizStatus.PUBLIC))

    val result = service.saveQuiz(TestData.quizId, notOwner)

    result.isSuccess should be(true)
    verify(quizRepository).saveQuiz(eqTo(TestData.quizId), eqTo("someone-else"))(using any[DBSession])
  }

  test("saveQuiz saves a quiz owned by the caller") {
    stubSaveQuiz(quiz(QuizStatus.PUBLIC))

    val result = service.saveQuiz(TestData.quizId, owner())

    result.isSuccess should be(true)
    verify(quizRepository).saveQuiz(eqTo(TestData.quizId), eqTo("owner-feide-id"))(using any[DBSession])
  }

  test("saveQuiz returns Failure for a private quiz the caller cannot view") {
    stubSaveQuiz(quiz(QuizStatus.PRIVATE), canView = false)

    val result = service.saveQuiz(TestData.quizId, notOwner)

    result.isFailure should be(true)
    result.failed.get.getMessage should be(s"Quiz with id ${TestData.quizId} was not found")
    verify(quizRepository, never).saveQuiz(any, any[String])(using any[DBSession])
  }

  private def questionWithId(id: UUID, n: Int) = Question(
    id = id,
    questionType = QuestionType.SINGLE_CHOICE,
    language = "nb",
    title = s"Spørsmål $n",
    alternatives = Seq.empty,
    glossaryPairs = Seq.empty,
    created = TestData.today,
    updated = TestData.today,
  )

  private def threeQuestions() = {
    val ids = Seq.fill(3)(UUID.randomUUID().nn)
    (
      ids,
      ids
        .zipWithIndex
        .map { case (id, i) =>
          questionWithId(id, i)
        },
    )
  }

  test("moveQuestion moves a question to the given position") {
    val (ids, questions) = threeQuestions()
    service.moveQuestion(questions, ids(2), 0).map(_.id) should be(Seq(ids(2), ids(0), ids(1)))
  }

  test("moveQuestion clamps out-of-range positions") {
    val (ids, questions) = threeQuestions()
    service.moveQuestion(questions, ids(0), 99).map(_.id) should be(Seq(ids(1), ids(2), ids(0)))
    service.moveQuestion(questions, ids(2), -5).map(_.id) should be(Seq(ids(2), ids(0), ids(1)))
  }
}

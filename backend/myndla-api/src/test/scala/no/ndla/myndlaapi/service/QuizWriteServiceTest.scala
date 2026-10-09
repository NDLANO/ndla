/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.service

import no.ndla.common.model.domain.Title
import no.ndla.myndlaapi.TestData
import no.ndla.myndlaapi.TestEnvironment
import no.ndla.myndlaapi.model.domain.{Quiz, QuizStatus}
import no.ndla.network.model.{CombinedUser, CombinedUserWithMyNDLAUser, FeideIdToken, FeideUserWrapper}
import no.ndla.scalatestsuite.UnitTestSuite
import org.mockito.ArgumentMatchers.{any, eq as eqTo}
import org.mockito.Mockito.{never, reset, spy, verify, when}
import org.mockito.invocation.InvocationOnMock
import scalikejdbc.DBSession

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
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession]())).thenReturn(Success(existing))
    when(quizRepository.canView(any[Quiz], any[CombinedUser]())).thenReturn(canView)
    when(quizRepository.insert(any[String], any[Quiz])(using any[DBSession]())).thenAnswer(
      (invocation: InvocationOnMock) => Success(invocation.getArgument[Quiz](1).copy(revision = Some(1)))
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

  private def stubSaveQuiz(existing: Quiz, canView: Boolean = true): Unit = {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession]())).thenReturn(Success(existing))
    when(quizRepository.canView(any[Quiz], any[CombinedUser]())).thenReturn(canView)
    when(quizRepository.saveQuiz(any, any[String])(using any[DBSession]())).thenReturn(Success(()))
  }

  test("saveQuiz saves a public quiz owned by someone else") {
    stubSaveQuiz(quiz(QuizStatus.PUBLIC))

    val result = service.saveQuiz(TestData.quizId, notOwner)

    result.isSuccess should be(true)
    verify(quizRepository).saveQuiz(eqTo(TestData.quizId), eqTo("someone-else"))(using any[DBSession]())
  }

  test("saveQuiz returns Failure when the caller owns the quiz") {
    stubSaveQuiz(quiz(QuizStatus.PUBLIC))

    val result = service.saveQuiz(TestData.quizId, owner())

    result.isFailure should be(true)
    verify(quizRepository, never()).saveQuiz(any, any[String])(using any[DBSession]())
  }

  test("saveQuiz returns Failure for a private quiz the caller cannot view") {
    stubSaveQuiz(quiz(QuizStatus.PRIVATE), canView = false)

    val result = service.saveQuiz(TestData.quizId, notOwner)

    result.isFailure should be(true)
    result.failed.get.getMessage should be(s"Quiz with id ${TestData.quizId} was not found")
    verify(quizRepository, never()).saveQuiz(any, any[String])(using any[DBSession]())
  }
}

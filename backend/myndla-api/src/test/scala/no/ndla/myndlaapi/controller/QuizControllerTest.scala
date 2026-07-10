/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.controller

import no.ndla.common.Clock
import no.ndla.myndlaapi.model.api.{NewQuizDTO, QuizDTO, QuizVerificationDTO, SubmittedAnswersDTO}
import no.ndla.myndlaapi.{TestData, TestEnvironment}
import no.ndla.network.model.{CombinedUser, FeideUserWrapper}
import no.ndla.network.tapir.{ErrorHelpers, Routes, TapirController}
import no.ndla.scalatestsuite.UnitTestSuite
import no.ndla.tapirtesting.{FeideAuthTestData, TapirControllerTest}
import org.mockito.ArgumentMatchers.{any, eq as eqTo}
import org.mockito.Mockito.{times, verify, when}
import sttp.client4.quick.*

import java.util.UUID
import scala.util.Success

class QuizControllerTest extends UnitTestSuite with TestEnvironment with TapirControllerTest {
  override implicit lazy val clock: Clock                           = mock[Clock]
  override implicit lazy val errorHelpers: ErrorHelpers             = new ErrorHelpers
  override implicit lazy val errorHandling: ControllerErrorHandling = new ControllerErrorHandling
  override implicit lazy val routes: Routes                         = new Routes
  val controller: QuizController                                    = new QuizController()
  override implicit lazy val services: List[TapirController]        = List(controller)

  val authHeader = s"Bearer ${FeideAuthTestData.FrankForeleser.idToken.originalToken}"

  val sampleQuiz: QuizDTO = QuizDTO(
    id = UUID.randomUUID(),
    name = "Quiz",
    description = None,
    status = "PRIVATE",
    layout = "SINGLE_PAGE",
    questions = List.empty,
    created = TestData.today,
    updated = TestData.today,
    shared = None,
  )

  override def beforeEach(): Unit = {
    resetMocks()
    when(clock.now()).thenReturn(TestData.today)
  }

  test("That creating a quiz requires a feide user and delegates to the write service") {
    when(quizWriteService.createQuiz(any[NewQuizDTO], any[FeideUserWrapper])).thenReturn(Success(sampleQuiz))
    val response = quickRequest
      .post(uri"http://localhost:$serverPort/myndla-api/v1/quiz")
      .contentType("application/json")
      .body("""{"name":"Quiz","layout":"SINGLE_PAGE","questions":[]}""")
      .header("FeideAuthorization", authHeader)
      .send()

    response.code.code should be(200)
    verify(quizWriteService, times(1)).createQuiz(any[NewQuizDTO], any[FeideUserWrapper])
  }

  test("That fetching a single quiz works without authentication (optional user)") {
    val quizId = UUID.randomUUID()
    when(quizReadService.getQuiz(eqTo(quizId), any[CombinedUser])).thenReturn(Success(sampleQuiz))
    val response = quickRequest.get(uri"http://localhost:$serverPort/myndla-api/v1/quiz/${quizId.toString}").send()

    response.code.code should be(200)
    verify(quizReadService, times(1)).getQuiz(eqTo(quizId), any[CombinedUser])
  }

  test("That verifying answers delegates to the read service") {
    val quizId = UUID.randomUUID()
    when(quizReadService.verifyAnswers(eqTo(quizId), any[SubmittedAnswersDTO], any[CombinedUser])).thenReturn(
      Success(QuizVerificationDTO(List.empty))
    )
    val response = quickRequest
      .post(uri"http://localhost:$serverPort/myndla-api/v1/quiz/${quizId.toString}/verify")
      .contentType("application/json")
      .body("""{"answers":[]}""")
      .send()

    response.code.code should be(200)
    verify(quizReadService, times(1)).verifyAnswers(eqTo(quizId), any[SubmittedAnswersDTO], any[CombinedUser])
  }

  test("That deleting a quiz returns no content") {
    val quizId = UUID.randomUUID()
    when(quizWriteService.deleteQuiz(eqTo(quizId), any[FeideUserWrapper])).thenReturn(Success(()))
    val response = quickRequest
      .delete(uri"http://localhost:$serverPort/myndla-api/v1/quiz/${quizId.toString}")
      .header("FeideAuthorization", authHeader)
      .send()

    response.code.code should be(204)
    verify(quizWriteService, times(1)).deleteQuiz(eqTo(quizId), any[FeideUserWrapper])
  }
}

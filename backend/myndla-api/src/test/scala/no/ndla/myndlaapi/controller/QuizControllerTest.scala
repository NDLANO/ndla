/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.controller

import no.ndla.common.Clock
import no.ndla.myndlaapi.{TestData, TestEnvironment}
import no.ndla.network.tapir.{ErrorHelpers, NdlaServer, TapirController}
import no.ndla.scalatestsuite.UnitTestSuite
import no.ndla.tapirtesting.{FeideAuthTestData, TapirControllerTest}
import no.ndla.testbase.NullSafeMockito.{any, never, verify, when}
import sttp.client4.quick.*

class QuizControllerTest extends UnitTestSuite with TestEnvironment with TapirControllerTest {
  override implicit lazy val clock: Clock                           = mock[Clock]
  override implicit lazy val errorHelpers: ErrorHelpers             = new ErrorHelpers
  override implicit lazy val errorHandling: ControllerErrorHandling = new ControllerErrorHandling
  override implicit lazy val ndlaServer: NdlaServer                 = new NdlaServer

  val controller: QuizController                             = new QuizController()
  override implicit lazy val services: List[TapirController] = List(controller)

  override def beforeEach(): Unit = {
    super.beforeEach()
    resetMocks()
    when(clock.now()).thenReturn(TestData.today)
  }

  val authHeader = s"Bearer ${FeideAuthTestData.FrankForeleser.idToken.originalToken}"

  test("That listing quizzes with a page below 1 or a negative page size gives 400") {
    val urls = Seq(
      uri"http://localhost:$serverPort/myndla-api/v1/quiz?page=0",
      uri"http://localhost:$serverPort/myndla-api/v1/quiz?pageSize=-1",
      uri"http://localhost:$serverPort/myndla-api/v1/quiz/saved?page=0",
      uri"http://localhost:$serverPort/myndla-api/v1/quiz/saved?pageSize=-1",
    )
    urls.foreach { url =>
      val response = quickRequest.get(url).header("FeideAuthorization", authHeader).send()
      withClue(url.toString)(response.code.code should be(400))
    }
    verify(quizReadService, never).search(any, any, any, any, any)
    verify(quizReadService, never).savedQuizzes(any, any, any, any, any)
  }
}

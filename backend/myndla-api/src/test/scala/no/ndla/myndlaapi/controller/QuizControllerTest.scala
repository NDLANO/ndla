/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.controller

import no.ndla.common.Clock
import no.ndla.myndlaapi.TestEnvironment
import no.ndla.network.tapir.{ErrorHelpers, Routes, TapirController}
import no.ndla.scalatestsuite.UnitTestSuite
import no.ndla.tapirtesting.TapirControllerTest

class QuizControllerTest extends UnitTestSuite with TestEnvironment with TapirControllerTest {
  override implicit lazy val clock: Clock = mock[Clock]
  override implicit lazy val errorHelpers: ErrorHelpers = new ErrorHelpers
  override implicit lazy val errorHandling: ControllerErrorHandling = new ControllerErrorHandling
  override implicit lazy val routes: Routes = new Routes

  val controller: QuizController = new QuizController()
  override implicit lazy val services: List[TapirController]        = List(controller)

  override def beforeEach(): Unit = {
    super.beforeEach()
    resetMocks()
  }

}

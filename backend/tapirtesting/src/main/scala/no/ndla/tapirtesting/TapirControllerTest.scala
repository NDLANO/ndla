/*
 * Part of NDLA tapirtesting
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.tapirtesting

import no.ndla.common.Clock
import no.ndla.common.configuration.BaseProps
import no.ndla.common.model.domain.myndla.{MyNDLAUser, UserRole}
import no.ndla.network.clients.MyNDLAProvider
import no.ndla.network.model.FeideUserWrapper
import no.ndla.network.tapir.auth.{CombinedAuth, FeideAuth, NdlaAuth}
import no.ndla.network.tapir.*
import no.ndla.scalatestsuite.UnitTestSuite
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.when
import sttp.tapir.server.netty.sync.NettySyncServerBinding

import java.util.concurrent.{CountDownLatch, TimeUnit}

trait TapirControllerTest extends UnitTestSuite {
  val serverPort: Int = findFreePort

  implicit lazy val props: BaseProps
  implicit lazy val clock: Clock                 = new Clock
  implicit lazy val errorHelpers: ErrorHelpers   = new ErrorHelpers
  implicit lazy val errorHandling: ErrorHandling = new ErrorHandling() {
    override def handleErrors: PartialFunction[Throwable, AllErrors] = { case t: Throwable =>
      fail("Error handler not implemented in test")
    }
  }

  implicit lazy val myNdlaProvider: MyNDLAProvider = {
    val providerMock = mock[MyNDLAProvider]
    when(providerMock.getFeideUserWrapperFromIdToken(any())).thenAnswer { i =>
      Right(
        FeideUserWrapper(
          MyNDLAUser(
            id = 0,
            feideId = "",
            favoriteSubjects = Seq.empty,
            userRole = UserRole.STUDENT,
            lastUpdated = clock.now(),
            organization = "",
            groups = Seq.empty,
            username = "",
            displayName = "",
            email = "",
            arenaEnabled = false,
            lastSeen = clock.now(),
          ),
          i.getArgument(0),
        )
      )
    }
    providerMock
  }
  implicit lazy val ndlaAuth: NdlaAuth         = NdlaAuthTest()
  implicit lazy val feideAuth: FeideAuth       = FeideAuthTest()
  implicit lazy val combinedAuth: CombinedAuth = CombinedAuth()

  val controller: TapirController

  implicit lazy val services: List[TapirController] = List(controller)
  implicit lazy val routes: Routes                  = new Routes

  var server: Option[NettySyncServerBinding] = None

  override def beforeAll(): Unit = {
    super.beforeAll()
    val serverStarted = new CountDownLatch(1)
    Thread
      .ofVirtual()
      .start(() => {
        routes.startServerAndWait(s"TapirControllerTest:${this.getClass.getName}", serverPort) { s =>
          server = Some(s)
          serverStarted.countDown()
        }
      })

    if (!serverStarted.await(30, TimeUnit.SECONDS)) fail("Server did not start within 30 seconds")
  }

  override def afterAll(): Unit = server.foreach(_.stop())
  test("That no endpoints are shadowed") {
    import sttp.tapir.testing.EndpointVerifier
    val errors = EndpointVerifier(controller.endpoints.map(_.endpoint))
    if (errors.nonEmpty) {
      val errString = errors.map(e => e.toString).mkString("\n\t- ", "\n\t- ", "")
      fail(s"Got errors when verifying ${controller.serviceName} controller:$errString")
    }
  }

}

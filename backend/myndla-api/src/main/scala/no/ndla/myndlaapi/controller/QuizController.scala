/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.controller

import no.ndla.myndlaapi.model.api.{NewQuizDTO, QuizDTO, QuizVerificationDTO, SubmittedAnswersDTO, UpdatedQuizDTO}
import no.ndla.myndlaapi.service.{QuizReadService, QuizWriteService}
import no.ndla.network.tapir.NoNullJsonPrinter.jsonBody
import no.ndla.network.tapir.TapirController
import no.ndla.network.tapir.TapirUtil.errorOutputsFor
import no.ndla.network.tapir.auth.{CombinedAuth, FeideAuth}
import sttp.tapir.*
import sttp.tapir.server.ServerEndpoint

import java.util.UUID

class QuizController(using
    quizReadService: QuizReadService,
    quizWriteService: QuizWriteService,
    errorHandling: ControllerErrorHandling,
    feideAuth: FeideAuth,
    combinedAuth: CombinedAuth,
) extends TapirController {
  override val serviceName: String         = "quiz"
  override val prefix: EndpointInput[Unit] = "myndla-api" / "v1" / serviceName

  private val pathQuizId = path[UUID]("quiz-id").description("The UUID of the quiz")

  private def createQuiz: ServerEndpoint[Any, Eff] = endpoint
    .post
    .summary("Create a new quiz")
    .description("Create a new quiz owned by the authenticated user")
    .in(jsonBody[NewQuizDTO])
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .out(jsonBody[QuizDTO])
    .withFeideUser
    .serverLogicPure { feide => newQuiz =>
      quizWriteService.createQuiz(newQuiz, feide)
    }

  private def listQuizzes: ServerEndpoint[Any, Eff] = endpoint
    .get
    .summary("Fetch the quizzes owned by the authenticated user")
    .description("Fetch the quizzes owned by the authenticated user")
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .out(jsonBody[List[QuizDTO]])
    .withFeideUser
    .serverLogicPure { feide => _ =>
      quizReadService.getMyQuizzes(feide)
    }

  private def getQuiz: ServerEndpoint[Any, Eff] = endpoint
    .get
    .summary("Fetch a single quiz")
    .description("Fetch a single quiz. Correct answers are only included for the owner or NDLA employees.")
    .in(pathQuizId)
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .out(jsonBody[QuizDTO])
    .withOptionalMyNDLAUserOrTokenUser
    .serverLogicPure { user => quizId =>
      quizReadService.getQuiz(quizId, user)
    }

  private def updateQuiz: ServerEndpoint[Any, Eff] = endpoint
    .put
    .summary("Update an existing quiz")
    .description("Update an existing quiz owned by the authenticated user")
    .in(pathQuizId)
    .in(jsonBody[UpdatedQuizDTO])
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .out(jsonBody[QuizDTO])
    .withFeideUser
    .serverLogicPure { feide =>
      { case (quizId, updatedQuiz) =>
        quizWriteService.updateQuiz(quizId, updatedQuiz, feide)
      }
    }

  private def deleteQuiz: ServerEndpoint[Any, Eff] = endpoint
    .delete
    .summary("Delete a quiz")
    .description("Delete a quiz owned by the authenticated user")
    .in(pathQuizId)
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .out(noContent)
    .withFeideUser
    .serverLogicPure { feide => quizId =>
      quizWriteService.deleteQuiz(quizId, feide)
    }

  private def verifyAnswers: ServerEndpoint[Any, Eff] = endpoint
    .post
    .summary("Verify submitted answers against a quiz")
    .description("Verify submitted answers against a quiz. Free text questions are not auto-scored.")
    .in(pathQuizId)
    .in("verify")
    .in(jsonBody[SubmittedAnswersDTO])
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .out(jsonBody[QuizVerificationDTO])
    .withOptionalMyNDLAUserOrTokenUser
    .serverLogicPure { user =>
      { case (quizId, submission) =>
        quizReadService.verifyAnswers(quizId, submission, user)
      }
    }

  override val endpoints: List[ServerEndpoint[Any, Eff]] =
    List(createQuiz, listQuizzes, getQuiz, updateQuiz, deleteQuiz, verifyAnswers)
}

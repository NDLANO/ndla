/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.controller

import no.ndla.common.model.api.LanguageCode
import no.ndla.language.Language
import no.ndla.myndlaapi.model.api.*
import no.ndla.myndlaapi.service.{QuizReadService, QuizWriteService}
import no.ndla.network.tapir.NoNullJsonPrinter.jsonBody
import no.ndla.network.tapir.TapirUtil.errorOutputsFor
import no.ndla.network.tapir.auth.{CombinedAuth, FeideAuth}
import no.ndla.network.tapir.TapirController
import sttp.model.StatusCode
import sttp.tapir.*
import sttp.tapir.generic.auto.*
import sttp.tapir.server.ServerEndpoint

import java.util.UUID

class QuizController(using
    quizReadService: QuizReadService,
    quizWriteService: QuizWriteService,
    feideAuth: FeideAuth,
    combinedAuth: CombinedAuth,
    errorHandling: ControllerErrorHandling,
) extends TapirController {

  override val enableSwagger: Boolean      = false
  override val serviceName: String         = "quiz"
  override val prefix: EndpointInput[Unit] = "myndla-api" / "v1" / serviceName

  private val language = query[LanguageCode]("language")
    .description("The ISO 639-1 language code for the response.")
    .default(LanguageCode(Language.AllLanguages))

  private val pathQuizId     = path[UUID]("quiz-id").description("The UUID of the quiz")
  private val pathQuestionId = path[String]("question-id").description("Id of the question")

  override val endpoints: List[ServerEndpoint[Any, Eff]] = List(
    listQuizzes,
    getQuiz,
    createQuiz,
    updateQuiz,
    updateQuizStatus,
    deleteQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    checkAnswer,
    checkQuiz,
  )

  private val pageSize = query[Int]("pageSize").description("Number of results per page").default(10)
  private val page     = query[Int]("page").description("Page number").default(1)

  private def listQuizzes: ServerEndpoint[Any, Eff] = endpoint
    .get
    .summary("List the quizzes owned by the authenticated user")
    .description("List the quizzes owned by the authenticated user")
    .in(language)
    .in(pageSize)
    .in(page)
    .out(jsonBody[QuizSearchResultDTO])
    .errorOut(errorOutputsFor(400, 401, 403))
    .withFeideUser
    .serverLogicPure { feide =>
      { case (lang, ps, p) =>
        quizReadService.search(feide, lang.code, ps, p).handleErrorsOrOk
      }
    }

  private def getQuiz: ServerEndpoint[Any, Eff] = endpoint
    .get
    .summary("Fetch a quiz by id")
    .description("Fetch a quiz. Correct answers are only included for the owner or NDLA employees.")
    .in(pathQuizId)
    .in(language)
    .out(jsonBody[QuizDTO])
    .errorOut(errorOutputsFor(404))
    .withOptionalMyNDLAUserOrTokenUser
    .serverLogicPure { user =>
      { case (id, lang) =>
        quizReadService.withId(id, lang.code, user).handleErrorsOrOk
      }
    }

  private def createQuiz: ServerEndpoint[Any, Eff] = endpoint
    .post
    .summary("Create a new quiz")
    .description("Create a new quiz owned by the authenticated user")
    .in(language)
    .in(jsonBody[NewQuizDTO])
    .out(jsonBody[QuizDTO])
    .out(statusCode(StatusCode.Created))
    .errorOut(errorOutputsFor(400, 401, 403))
    .withFeideUser
    .serverLogicPure { feide =>
      { case (lang, dto) =>
        quizWriteService.newQuiz(dto, feide, lang.code).handleErrorsOrOk
      }
    }

  private def updateQuiz: ServerEndpoint[Any, Eff] = endpoint
    .put
    .summary("Update an existing quiz")
    .description("Update an existing quiz owned by the authenticated user")
    .in(pathQuizId)
    .in(language)
    .in(jsonBody[UpdatedQuizDTO])
    .out(jsonBody[QuizDTO])
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .withFeideUser
    .serverLogicPure { feide =>
      { case (id, lang, dto) =>
        quizWriteService.updateQuiz(id, dto, feide, lang.code).handleErrorsOrOk
      }
    }

  private def updateQuizStatus: ServerEndpoint[Any, Eff] = endpoint
    .put
    .summary("Update quiz status")
    .description("Toggle a quiz owned by the authenticated user between PRIVATE and PUBLIC")
    .in(pathQuizId / "status")
    .in(language)
    .in(jsonBody[UpdatedQuizStatusDTO])
    .out(jsonBody[QuizDTO])
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .withFeideUser
    .serverLogicPure { feide =>
      { case (id, lang, dto) =>
        quizWriteService.updateStatus(id, dto.status, feide, lang.code).handleErrorsOrOk
      }
    }

  private def deleteQuiz: ServerEndpoint[Any, Eff] = endpoint
    .delete
    .summary("Delete a quiz")
    .description("Delete a quiz owned by the authenticated user")
    .in(pathQuizId)
    .out(statusCode(StatusCode.NoContent))
    .errorOut(errorOutputsFor(401, 403, 404))
    .withFeideUser
    .serverLogicPure { feide => id =>
      quizWriteService.deleteQuiz(id, feide).handleErrorsOrOk
    }

  private def addQuestion: ServerEndpoint[Any, Eff] = endpoint
    .post
    .summary("Add a question to a quiz")
    .description("Add a question to a quiz owned by the authenticated user")
    .in(pathQuizId / "questions")
    .in(language)
    .in(jsonBody[NewQuestionDTO])
    .out(jsonBody[QuizDTO])
    .out(statusCode(StatusCode.Created))
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .withFeideUser
    .serverLogicPure { feide =>
      { case (quizId, lang, dto) =>
        quizWriteService.newQuestion(quizId, dto, feide, lang.code).handleErrorsOrOk
      }
    }

  private def updateQuestion: ServerEndpoint[Any, Eff] = endpoint
    .put
    .summary("Update a question")
    .description("Update a question in a quiz owned by the authenticated user")
    .in(pathQuizId / "questions" / pathQuestionId)
    .in(language)
    .in(jsonBody[UpdatedQuestionDTO])
    .out(jsonBody[QuizDTO])
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .withFeideUser
    .serverLogicPure { feide =>
      { case (quizId, questionId, lang, dto) =>
        quizWriteService.updateQuestion(quizId, questionId, dto, feide, lang.code).handleErrorsOrOk
      }
    }

  private def deleteQuestion: ServerEndpoint[Any, Eff] = endpoint
    .delete
    .summary("Delete a question from a quiz")
    .description("Delete a question from a quiz owned by the authenticated user")
    .in(pathQuizId / "questions" / pathQuestionId)
    .in(language)
    .out(jsonBody[QuizDTO])
    .errorOut(errorOutputsFor(401, 403, 404))
    .withFeideUser
    .serverLogicPure { feide =>
      { case (quizId, questionId, lang) =>
        quizWriteService.deleteQuestion(quizId, questionId, feide, lang.code).handleErrorsOrOk
      }
    }

  private def checkAnswer: ServerEndpoint[Any, Eff] = endpoint
    .post
    .summary("Check a single question answer")
    .description(
      "Evaluates a single answer against the correct solution. Works on public quizzes, or private quizzes belonging to the caller."
    )
    .in(pathQuizId / "check-answer")
    .in(jsonBody[QuestionAnswerDTO])
    .out(jsonBody[QuestionResultDTO])
    .errorOut(errorOutputsFor(400, 404))
    .withOptionalMyNDLAUserOrTokenUser
    .serverLogicPure { user =>
      { case (quizId, dto) =>
        quizReadService.checkAnswer(quizId, dto, user).handleErrorsOrOk
      }
    }

  private def checkQuiz: ServerEndpoint[Any, Eff] = endpoint
    .post
    .summary("Check all answers for a quiz")
    .description(
      "Evaluates a full set of answers. Works on public quizzes, or private quizzes belonging to the caller."
    )
    .in(pathQuizId / "check-quiz")
    .in(jsonBody[CheckQuizDTO])
    .out(jsonBody[QuizResultDTO])
    .errorOut(errorOutputsFor(400, 404))
    .withOptionalMyNDLAUserOrTokenUser
    .serverLogicPure { user =>
      { case (quizId, dto) =>
        quizReadService.checkQuiz(quizId, dto, user).handleErrorsOrOk
      }
    }
}

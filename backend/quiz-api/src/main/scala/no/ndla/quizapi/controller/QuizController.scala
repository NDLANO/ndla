/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi.controller

import no.ndla.common.auth.Permission.{QUIZ_API_ADMIN, QUIZ_API_PUBLISH, QUIZ_API_WRITE}
import no.ndla.common.model.api.LanguageCode
import no.ndla.language.Language
import no.ndla.network.tapir.NoNullJsonPrinter.jsonBody
import no.ndla.network.tapir.TapirUtil.errorOutputsFor
import no.ndla.network.tapir.auth.NdlaAuth
import no.ndla.network.tapir.{ErrorHandling, ErrorHelpers, TapirController}
import no.ndla.quizapi.model.api.*
import no.ndla.quizapi.model.domain.QuizStatus
import no.ndla.quizapi.service.{ReadService, WriteService}
import sttp.model.StatusCode
import sttp.tapir.*
import sttp.tapir.generic.auto.*
import sttp.tapir.server.ServerEndpoint

class QuizController(using
    readService: ReadService,
    writeService: WriteService,
    ndlaAuth: NdlaAuth,
    errorHandling: ErrorHandling,
    errorHelpers: ErrorHelpers,
) extends TapirController {

  override val serviceName: String         = "quizzes"
  override val prefix: EndpointInput[Unit] = "quiz-api" / "v1" / serviceName

  private val language = query[LanguageCode]("language")
    .description("The ISO 639-1 language code for the response.")
    .default(LanguageCode(Language.AllLanguages))

  private val pathQuizId     = path[Long]("quiz_id").description("Id of the quiz")
  private val pathQuestionId = path[String]("question_id").description("Id of the question")

  override val endpoints: List[ServerEndpoint[Any, Eff]] = List(
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

  private def getQuiz: ServerEndpoint[Any, Eff] = endpoint
    .get
    .summary("Fetch a quiz by id")
    .in(pathQuizId)
    .in(language)
    .out(jsonBody[QuizDTO])
    .errorOut(errorOutputsFor(401, 403, 404))
    .withOptionalUser
    .serverLogicPure { user => (id, lang) =>
      val isStaff = user.exists(_.hasPermission(QUIZ_API_WRITE))
      readService.withId(id, lang.code, isStaff).handleErrorsOrOk
    }

  private def createQuiz: ServerEndpoint[Any, Eff] = endpoint
    .post
    .summary("Create a new quiz")
    .in(language)
    .in(jsonBody[NewQuizDTO])
    .out(jsonBody[QuizDTO])
    .out(statusCode(StatusCode.Created))
    .errorOut(errorOutputsFor(400, 401, 403))
    .requirePermission(QUIZ_API_WRITE)
    .serverLogicPure { user => (lang, dto) =>
      writeService.newQuiz(dto, user, lang.code).handleErrorsOrOk
    }

  private def updateQuiz: ServerEndpoint[Any, Eff] = endpoint
    .put
    .summary("Update an existing quiz")
    .in(pathQuizId)
    .in(language)
    .in(jsonBody[UpdateQuizDTO])
    .out(jsonBody[QuizDTO])
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .requirePermission(QUIZ_API_WRITE)
    .serverLogicPure { user => (id, lang, dto) =>
      writeService.updateQuiz(id, dto, user, lang.code).handleErrorsOrOk
    }

  private def updateQuizStatus: ServerEndpoint[Any, Eff] = endpoint
    .put
    .summary("Update quiz status")
    .in(pathQuizId / "status")
    .in(language)
    .in(jsonBody[UpdateStatusDTO])
    .out(jsonBody[QuizDTO])
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .requirePermission(QUIZ_API_PUBLISH)
    .serverLogicPure { user => (id, lang, dto) =>
      writeService.updateStatus(id, dto.status, user, lang.code).handleErrorsOrOk
    }

  private def deleteQuiz: ServerEndpoint[Any, Eff] = endpoint
    .delete
    .summary("Delete a quiz")
    .in(pathQuizId)
    .out(statusCode(StatusCode.NoContent))
    .errorOut(errorOutputsFor(401, 403, 404))
    .requirePermission(QUIZ_API_ADMIN)
    .serverLogicPure { _ => id =>
      writeService.deleteQuiz(id).handleErrorsOrOk
    }

  private def addQuestion: ServerEndpoint[Any, Eff] = endpoint
    .post
    .summary("Add a question to a quiz")
    .in(pathQuizId / "questions")
    .in(language)
    .in(jsonBody[NewQuestionDTO])
    .out(jsonBody[QuizDTO])
    .out(statusCode(StatusCode.Created))
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .requirePermission(QUIZ_API_WRITE)
    .serverLogicPure { user => (quizId, lang, dto) =>
      writeService.newQuestion(quizId, dto, user, lang.code).handleErrorsOrOk
    }

  private def updateQuestion: ServerEndpoint[Any, Eff] = endpoint
    .put
    .summary("Update a question")
    .in(pathQuizId / "questions" / pathQuestionId)
    .in(language)
    .in(jsonBody[UpdateQuestionDTO])
    .out(jsonBody[QuizDTO])
    .errorOut(errorOutputsFor(400, 401, 403, 404))
    .requirePermission(QUIZ_API_WRITE)
    .serverLogicPure { user => (quizId, questionId, lang, dto) =>
      writeService.updateQuestion(quizId, questionId, dto, user, lang.code).handleErrorsOrOk
    }

  private def deleteQuestion: ServerEndpoint[Any, Eff] = endpoint
    .delete
    .summary("Delete a question from a quiz")
    .in(pathQuizId / "questions" / pathQuestionId)
    .in(language)
    .out(jsonBody[QuizDTO])
    .errorOut(errorOutputsFor(401, 403, 404))
    .requirePermission(QUIZ_API_WRITE)
    .serverLogicPure { user => (quizId, questionId, lang) =>
      writeService.deleteQuestion(quizId, questionId, user, lang.code).handleErrorsOrOk
    }

  private def checkAnswer: ServerEndpoint[Any, Eff] = endpoint
    .post
    .summary("Check a single question answer")
    .description("Evaluates a single answer against the correct solution. Only works on published quizzes.")
    .in(pathQuizId / "check-answer")
    .in(jsonBody[QuestionAnswerDTO])
    .out(jsonBody[QuestionResultDTO])
    .errorOut(errorOutputsFor(400, 404))
    .serverLogicPure { (quizId, dto) =>
      writeService.checkAnswer(quizId, dto).handleErrorsOrOk
    }

  private def checkQuiz: ServerEndpoint[Any, Eff] = endpoint
    .post
    .summary("Check all answers for a quiz")
    .description("Evaluates a full set of answers. Only works on published quizzes.")
    .in(pathQuizId / "check-quiz")
    .in(jsonBody[CheckQuizDTO])
    .out(jsonBody[QuizResultDTO])
    .errorOut(errorOutputsFor(400, 404))
    .serverLogicPure { (quizId, dto) =>
      writeService.checkQuiz(quizId, dto).handleErrorsOrOk
    }
}

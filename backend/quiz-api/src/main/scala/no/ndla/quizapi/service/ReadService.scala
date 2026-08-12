/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi.service

import no.ndla.database.DBUtility
import no.ndla.quizapi.model.api.QuizDTO
import no.ndla.quizapi.model.domain.QuizStatus
import no.ndla.quizapi.repository.QuizRepository

import scala.util.{Failure, Success, Try}

class ReadService(using
    quizRepository: QuizRepository,
    converterService: ConverterService,
    dbUtil: DBUtility,
) {

  def withId(id: Long, language: String, isStaff: Boolean): Try[QuizDTO] =
    dbUtil.readOnly { implicit session =>
      for {
        quiz <- quizRepository.withIdOrError(id)
        _ <- if (!isStaff && quiz.status != QuizStatus.PUBLISHED)
          Failure(no.ndla.common.errors.NotFoundException(s"Quiz with id $id was not found"))
        else Success(())
      } yield converterService.toApiQuiz(quiz, language, isStaff)
    }
}

/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.service

import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.errors.{AccessDeniedException, NotFoundException}
import no.ndla.common.implicits.toTry
import no.ndla.database.DBUtility
import no.ndla.myndlaapi.model.api.{NewQuizDTO, QuizDTO, UpdatedQuizDTO}
import no.ndla.myndlaapi.model.domain.Quiz
import no.ndla.myndlaapi.repository.QuizRepository
import no.ndla.myndlaapi.validation.QuizValidator
import no.ndla.network.model.FeideUserWrapper

import java.util.UUID
import scala.util.{Failure, Success, Try}

class QuizWriteService(using
    quizRepository: QuizRepository,
    quizConverterService: QuizConverterService,
    quizValidator: QuizValidator,
    dbUtility: DBUtility,
) extends StrictLogging {

  def createQuiz(newQuiz: NewQuizDTO, feide: FeideUserWrapper): Try[QuizDTO] = dbUtility.rollbackOnFailure {
    implicit session =>
      for {
        _        <- quizValidator.validate(newQuiz)
        quiz     <- quizConverterService.toDomainQuiz(newQuiz, feide.user.feideId)
        inserted <- quizRepository.insert(quiz)
      } yield quizConverterService.toApiQuiz(inserted, includeAnswers = true)
  }

  def updateQuiz(id: UUID, updatedQuiz: UpdatedQuizDTO, feide: FeideUserWrapper): Try[QuizDTO] = dbUtility
    .rollbackOnFailure { implicit session =>
      for {
        existing <- quizRepository.withId(id).flatMap(_.toTry(NotFoundException(s"Quiz with id $id was not found")))
        _        <- ownerOrAccessDenied(existing, feide)
        _        <- quizValidator.validateUpdate(updatedQuiz)
        merged   <- quizConverterService.mergeQuiz(existing, updatedQuiz)
        updated  <- quizRepository.update(merged)
      } yield quizConverterService.toApiQuiz(updated, includeAnswers = true)
    }

  def deleteQuiz(id: UUID, feide: FeideUserWrapper): Try[Unit] = dbUtility.rollbackOnFailure { implicit session =>
    for {
      existing <- quizRepository.withId(id).flatMap(_.toTry(NotFoundException(s"Quiz with id $id was not found")))
      _        <- ownerOrAccessDenied(existing, feide)
      _        <- quizRepository.deleteById(id)
    } yield ()
  }

  private def ownerOrAccessDenied(quiz: Quiz, feide: FeideUserWrapper): Try[Unit] =
    if (quiz.isOwner(feide.user.feideId)) Success(())
    else Failure(AccessDeniedException("You do not have access to this quiz"))
}

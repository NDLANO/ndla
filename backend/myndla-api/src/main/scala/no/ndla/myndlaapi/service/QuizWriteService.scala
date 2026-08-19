/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.service

import no.ndla.common.Clock
import no.ndla.database.DBUtility
import no.ndla.myndlaapi.model.api.*
import no.ndla.myndlaapi.model.domain.*
import no.ndla.myndlaapi.repository.QuizRepository
import no.ndla.network.model.FeideUserWrapper

import java.util.UUID
import scala.util.{Failure, Success, Try}

class QuizWriteService(using
    quizRepository: QuizRepository,
    quizConverterService: QuizConverterService,
    clock: Clock,
    dbUtil: DBUtility,
) {

  private def requireOwner(quiz: Quiz, feide: FeideUserWrapper): Try[Quiz] =
    if (quiz.isOwner(feide.user.feideId)) Success(quiz)
    else Failure(QuizErrors.notOwner(quiz.id))

  def newQuiz(dto: NewQuizDTO, feide: FeideUserWrapper, language: String): Try[QuizDTO] =
    dbUtil.writeSession { implicit session =>
      val now  = clock.now()
      val quiz = quizConverterService.toDomainQuiz(dto, feide.user.feideId, feide.user.feideId, now, language)
      quizRepository.insert(feide.user.feideId, quiz).map(quizConverterService.toApiQuiz(_, language, isOwner = true))
    }

  def updateQuiz(id: UUID, dto: UpdatedQuizDTO, feide: FeideUserWrapper, language: String): Try[QuizDTO] = dbUtil
    .rollbackOnFailure { implicit session =>
      for {
        existing <- quizRepository.withIdOrError(id)
        _        <- requireOwner(existing, feide)
        merged    = quizConverterService.mergeQuiz(existing, dto, feide.user.feideId, clock.now(), language)
        updated  <- quizRepository.update(merged)
      } yield quizConverterService.toApiQuiz(updated, language, isOwner = true)
    }

  def updateStatus(id: UUID, newStatus: QuizStatus, feide: FeideUserWrapper, language: String): Try[QuizDTO] = dbUtil
    .rollbackOnFailure { implicit session =>
      for {
        existing <- quizRepository.withIdOrError(id)
        _        <- requireOwner(existing, feide)
        now       = clock.now()
        updated  <- quizRepository.update(
          existing.copy(
            status = newStatus,
            published =
              if (newStatus == QuizStatus.PUBLIC) Some(now)
              else existing.published,
            updated = now,
            updatedBy = feide.user.feideId,
          )
        )
      } yield quizConverterService.toApiQuiz(updated, language, isOwner = true)
    }

  def deleteQuiz(id: UUID, feide: FeideUserWrapper): Try[Unit] = dbUtil.rollbackOnFailure { implicit session =>
    for {
      existing <- quizRepository.withIdOrError(id)
      _        <- requireOwner(existing, feide)
      _        <- quizRepository.delete(id)
    } yield ()
  }

  def newQuestion(quizId: UUID, dto: NewQuestionDTO, feide: FeideUserWrapper, language: String): Try[QuizDTO] = dbUtil
    .rollbackOnFailure { implicit session =>
      val now      = clock.now()
      val question = quizConverterService.toDomainQuestion(dto, now, language)
      for {
        existing <- quizRepository.withIdOrError(quizId)
        _        <- requireOwner(existing, feide)
        updated  <- quizRepository.update(
          existing.copy(questions = existing.questions :+ question, updated = now, updatedBy = feide.user.feideId)
        )
      } yield quizConverterService.toApiQuiz(updated, language, isOwner = true)
    }

  def updateQuestion(
      quizId: UUID,
      questionId: String,
      dto: UpdatedQuestionDTO,
      feide: FeideUserWrapper,
      language: String,
  ): Try[QuizDTO] = dbUtil.rollbackOnFailure { implicit session =>
    val now = clock.now()
    for {
      existing <- quizRepository.withIdOrError(quizId)
      _        <- requireOwner(existing, feide)
      oldQ     <- existing.questions.find(_.id == questionId) match {
        case Some(q) => Success(q)
        case None    => Failure(QuizErrors.questionNotFound(questionId, quizId))
      }
      newQ     = quizConverterService.mergeQuestion(oldQ, dto, now)
      updated <- quizRepository.update(
        existing.copy(
          questions = existing
            .questions
            .map(q =>
              if (q.id == questionId) newQ
              else q
            ),
          updated = now,
          updatedBy = feide.user.feideId,
        )
      )
    } yield quizConverterService.toApiQuiz(updated, language, isOwner = true)
  }

  def deleteQuestion(quizId: UUID, questionId: String, feide: FeideUserWrapper, language: String): Try[QuizDTO] = dbUtil
    .rollbackOnFailure { implicit session =>
      for {
        existing <- quizRepository.withIdOrError(quizId)
        _        <- requireOwner(existing, feide)
        _        <-
          if (existing.questions.exists(_.id == questionId)) Success(())
          else Failure(QuizErrors.questionNotFound(questionId, quizId))
        updated <- quizRepository.update(
          existing.copy(
            questions = existing.questions.filterNot(_.id == questionId),
            updated = clock.now(),
            updatedBy = feide.user.feideId,
          )
        )
      } yield quizConverterService.toApiQuiz(updated, language, isOwner = true)
    }
}

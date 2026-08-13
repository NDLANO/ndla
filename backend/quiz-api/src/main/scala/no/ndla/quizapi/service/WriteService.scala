/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi.service

import no.ndla.common.Clock
import no.ndla.database.DBUtility
import no.ndla.network.tapir.auth.TokenUser
import no.ndla.quizapi.model.api.*
import no.ndla.quizapi.model.domain.*
import no.ndla.quizapi.repository.QuizRepository

import scala.util.{Failure, Success, Try}

class WriteService(using
    quizRepository: QuizRepository,
    converterService: ConverterService,
    clock: Clock,
    dbUtil: DBUtility,
) {

  def newQuiz(dto: NewQuizDTO, user: TokenUser, language: String): Try[QuizDTO] =
    dbUtil.writeSession { implicit session =>
      val now  = clock.now()
      val quiz = converterService.toDomainQuiz(dto, user.id, now, language)
      quizRepository.insert(quiz).map(converterService.toApiQuiz(_, language, isStaff = true))
    }

  def updateQuiz(id: Long, dto: UpdateQuizDTO, user: TokenUser, language: String): Try[QuizDTO] =
    dbUtil.rollbackOnFailure { implicit session =>
      for {
        existing <- quizRepository.withIdOrError(id)
        merged    = converterService.mergeQuiz(existing, dto, user.id, clock.now(), language)
        updated  <- quizRepository.update(merged)
      } yield converterService.toApiQuiz(updated, language, isStaff = true)
    }

  def updateStatus(id: Long, newStatus: QuizStatus, user: TokenUser, language: String): Try[QuizDTO] =
    dbUtil.rollbackOnFailure { implicit session =>
      for {
        existing <- quizRepository.withIdOrError(id)
        now       = clock.now()
        updated  <- quizRepository.update(
          existing.copy(
            status = newStatus,
            published = if (newStatus == QuizStatus.PUBLISHED) Some(now) else existing.published,
            updated = now,
            updatedBy = user.id,
          )
        )
      } yield converterService.toApiQuiz(updated, language, isStaff = true)
    }

  def deleteQuiz(id: Long): Try[Unit] =
    dbUtil.writeSession { implicit session =>
      quizRepository.delete(id).map(_ => ())
    }

  def newQuestion(quizId: Long, dto: NewQuestionDTO, user: TokenUser, language: String): Try[QuizDTO] =
    dbUtil.rollbackOnFailure { implicit session =>
      val now      = clock.now()
      val question = converterService.toDomainQuestion(dto, now)
      for {
        existing <- quizRepository.withIdOrError(quizId)
        updated  <- quizRepository.update(
          existing.copy(
            questions = existing.questions :+ question,
            updated = now,
            updatedBy = user.id,
          )
        )
      } yield converterService.toApiQuiz(updated, language, isStaff = true)
    }

  def updateQuestion(
      quizId: Long,
      questionId: String,
      dto: UpdateQuestionDTO,
      user: TokenUser,
      language: String,
  ): Try[QuizDTO] =
    dbUtil.rollbackOnFailure { implicit session =>
      val now = clock.now()
      for {
        existing <- quizRepository.withIdOrError(quizId)
        oldQ     <- existing.questions.find(_.id == questionId) match {
          case Some(q) => Success(q)
          case None    => Failure(NDLAErrors.questionNotFound(questionId, quizId))
        }
        newQ      = converterService.mergeQuestion(oldQ, dto, now)
        updated  <- quizRepository.update(
          existing.copy(
            questions = existing.questions.map(q => if (q.id == questionId) newQ else q),
            updated = now,
            updatedBy = user.id,
          )
        )
      } yield converterService.toApiQuiz(updated, language, isStaff = true)
    }

  def deleteQuestion(quizId: Long, questionId: String, user: TokenUser, language: String): Try[QuizDTO] =
    dbUtil.rollbackOnFailure { implicit session =>
      for {
        existing <- quizRepository.withIdOrError(quizId)
        _        <- if (existing.questions.exists(_.id == questionId)) Success(())
          else Failure(NDLAErrors.questionNotFound(questionId, quizId))
        updated <- quizRepository.update(
          existing.copy(
            questions = existing.questions.filterNot(_.id == questionId),
            updated = clock.now(),
            updatedBy = user.id,
          )
        )
      } yield converterService.toApiQuiz(updated, language, isStaff = true)
    }

  def checkAnswer(quizId: Long, answer: QuestionAnswerDTO): Try[QuestionResultDTO] =
    dbUtil.readOnly { implicit session =>
      for {
        quiz <- quizRepository.withIdOrError(quizId)
        _ <- if (quiz.status != QuizStatus.PUBLISHED)
          Failure(no.ndla.common.errors.NotFoundException(s"Quiz with id $quizId was not found"))
        else Success(())
        question <- quiz.questions.find(_.id == answer.questionId) match {
          case Some(q) => Success(q)
          case None    => Failure(NDLAErrors.questionNotFound(answer.questionId, quizId))
        }
      } yield evaluateAnswer(question, answer)
    }

  def checkQuiz(quizId: Long, dto: CheckQuizDTO): Try[QuizResultDTO] =
    dbUtil.readOnly { implicit session =>
      for {
        quiz <- quizRepository.withIdOrError(quizId)
        _ <- if (quiz.status != QuizStatus.PUBLISHED)
          Failure(no.ndla.common.errors.NotFoundException(s"Quiz with id $quizId was not found"))
        else Success(())
        results = dto.answers.map { answer =>
          quiz.questions.find(_.id == answer.questionId) match {
            case Some(q) => evaluateAnswer(q, answer)
            case None    => QuestionResultDTO(answer.questionId, isCorrect = false, 0, 0, Seq.empty, Seq.empty)
          }
        }
      } yield QuizResultDTO(
        totalScore = results.map(_.score).sum,
        maxScore = results.map(_.maxScore).sum,
        results = results,
      )
    }

  private def evaluateAnswer(question: Question, answer: QuestionAnswerDTO): QuestionResultDTO = {
    question.questionType match {
      case QuestionType.SINGLE_CHOICE =>
        val correctIds = question.alternatives.filter(_.isCorrect).map(_.id)
        val isCorrect  = answer.selectedAlternativeIds.toSet == correctIds.toSet
        QuestionResultDTO(
          questionId = question.id,
          isCorrect = isCorrect,
          score = if (isCorrect) 1 else 0,
          maxScore = 1,
          correctAlternativeIds = correctIds,
          correctPairs = Seq.empty,
        )

      case QuestionType.MULTI_CHOICE =>
        val correctIds = question.alternatives.filter(_.isCorrect).map(_.id).toSet
        val selected   = answer.selectedAlternativeIds.toSet
        val isCorrect  = selected == correctIds
        QuestionResultDTO(
          questionId = question.id,
          isCorrect = isCorrect,
          score = if (isCorrect) 1 else 0,
          maxScore = 1,
          correctAlternativeIds = correctIds.toSeq,
          correctPairs = Seq.empty,
        )

      case QuestionType.MATCHING =>
        val correct = question.glossaryPairs.map(p => p.word -> p.definition).toMap
        val provided  = answer.matchedPairs.map(p => p.word -> p.definition).toMap
        val isCorrect = provided == correct
        QuestionResultDTO(
          questionId = question.id,
          isCorrect = isCorrect,
          score = if (isCorrect) 1 else 0,
          maxScore = 1,
          correctAlternativeIds = Seq.empty,
          correctPairs = question.glossaryPairs.map(p => GlossaryPairDTO(p.word, p.definition)),
        )
    }
  }
}

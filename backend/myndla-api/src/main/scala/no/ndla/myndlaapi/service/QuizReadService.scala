/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.service

import cats.implicits.*
import no.ndla.database.DBUtility
import no.ndla.myndlaapi.model.api.{
  CheckQuizDTO,
  QuestionAnswerDTO,
  QuestionResultDTO,
  QuizDTO,
  QuizResultDTO,
  QuizSearchResultDTO,
}
import no.ndla.myndlaapi.model.domain.{Question, QuestionType, Quiz, QuizErrors}
import no.ndla.myndlaapi.repository.{QuizRepository, UserRepository}
import no.ndla.network.model.{CombinedUser, CombinedUserRequired}

import scalikejdbc.DBSession

import java.util.UUID
import scala.util.{Failure, Success, Try}

class QuizReadService(using
    quizRepository: QuizRepository,
    userRepository: UserRepository,
    quizConverterService: QuizConverterService,
    dbUtil: DBUtility,
) {

  private def toApiQuiz(quiz: Quiz, language: String, isOwner: Boolean)(implicit session: DBSession): Try[QuizDTO] =
    userRepository
      .userWithFeideId(quiz.ownerId)
      .map(owner => quizConverterService.toApiQuiz(quiz, language, isOwner, owner))

  def withId(id: UUID, language: String, user: CombinedUser): Try[QuizDTO] = dbUtil.readOnly { implicit session =>
    quizRepository
      .withIdOrError(id)
      .flatMap {
        case quiz if quizRepository.canView(quiz, user) =>
          toApiQuiz(quiz, language, isOwner = quizRepository.canSeeAnswers(quiz, user))
        case _ => Failure(QuizErrors.quizNotFound(id))
      }
  }

  def search(user: CombinedUserRequired, language: String, pageSize: Int, page: Int): Try[QuizSearchResultDTO] = dbUtil
    .readOnly { implicit session =>
      val ownerId = user.id
      val total   = quizRepository.countByOwner(ownerId)
      for {
        quizzes <- quizRepository.getByOwner(ownerId, pageSize, page)
        dtos    <- quizzes.toList.traverse(toApiQuiz(_, language, isOwner = true))
      } yield QuizSearchResultDTO(totalCount = total, page = page, pageSize = pageSize, results = dtos)
    }

  def savedQuizzes(user: CombinedUserRequired, language: String): Try[Seq[QuizDTO]] = dbUtil.readOnly {
    implicit session =>
      for {
        quizzes <- quizRepository.getSavedByUser(user.id)
        dtos    <- quizzes
          .filter(quiz => quizRepository.canView(quiz, user))
          .toList
          .traverse(quiz => toApiQuiz(quiz, language, isOwner = quizRepository.canSeeAnswers(quiz, user)))
      } yield dtos
  }

  def checkAnswer(quizId: UUID, answer: QuestionAnswerDTO, user: CombinedUser): Try[QuestionResultDTO] = dbUtil
    .readOnly { implicit session =>
      for {
        quiz <- quizRepository.withIdOrError(quizId)
        _    <- Try(quizRepository.canView(quiz, user))
          .filter(identity)
          .recoverWith { case _ =>
            Failure(QuizErrors.quizNotFound(quizId))
          }
        question <- quiz.questions.find(_.id == answer.questionId) match {
          case Some(q) => Success(q)
          case None    => Failure(QuizErrors.questionNotFound(answer.questionId, quizId))
        }
      } yield evaluateAnswer(question, answer)
    }

  def checkQuiz(quizId: UUID, dto: CheckQuizDTO, user: CombinedUser): Try[QuizResultDTO] = dbUtil.readOnly {
    implicit session =>
      for {
        quiz <- quizRepository.withIdOrError(quizId)
        _    <- Try(quizRepository.canView(quiz, user))
          .filter(identity)
          .recoverWith { case _ =>
            Failure(QuizErrors.quizNotFound(quizId))
          }
        results = dto
          .answers
          .map { answer =>
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
    import no.ndla.myndlaapi.model.api.GlossaryPairDTO

    question.questionType match {
      case QuestionType.SINGLE_CHOICE =>
        val correctIds = question.alternatives.filter(_.isCorrect).map(_.id)
        val isCorrect  = answer.selectedAlternativeIds.toSet == correctIds.toSet
        QuestionResultDTO(
          questionId = question.id,
          isCorrect = isCorrect,
          score =
            if (isCorrect) 1
            else 0,
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
          score =
            if (isCorrect) 1
            else 0,
          maxScore = 1,
          correctAlternativeIds = correctIds.toSeq,
          correctPairs = Seq.empty,
        )

      case QuestionType.MATCHING =>
        val correct   = question.glossaryPairs.map(p => p.word -> p.definition).toMap
        val provided  = answer.matchedPairs.map(p => p.word -> p.definition).toMap
        val isCorrect = provided == correct
        QuestionResultDTO(
          questionId = question.id,
          isCorrect = isCorrect,
          score =
            if (isCorrect) 1
            else 0,
          maxScore = 1,
          correctAlternativeIds = Seq.empty,
          correctPairs = question.glossaryPairs.map(p => GlossaryPairDTO(p.word, p.definition)),
        )
    }
  }
}

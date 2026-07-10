/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.service

import no.ndla.common.errors.NotFoundException
import no.ndla.database.DBUtility
import no.ndla.myndlaapi.model.api.{QuizDTO, QuizVerificationDTO, SubmittedAnswersDTO}
import no.ndla.myndlaapi.model.domain.Quiz
import no.ndla.myndlaapi.repository.QuizRepository
import no.ndla.network.model.{CombinedUser, FeideID, FeideUserWrapper}

import java.util.UUID
import scala.util.{Failure, Success, Try}

class QuizReadService(using
    quizRepository: QuizRepository,
    quizConverterService: QuizConverterService,
    dbUtility: DBUtility,
) {

  def getQuiz(id: UUID, user: CombinedUser): Try[QuizDTO] = dbUtility.readOnly { implicit session =>
    quizRepository
      .withId(id)
      .flatMap {
        case Some(quiz) if canView(quiz, user) =>
          Success(quizConverterService.toApiQuiz(quiz, includeAnswers = canSeeAnswers(quiz, user)))
        case _ => Failure(NotFoundException(s"Quiz with id $id was not found"))
      }
  }

  def getMyQuizzes(feide: FeideUserWrapper): Try[List[QuizDTO]] = dbUtility.readOnly { implicit session =>
    quizRepository
      .listByOwner(feide.user.feideId)
      .map(_.map(quiz => quizConverterService.toApiQuiz(quiz, includeAnswers = true)))
  }

  def verifyAnswers(id: UUID, submission: SubmittedAnswersDTO, user: CombinedUser): Try[QuizVerificationDTO] = dbUtility
    .readOnly { implicit session =>
      quizRepository
        .withId(id)
        .flatMap {
          case Some(quiz) if canView(quiz, user) => Success(quizConverterService.verify(quiz, submission))
          case _                                 => Failure(NotFoundException(s"Quiz with id $id was not found"))
        }
    }

  private def ownerFeideId(user: CombinedUser): Option[FeideID]      = user.myndlaUser.map(_.user.feideId)
  private def isOwner(quiz: Quiz, user: CombinedUser): Boolean       = ownerFeideId(user).exists(quiz.isOwner)
  private def canView(quiz: Quiz, user: CombinedUser): Boolean       = quiz.isPublic || isOwner(quiz, user)
  private def canSeeAnswers(quiz: Quiz, user: CombinedUser): Boolean = isOwner(quiz, user) || user.isEmployee
}

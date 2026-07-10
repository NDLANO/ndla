/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.service

import no.ndla.common.Clock
import no.ndla.common.model.NDLADate
import no.ndla.myndlaapi.model.api.{
  AnswerResult,
  ChoiceDTO,
  MultipleChoiceQuestionDTO,
  NewFreeTextQuestionDTO,
  NewMultipleChoiceQuestionDTO,
  NewQuestionDTO,
  NewQuizDTO,
  NewSingleChoiceQuestionDTO,
  QuestionDTO,
  QuestionResultDTO,
  QuizDTO,
  QuizVerificationDTO,
  SingleChoiceQuestionDTO,
  SubmittedAnswersDTO,
  FreeTextQuestionDTO,
  UpdatedQuizDTO,
}
import no.ndla.myndlaapi.model.domain.{
  Choice,
  FreeTextQuestion,
  MultipleChoiceQuestion,
  Question,
  Quiz,
  QuizLayout,
  QuizStatus,
  SingleChoiceQuestion,
}
import no.ndla.network.model.FeideID

import java.util.UUID
import scala.util.{Success, Try}

class QuizConverterService(using clock: Clock) {

  def toDomainQuiz(newQuiz: NewQuizDTO, ownerId: FeideID): Try[Quiz] = {
    val now = clock.now()
    for {
      status <- newQuiz.status.map(QuizStatus.valueOfOrError).getOrElse(Success(QuizStatus.PRIVATE))
      layout <- QuizLayout.valueOfOrError(newQuiz.layout)
    } yield Quiz(
      id = UUID.randomUUID(),
      ownerId = ownerId,
      name = newQuiz.name,
      description = newQuiz.description,
      status = status,
      layout = layout,
      questions = newQuiz.questions.map(q => toDomainQuestion(q, now)),
      created = now,
      updated = now,
      shared =
        if (status == QuizStatus.PUBLIC) Some(now)
        else None,
    )
  }

  def mergeQuiz(existing: Quiz, updated: UpdatedQuizDTO): Try[Quiz] = {
    val now = clock.now()
    for {
      status <- updated.status.map(QuizStatus.valueOfOrError).getOrElse(Success(existing.status))
      layout <- updated.layout.map(QuizLayout.valueOfOrError).getOrElse(Success(existing.layout))
    } yield {
      val questions = updated.questions.map(_.map(q => toDomainQuestion(q, now))).getOrElse(existing.questions)
      val shared    = (existing.status, status) match {
        case (QuizStatus.PRIVATE, QuizStatus.PUBLIC) => Some(now)
        case (QuizStatus.PUBLIC, QuizStatus.PUBLIC)  => existing.shared
        case _                                       => None
      }
      existing.copy(
        name = updated.name.getOrElse(existing.name),
        description = updated.description.orElse(existing.description),
        status = status,
        layout = layout,
        questions = questions,
        updated = now,
        shared = shared,
      )
    }
  }

  private def toDomainQuestion(newQuestion: NewQuestionDTO, now: NDLADate): Question = {
    val id = UUID.randomUUID()
    newQuestion match {
      case q: NewSingleChoiceQuestionDTO =>
        SingleChoiceQuestion(id, now, now, q.prompt, q.options.map(toDomainChoice), q.correctOptionId)
      case q: NewMultipleChoiceQuestionDTO =>
        MultipleChoiceQuestion(id, now, now, q.prompt, q.options.map(toDomainChoice), q.correctOptionIds)
      case q: NewFreeTextQuestionDTO => FreeTextQuestion(id, now, now, q.prompt)
    }
  }

  private def toDomainChoice(choice: ChoiceDTO): Choice = Choice(choice.id, choice.text)

  def toApiQuiz(quiz: Quiz, includeAnswers: Boolean): QuizDTO = QuizDTO(
    id = quiz.id,
    name = quiz.name,
    description = quiz.description,
    status = quiz.status.entryName,
    layout = quiz.layout.entryName,
    questions = quiz.questions.map(q => toApiQuestion(q, includeAnswers)),
    created = quiz.created,
    updated = quiz.updated,
    shared = quiz.shared,
  )

  private def toApiQuestion(question: Question, includeAnswers: Boolean): QuestionDTO = question match {
    case q: SingleChoiceQuestion => SingleChoiceQuestionDTO(
        id = q.id,
        created = q.created,
        updated = q.updated,
        prompt = q.prompt,
        options = q.options.map(toApiChoice),
        correctOptionId = Option.when(includeAnswers)(q.correctOptionId),
      )
    case q: MultipleChoiceQuestion => MultipleChoiceQuestionDTO(
        id = q.id,
        created = q.created,
        updated = q.updated,
        prompt = q.prompt,
        options = q.options.map(toApiChoice),
        correctOptionIds = Option.when(includeAnswers)(q.correctOptionIds),
      )
    case q: FreeTextQuestion =>
      FreeTextQuestionDTO(id = q.id, created = q.created, updated = q.updated, prompt = q.prompt)
  }

  private def toApiChoice(choice: Choice): ChoiceDTO = ChoiceDTO(choice.id, choice.text)

  def verify(quiz: Quiz, submission: SubmittedAnswersDTO): QuizVerificationDTO = {
    val answersByQuestionId = submission.answers.map(answer => answer.questionId -> answer).toMap
    val results             = quiz
      .questions
      .map { question =>
        val selectedIds = answersByQuestionId.get(question.id).map(_.selectedOptionIds.toSet).getOrElse(Set.empty)
        val result      = question match {
          case _: FreeTextQuestion     => AnswerResult.UNSCORED
          case q: SingleChoiceQuestion =>
            if (selectedIds == Set(q.correctOptionId)) AnswerResult.CORRECT
            else AnswerResult.INCORRECT
          case q: MultipleChoiceQuestion =>
            if (selectedIds == q.correctOptionIds) AnswerResult.CORRECT
            else AnswerResult.INCORRECT
        }
        QuestionResultDTO(question.id, result)
      }
    QuizVerificationDTO(results)
  }
}

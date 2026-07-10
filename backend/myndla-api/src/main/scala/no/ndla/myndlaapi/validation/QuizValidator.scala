/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.validation

import no.ndla.common.errors.{ValidationException, ValidationMessage}
import no.ndla.myndlaapi.model.api.{
  ChoiceDTO,
  NewFreeTextQuestionDTO,
  NewMultipleChoiceQuestionDTO,
  NewQuestionDTO,
  NewQuizDTO,
  NewSingleChoiceQuestionDTO,
  UpdatedQuizDTO,
}

import java.util.UUID
import scala.util.{Failure, Success, Try}

class QuizValidator {

  def validate(quiz: NewQuizDTO): Try[Unit] = {
    val errors = validateName(quiz.name) ++
      quiz
        .questions
        .zipWithIndex
        .flatMap { case (question, index) =>
          validateQuestion(question, index)
        }

    if (errors.isEmpty) Success(())
    else Failure(ValidationException("Validation error while creating quiz", errors))
  }

  def validateUpdate(updated: UpdatedQuizDTO): Try[Unit] = {
    val errors = updated.name.map(validateName).getOrElse(Seq.empty) ++
      updated
        .questions
        .getOrElse(List.empty)
        .zipWithIndex
        .flatMap { case (question, index) =>
          validateQuestion(question, index)
        }

    if (errors.isEmpty) Success(())
    else Failure(ValidationException("Validation error while updating quiz", errors))
  }

  private def validateName(name: String): Seq[ValidationMessage] =
    if (name.trim.isEmpty) Seq(ValidationMessage("name", "Quiz name can not be empty"))
    else Seq.empty

  private def validateQuestion(question: NewQuestionDTO, index: Int): Seq[ValidationMessage] = {
    val field       = s"questions[$index]"
    val promptError =
      if (question.prompt.trim.isEmpty) Seq(ValidationMessage(s"$field.prompt", "Question prompt can not be empty"))
      else Seq.empty

    val typeErrors = question match {
      case q: NewSingleChoiceQuestionDTO => validateOptions(q.options, field) ++
          validateCorrectIds(Set(q.correctOptionId), q.options, field)
      case q: NewMultipleChoiceQuestionDTO =>
        val emptyCorrect =
          if (q.correctOptionIds.isEmpty)
            Seq(ValidationMessage(s"$field.correctOptionIds", "At least one correct choice must be provided"))
          else Seq.empty
        validateOptions(q.options, field) ++ emptyCorrect ++ validateCorrectIds(q.correctOptionIds, q.options, field)
      case _: NewFreeTextQuestionDTO => Seq.empty
    }

    promptError ++ typeErrors
  }

  private def validateOptions(options: List[ChoiceDTO], field: String): Seq[ValidationMessage] = {
    val emptyError =
      if (options.isEmpty) Seq(ValidationMessage(s"$field.options", "A choice question must have at least one choice"))
      else Seq.empty
    val duplicateIdError =
      if (options.map(_.id).distinct.size != options.size)
        Seq(ValidationMessage(s"$field.options", "Choice ids must be unique"))
      else Seq.empty
    emptyError ++ duplicateIdError
  }

  private def validateCorrectIds(
      correctIds: Set[UUID],
      options: List[ChoiceDTO],
      field: String,
  ): Seq[ValidationMessage] = {
    val optionIds = options.map(_.id).toSet
    if (correctIds.subsetOf(optionIds)) Seq.empty
    else Seq(ValidationMessage(s"$field.correctOptionId", "Correct choice must reference an existing choice id"))
  }
}

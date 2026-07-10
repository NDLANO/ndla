/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.validation

import no.ndla.myndlaapi.model.api.{
  ChoiceDTO,
  NewFreeTextQuestionDTO,
  NewMultipleChoiceQuestionDTO,
  NewQuestionDTO,
  NewQuizDTO,
  NewSingleChoiceQuestionDTO,
}
import no.ndla.myndlaapi.TestEnvironment
import no.ndla.scalatestsuite.UnitTestSuite

import java.util.UUID

class QuizValidatorTest extends UnitTestSuite with TestEnvironment {
  val validator = new QuizValidator

  private val choiceA = ChoiceDTO(UUID.randomUUID(), "A")
  private val choiceB = ChoiceDTO(UUID.randomUUID(), "B")

  private def quizWith(question: NewQuestionDTO): NewQuizDTO =
    NewQuizDTO(name = "Quiz", description = None, status = None, layout = "SINGLE_PAGE", questions = List(question))

  test("A valid single choice quiz passes validation") {
    val quiz = quizWith(NewSingleChoiceQuestionDTO("prompt", List(choiceA, choiceB), correctOptionId = choiceA.id))
    validator.validate(quiz) should be(Symbol("success"))
  }

  test("Empty name fails validation") {
    val quiz = quizWith(NewFreeTextQuestionDTO("prompt")).copy(name = "  ")
    validator.validate(quiz) should be(Symbol("failure"))
  }

  test("A correct option that does not reference an existing choice fails validation") {
    val quiz =
      quizWith(NewSingleChoiceQuestionDTO("prompt", List(choiceA, choiceB), correctOptionId = UUID.randomUUID()))
    validator.validate(quiz) should be(Symbol("failure"))
  }

  test("A choice question without options fails validation") {
    val quiz = quizWith(NewMultipleChoiceQuestionDTO("prompt", List.empty, correctOptionIds = Set.empty))
    validator.validate(quiz) should be(Symbol("failure"))
  }

  test("A multiple choice question with a correct id outside the options fails validation") {
    val quiz = quizWith(
      NewMultipleChoiceQuestionDTO("prompt", List(choiceA, choiceB), correctOptionIds = Set(UUID.randomUUID()))
    )
    validator.validate(quiz) should be(Symbol("failure"))
  }

  test("A free text question is always valid") {
    val quiz = quizWith(NewFreeTextQuestionDTO("prompt"))
    validator.validate(quiz) should be(Symbol("success"))
  }
}

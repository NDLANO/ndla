/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.service

import no.ndla.common.model.NDLADate
import no.ndla.myndlaapi.TestEnvironment
import no.ndla.myndlaapi.model.api.{
  AnswerResult,
  MultipleChoiceQuestionDTO,
  NewQuizDTO,
  SingleChoiceQuestionDTO,
  SubmittedAnswerDTO,
  SubmittedAnswersDTO,
  UpdatedQuizDTO,
}
import no.ndla.myndlaapi.model.domain.{
  Choice,
  FreeTextQuestion,
  MultipleChoiceQuestion,
  Quiz,
  QuizLayout,
  QuizStatus,
  SingleChoiceQuestion,
}
import no.ndla.scalatestsuite.UnitTestSuite
import org.mockito.Mockito.when

import java.util.UUID

class QuizConverterServiceTest extends UnitTestSuite with TestEnvironment {
  val service = new QuizConverterService

  val now: NDLADate = NDLADate.now()

  private val optA = Choice(UUID.randomUUID(), "A")
  private val optB = Choice(UUID.randomUUID(), "B")
  private val optC = Choice(UUID.randomUUID(), "C")

  private val singleQ =
    SingleChoiceQuestion(UUID.randomUUID(), now, now, "single?", List(optA, optB), correctOptionId = optA.id)
  private val multiQ = MultipleChoiceQuestion(
    UUID.randomUUID(),
    now,
    now,
    "multi?",
    List(optA, optB, optC),
    correctOptionIds = Set(optA.id, optB.id),
  )
  private val freeQ = FreeTextQuestion(UUID.randomUUID(), now, now, "free?")

  private val quiz = Quiz(
    id = UUID.randomUUID(),
    ownerId = "owner",
    name = "Quiz",
    description = None,
    status = QuizStatus.PRIVATE,
    layout = QuizLayout.SINGLE_PAGE,
    questions = List(singleQ, multiQ, freeQ),
    created = now,
    updated = now,
    shared = None,
  )

  override def beforeEach(): Unit = {
    resetMocks()
    when(clock.now()).thenReturn(now)
  }

  test("toApiQuiz hides correct answers when includeAnswers is false") {
    val api    = service.toApiQuiz(quiz, includeAnswers = false)
    val single = api
      .questions
      .collectFirst { case q: SingleChoiceQuestionDTO =>
        q
      }
      .get
    val multi = api
      .questions
      .collectFirst { case q: MultipleChoiceQuestionDTO =>
        q
      }
      .get
    single.correctOptionId should be(None)
    multi.correctOptionIds should be(None)
  }

  test("toApiQuiz includes correct answers when includeAnswers is true") {
    val api    = service.toApiQuiz(quiz, includeAnswers = true)
    val single = api
      .questions
      .collectFirst { case q: SingleChoiceQuestionDTO =>
        q
      }
      .get
    val multi = api
      .questions
      .collectFirst { case q: MultipleChoiceQuestionDTO =>
        q
      }
      .get
    single.correctOptionId should be(Some(optA.id))
    multi.correctOptionIds should be(Some(Set(optA.id, optB.id)))
  }

  test("verify scores single, multiple and free text answers correctly") {
    val submission = SubmittedAnswersDTO(
      List(
        SubmittedAnswerDTO(singleQ.id, List(optA.id), None),
        SubmittedAnswerDTO(multiQ.id, List(optB.id, optA.id), None),
        SubmittedAnswerDTO(freeQ.id, List.empty, Some("whatever")),
      )
    )
    val result = service.verify(quiz, submission)
    result.results.find(_.questionId == singleQ.id).get.result should be(AnswerResult.CORRECT)
    result.results.find(_.questionId == multiQ.id).get.result should be(AnswerResult.CORRECT)
    result.results.find(_.questionId == freeQ.id).get.result should be(AnswerResult.UNSCORED)
  }

  test("verify marks wrong or missing choice answers as incorrect") {
    val submission = SubmittedAnswersDTO(
      List(SubmittedAnswerDTO(singleQ.id, List(optB.id), None), SubmittedAnswerDTO(multiQ.id, List(optA.id), None))
    )
    val result = service.verify(quiz, submission)
    result.results.find(_.questionId == singleQ.id).get.result should be(AnswerResult.INCORRECT)
    result.results.find(_.questionId == multiQ.id).get.result should be(AnswerResult.INCORRECT)
  }

  test("mergeQuiz sets shared date when transitioning from private to public") {
    val updated = UpdatedQuizDTO(
      name = Some("New name"),
      description = None,
      status = Some("PUBLIC"),
      layout = None,
      questions = None,
    )
    val merged = service.mergeQuiz(quiz, updated)
    merged should be(Symbol("success"))
    merged.get.name should be("New name")
    merged.get.status should be(QuizStatus.PUBLIC)
    merged.get.shared should be(Some(now))
    merged.get.updated should be(now)
  }

  test("toDomainQuiz defaults to private status and no shared date") {
    val newQuiz = NewQuizDTO(
      name = "New quiz",
      description = Some("desc"),
      status = None,
      layout = "MULTI_PAGE",
      questions = List.empty,
    )
    val result = service.toDomainQuiz(newQuiz, "owner")
    result should be(Symbol("success"))
    result.get.status should be(QuizStatus.PRIVATE)
    result.get.layout should be(QuizLayout.MULTI_PAGE)
    result.get.shared should be(None)
    result.get.ownerId should be("owner")
  }
}

/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi.service

import no.ndla.common.Clock
import no.ndla.common.auth.Permission
import no.ndla.common.configuration.BaseProps
import no.ndla.common.model.NDLADate
import no.ndla.database.{DBUtility, ReadableDbSession}
import no.ndla.database.implicits.dbSessionToUnspecifiedSession
import no.ndla.quizapi.model.api.*
import no.ndla.quizapi.model.domain.*
import no.ndla.quizapi.repository.QuizRepository
import no.ndla.scalatestsuite.UnitTestSuite
import org.mockito.ArgumentMatchers.{any, eq as eqTo}
import org.mockito.Mockito
import org.mockito.Mockito.when
import scalikejdbc.DBSession

import scala.util.{Failure, Success}

class WriteServiceTest extends UnitTestSuite {
  given props: BaseProps = new BaseProps {
    override def ApplicationName: String          = "quiz-api-test"
    override def ApplicationPort: Int             = 80
    override val ndlaAuth0Scopes: Seq[Permission] = Seq.empty
  }

  val mockRepo: QuizRepository     = mock[QuizRepository]
  val mockDbUtil: DBUtility        = mock[DBUtility]
  val converterService             = new ConverterService
  val clock: Clock                 = mock[Clock]
  val now: NDLADate                = NDLADate.fromUnixTime(0)

  given quizRepository: QuizRepository = mockRepo
  given dbUtil: DBUtility              = mockDbUtil
  given converterSvc: ConverterService = converterService
  given clockInst: Clock               = clock

  val service = new WriteService

  override def beforeEach(): Unit = {
    Mockito.reset(mockDbUtil, mockRepo)
    // Stub dbUtil.readOnly to execute the lambda directly without a real DB session
    when(mockDbUtil.readOnly(any[Function1[ReadableDbSession, Any]]())).thenAnswer { inv =>
      val fn = inv.getArgument[Function1[ReadableDbSession, Any]](0)
      fn(null.asInstanceOf[ReadableDbSession])
    }
  }

  // ---- Helper fixtures ----

  private val singleChoiceQuestion = Question(
    id = "q1",
    questionType = QuestionType.SINGLE_CHOICE,
    title = "Hva er korrekt?",
    alternatives = Seq(
      Alternative("a1", "Feil alternativ", isCorrect = false),
      Alternative("a2", "Riktig alternativ", isCorrect = true),
    ),
    glossaryPairs = Seq.empty,
    created = now,
    updated = now,
  )

  private val multiChoiceQuestion = Question(
    id = "q2",
    questionType = QuestionType.MULTI_CHOICE,
    title = "Velg alle riktige",
    alternatives = Seq(
      Alternative("b1", "Riktig 1", isCorrect = true),
      Alternative("b2", "Feil",     isCorrect = false),
      Alternative("b3", "Riktig 2", isCorrect = true),
    ),
    glossaryPairs = Seq.empty,
    created = now,
    updated = now,
  )

  private val matchingQuestion = Question(
    id = "q3",
    questionType = QuestionType.MATCHING,
    title = "Match glosene",
    alternatives = Seq.empty,
    glossaryPairs = Seq(
      GlossaryPair("cat", "katt"),
      GlossaryPair("dog", "hund"),
    ),
    created = now,
    updated = now,
  )

  private def publishedQuiz(questions: Question*) = Quiz(
    id = Some(99L),
    revision = Some(1),
    title = Seq.empty,
    description = Seq.empty,
    questions = questions,
    status = QuizStatus.PUBLISHED,
    created = now,
    updated = now,
    updatedBy = "editor",
    published = Some(now),
    displaySettings = DisplaySettings.default,
  )

  private def draftQuiz = publishedQuiz(singleChoiceQuestion).copy(status = QuizStatus.DRAFT)

  test("checkAnswer returns correct result for correct SINGLE_CHOICE answer") {
    when(mockRepo.withIdOrError(eqTo(99L))(using any[DBSession]()))
      .thenReturn(Success(publishedQuiz(singleChoiceQuestion)))

    val answer = QuestionAnswerDTO("q1", selectedAlternativeIds = Seq("a2"), matchedPairs = Seq.empty)
    val result = service.checkAnswer(99L, answer)

    result.isSuccess should be(true)
    result.get.isCorrect should be(true)
    result.get.score should be(1)
    result.get.correctAlternativeIds should contain("a2")
  }

  test("checkAnswer returns incorrect result for wrong SINGLE_CHOICE answer") {
    when(mockRepo.withIdOrError(eqTo(99L))(using any[DBSession]()))
      .thenReturn(Success(publishedQuiz(singleChoiceQuestion)))

    val answer = QuestionAnswerDTO("q1", selectedAlternativeIds = Seq("a1"), matchedPairs = Seq.empty)
    val result = service.checkAnswer(99L, answer)

    result.isSuccess should be(true)
    result.get.isCorrect should be(false)
    result.get.score should be(0)
  }

  test("checkAnswer returns Failure for unpublished quiz") {
    when(mockRepo.withIdOrError(eqTo(99L))(using any[DBSession]()))
      .thenReturn(Success(draftQuiz))

    val answer = QuestionAnswerDTO("q1", selectedAlternativeIds = Seq("a2"), matchedPairs = Seq.empty)
    service.checkAnswer(99L, answer).isFailure should be(true)
  }

  test("checkAnswer returns Failure for unknown question id") {
    when(mockRepo.withIdOrError(eqTo(99L))(using any[DBSession]()))
      .thenReturn(Success(publishedQuiz(singleChoiceQuestion)))

    val answer = QuestionAnswerDTO("q-ukjent", selectedAlternativeIds = Seq("a2"), matchedPairs = Seq.empty)
    service.checkAnswer(99L, answer).isFailure should be(true)
  }

  test("checkAnswer requires exactly the correct set for MULTI_CHOICE") {
    when(mockRepo.withIdOrError(eqTo(99L))(using any[DBSession]()))
      .thenReturn(Success(publishedQuiz(multiChoiceQuestion)))

    val correct  = QuestionAnswerDTO("q2", Seq("b1", "b3"), Seq.empty)
    val partial  = QuestionAnswerDTO("q2", Seq("b1"), Seq.empty)
    val tooMany  = QuestionAnswerDTO("q2", Seq("b1", "b2", "b3"), Seq.empty)

    service.checkAnswer(99L, correct).get.isCorrect should be(true)
    service.checkAnswer(99L, partial).get.isCorrect should be(false)
    service.checkAnswer(99L, tooMany).get.isCorrect should be(false)
  }

  test("checkAnswer evaluates MATCHING correctly") {
    when(mockRepo.withIdOrError(eqTo(99L))(using any[DBSession]()))
      .thenReturn(Success(publishedQuiz(matchingQuestion)))

    val correctAnswer = QuestionAnswerDTO(
      "q3",
      Seq.empty,
      Seq(GlossaryPairDTO("cat", "katt"), GlossaryPairDTO("dog", "hund")),
    )
    val wrongAnswer = QuestionAnswerDTO(
      "q3",
      Seq.empty,
      Seq(GlossaryPairDTO("cat", "hund"), GlossaryPairDTO("dog", "katt")),
    )

    service.checkAnswer(99L, correctAnswer).get.isCorrect should be(true)
    service.checkAnswer(99L, wrongAnswer).get.isCorrect should be(false)
  }

  test("checkQuiz aggregates scores across all questions") {
    when(mockRepo.withIdOrError(eqTo(99L))(using any[DBSession]()))
      .thenReturn(Success(publishedQuiz(singleChoiceQuestion, multiChoiceQuestion)))

    val dto = CheckQuizDTO(
      answers = Seq(
        QuestionAnswerDTO("q1", Seq("a2"), Seq.empty),  // riktig
        QuestionAnswerDTO("q2", Seq("b1"), Seq.empty),  // feil (mangler b3)
      )
    )

    val result = service.checkQuiz(99L, dto)
    result.isSuccess should be(true)
    result.get.totalScore should be(1)
    result.get.maxScore should be(2)
    result.get.results should have size 2
    result.get.results.find(_.questionId == "q1").get.isCorrect should be(true)
    result.get.results.find(_.questionId == "q2").get.isCorrect should be(false)
  }

  test("checkQuiz returns score 0 for unknown question id instead of crashing") {
    when(mockRepo.withIdOrError(eqTo(99L))(using any[DBSession]()))
      .thenReturn(Success(publishedQuiz(singleChoiceQuestion)))

    val dto    = CheckQuizDTO(answers = Seq(QuestionAnswerDTO("ukjent", Seq("a2"), Seq.empty)))
    val result = service.checkQuiz(99L, dto)
    result.isSuccess should be(true)
    result.get.totalScore should be(0)
    result.get.results.head.isCorrect should be(false)
  }
}

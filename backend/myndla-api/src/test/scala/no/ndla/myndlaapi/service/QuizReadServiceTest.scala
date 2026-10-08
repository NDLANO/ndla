/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.service

import no.ndla.myndlaapi.model.api.*
import no.ndla.myndlaapi.model.domain.*
import no.ndla.myndlaapi.{TestData, TestEnvironment}
import no.ndla.network.model.OptionalCombinedUser
import no.ndla.scalatestsuite.UnitTestSuite
import org.mockito.ArgumentMatchers.{any, eq as eqTo}
import org.mockito.Mockito.when
import scalikejdbc.DBSession

import scala.util.Success

class QuizReadServiceTest extends UnitTestSuite with TestEnvironment {
  val service = new QuizReadService

  private val anonymous = OptionalCombinedUser(tokenUser = None, myndlaUser = None)

  override def beforeEach(): Unit = {
    super.beforeEach()
    super.resetMocks()
  }

  test("checkAnswer returns correct result for correct SINGLE_CHOICE answer") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession]())).thenReturn(
      Success(TestData.publicQuiz(TestData.singleChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser]())).thenCallRealMethod()

    val answer = QuestionAnswerDTO("q1", selectedAlternativeIds = Seq("a2"), matchedPairs = Seq.empty)
    val result = service.checkAnswer(TestData.quizId, answer, anonymous)

    result.isSuccess should be(true)
    result.get.isCorrect should be(true)
    result.get.score should be(1)
    result.get.correctAlternativeIds should contain("a2")
  }

  test("checkAnswer returns incorrect result for wrong SINGLE_CHOICE answer") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession]())).thenReturn(
      Success(TestData.publicQuiz(TestData.singleChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser]())).thenCallRealMethod()

    val answer = QuestionAnswerDTO("q1", selectedAlternativeIds = Seq("a1"), matchedPairs = Seq.empty)
    val result = service.checkAnswer(TestData.quizId, answer, anonymous)

    result.isSuccess should be(true)
    result.get.isCorrect should be(false)
    result.get.score should be(0)
  }

  test("checkAnswer returns Failure for a private quiz when the caller is not the owner") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession]())).thenReturn(
      Success(TestData.privateQuiz)
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser]())).thenCallRealMethod()

    val answer = QuestionAnswerDTO("q1", selectedAlternativeIds = Seq("a2"), matchedPairs = Seq.empty)
    service.checkAnswer(TestData.quizId, answer, anonymous).isFailure should be(true)
  }

  test("checkAnswer returns Failure for unknown question id") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession]())).thenReturn(
      Success(TestData.publicQuiz(TestData.singleChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser]())).thenCallRealMethod()

    val answer = QuestionAnswerDTO("q-ukjent", selectedAlternativeIds = Seq("a2"), matchedPairs = Seq.empty)
    service.checkAnswer(TestData.quizId, answer, anonymous).isFailure should be(true)
  }

  test("checkAnswer requires exactly the correct set for MULTI_CHOICE") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession]())).thenReturn(
      Success(TestData.publicQuiz(TestData.multiChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser]())).thenCallRealMethod()

    val correct = QuestionAnswerDTO("q2", Seq("b1", "b3"), Seq.empty)
    val partial = QuestionAnswerDTO("q2", Seq("b1"), Seq.empty)
    val tooMany = QuestionAnswerDTO("q2", Seq("b1", "b2", "b3"), Seq.empty)

    service.checkAnswer(TestData.quizId, correct, anonymous).get.isCorrect should be(true)
    service.checkAnswer(TestData.quizId, partial, anonymous).get.isCorrect should be(false)
    service.checkAnswer(TestData.quizId, tooMany, anonymous).get.isCorrect should be(false)
  }

  test("checkAnswer evaluates MATCHING correctly") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession]())).thenReturn(
      Success(TestData.publicQuiz(TestData.matchingQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser]())).thenCallRealMethod()

    val correctAnswer =
      QuestionAnswerDTO("q3", Seq.empty, Seq(GlossaryPairDTO("cat", "katt"), GlossaryPairDTO("dog", "hund")))
    val wrongAnswer =
      QuestionAnswerDTO("q3", Seq.empty, Seq(GlossaryPairDTO("cat", "hund"), GlossaryPairDTO("dog", "katt")))

    service.checkAnswer(TestData.quizId, correctAnswer, anonymous).get.isCorrect should be(true)
    service.checkAnswer(TestData.quizId, wrongAnswer, anonymous).get.isCorrect should be(false)
  }

  test("checkQuiz aggregates scores across all questions") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession]())).thenReturn(
      Success(TestData.publicQuiz(TestData.singleChoiceQuestion, TestData.multiChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser]())).thenCallRealMethod()

    val dto = CheckQuizDTO(answers =
      Seq(
        QuestionAnswerDTO("q1", Seq("a2"), Seq.empty), // riktig
        QuestionAnswerDTO("q2", Seq("b1"), Seq.empty), // feil (mangler b3)
      )
    )

    val result = service.checkQuiz(TestData.quizId, dto, anonymous)
    result.isSuccess should be(true)
    result.get.totalScore should be(1)
    result.get.maxScore should be(2)
    result.get.results should have size 2
    result.get.results.find(_.questionId == "q1").get.isCorrect should be(true)
    result.get.results.find(_.questionId == "q2").get.isCorrect should be(false)
  }

  test("checkQuiz returns score 0 for unknown question id instead of crashing") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession]())).thenReturn(
      Success(TestData.publicQuiz(TestData.singleChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser]())).thenCallRealMethod()

    val dto    = CheckQuizDTO(answers = Seq(QuestionAnswerDTO("ukjent", Seq("a2"), Seq.empty)))
    val result = service.checkQuiz(TestData.quizId, dto, anonymous)
    result.isSuccess should be(true)
    result.get.totalScore should be(0)
    result.get.results.head.isCorrect should be(false)
  }
}

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
import no.ndla.network.model.{
  CombinedUser,
  CombinedUserWithMyNDLAUser,
  FeideIdToken,
  FeideUserWrapper,
  OptionalCombinedUser,
}
import no.ndla.scalatestsuite.UnitTestSuite
import no.ndla.testbase.NullSafeMockito.{any, eqTo, when}
import scalikejdbc.DBSession

import java.util.UUID
import scala.util.Success

class QuizReadServiceTest extends UnitTestSuite with TestEnvironment {
  val service = new QuizReadService

  private val anonymous = OptionalCombinedUser(tokenUser = None, myndlaUser = None)

  override def beforeEach(): Unit = {
    super.beforeEach()
    super.resetMocks()
  }

  test("withId includes display name of quiz owner") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession])).thenReturn(
      Success(TestData.publicQuiz(TestData.singleChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser])).thenCallRealMethod()
    when(userRepository.userWithFeideId(eqTo("owner-feide-id"))(using any[DBSession])).thenReturn(
      Success(Some(TestData.emptyMyNDLAUser.copy(id = 42, displayName = "Ola Nordmann")))
    )

    val result = service.withId(TestData.quizId, "nb", anonymous)
    result.get.owner should be(Some(OwnerDTO("Ola Nordmann", 42)))
  }

  test("savedQuizzes includes display name of quiz owner") {
    val viewer = CombinedUserWithMyNDLAUser(
      tokenUser = None,
      feideUser = FeideUserWrapper(TestData.emptyMyNDLAUser.copy(feideId = "viewer-feide-id"), mock[FeideIdToken]),
    )
    when(quizRepository.getSavedByUser(eqTo("viewer-feide-id"))(using any[DBSession])).thenReturn(
      Success(List(TestData.publicQuiz(TestData.singleChoiceQuestion)))
    )
    when(quizRepository.canView(any[Quiz], any[CombinedUser])).thenCallRealMethod()
    when(quizRepository.canSeeAnswers(any[Quiz], any[CombinedUser])).thenCallRealMethod()
    when(userRepository.userWithFeideId(eqTo("owner-feide-id"))(using any[DBSession])).thenReturn(
      Success(Some(TestData.emptyMyNDLAUser.copy(id = 42, displayName = "Ola Nordmann")))
    )

    val result = service.savedQuizzes(viewer, "nb")
    result.get.map(_.owner) should be(Seq(Some(OwnerDTO("Ola Nordmann", 42))))
  }

  test("checkAnswer returns correct result for correct SINGLE_CHOICE answer") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession])).thenReturn(
      Success(TestData.publicQuiz(TestData.singleChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser])).thenCallRealMethod()

    val answer = QuestionAnswerDTO(TestData.q1, selectedAlternativeIds = Seq(TestData.a2), matchedPairs = Seq.empty)
    val result = service.checkAnswer(TestData.quizId, answer, anonymous)

    result.isSuccess should be(true)
    result.get.isCorrect should be(true)
    result.get.score should be(1)
    result.get.correctAlternativeIds should contain(TestData.a2)
  }

  test("checkAnswer returns incorrect result for wrong SINGLE_CHOICE answer") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession])).thenReturn(
      Success(TestData.publicQuiz(TestData.singleChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser])).thenCallRealMethod()

    val answer = QuestionAnswerDTO(TestData.q1, selectedAlternativeIds = Seq(TestData.a1), matchedPairs = Seq.empty)
    val result = service.checkAnswer(TestData.quizId, answer, anonymous)

    result.isSuccess should be(true)
    result.get.isCorrect should be(false)
    result.get.score should be(0)
  }

  test("checkAnswer returns Failure for a private quiz when the caller is not the owner") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession])).thenReturn(
      Success(TestData.privateQuiz)
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser])).thenCallRealMethod()

    val answer = QuestionAnswerDTO(TestData.q1, selectedAlternativeIds = Seq(TestData.a2), matchedPairs = Seq.empty)
    service.checkAnswer(TestData.quizId, answer, anonymous).isFailure should be(true)
  }

  test("checkAnswer returns Failure for unknown question id") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession])).thenReturn(
      Success(TestData.publicQuiz(TestData.singleChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser])).thenCallRealMethod()

    val answer =
      QuestionAnswerDTO(UUID.randomUUID().nn, selectedAlternativeIds = Seq(TestData.a2), matchedPairs = Seq.empty)
    service.checkAnswer(TestData.quizId, answer, anonymous).isFailure should be(true)
  }

  test("checkAnswer requires exactly the correct set for MULTI_CHOICE") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession])).thenReturn(
      Success(TestData.publicQuiz(TestData.multiChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser])).thenCallRealMethod()

    val correct = QuestionAnswerDTO(TestData.q2, Seq(TestData.b1, TestData.b3), Seq.empty)
    val partial = QuestionAnswerDTO(TestData.q2, Seq(TestData.b1), Seq.empty)
    val tooMany = QuestionAnswerDTO(TestData.q2, Seq(TestData.b1, TestData.b2, TestData.b3), Seq.empty)

    service.checkAnswer(TestData.quizId, correct, anonymous).get.isCorrect should be(true)
    service.checkAnswer(TestData.quizId, partial, anonymous).get.isCorrect should be(false)
    service.checkAnswer(TestData.quizId, tooMany, anonymous).get.isCorrect should be(false)
  }

  test("checkAnswer evaluates MATCHING correctly") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession])).thenReturn(
      Success(TestData.publicQuiz(TestData.matchingQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser])).thenCallRealMethod()

    val correctAnswer =
      QuestionAnswerDTO(TestData.q3, Seq.empty, Seq(GlossaryPairDTO("cat", "katt"), GlossaryPairDTO("dog", "hund")))
    val wrongAnswer =
      QuestionAnswerDTO(TestData.q3, Seq.empty, Seq(GlossaryPairDTO("cat", "hund"), GlossaryPairDTO("dog", "katt")))

    service.checkAnswer(TestData.quizId, correctAnswer, anonymous).get.isCorrect should be(true)
    service.checkAnswer(TestData.quizId, wrongAnswer, anonymous).get.isCorrect should be(false)
  }

  test("checkQuiz aggregates scores across all questions") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession])).thenReturn(
      Success(TestData.publicQuiz(TestData.singleChoiceQuestion, TestData.multiChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser])).thenCallRealMethod()

    val dto = CheckQuizDTO(answers =
      Seq(
        QuestionAnswerDTO(TestData.q1, Seq(TestData.a2), Seq.empty), // riktig
        QuestionAnswerDTO(TestData.q2, Seq(TestData.b1), Seq.empty), // feil (mangler b3)
      )
    )

    val result = service.checkQuiz(TestData.quizId, dto, anonymous)
    result.isSuccess should be(true)
    result.get.totalScore should be(1)
    result.get.maxScore should be(2)
    result.get.results should have size 2
    result.get.results.find(_.questionId == TestData.q1).get.isCorrect should be(true)
    result.get.results.find(_.questionId == TestData.q2).get.isCorrect should be(false)
  }

  test("checkQuiz returns score 0 for unknown question id instead of crashing") {
    when(quizRepository.withIdOrError(eqTo(TestData.quizId))(using any[DBSession])).thenReturn(
      Success(TestData.publicQuiz(TestData.singleChoiceQuestion))
    )
    when(quizRepository.canView(any[Quiz], any[OptionalCombinedUser])).thenCallRealMethod()

    val dto    = CheckQuizDTO(answers = Seq(QuestionAnswerDTO(UUID.randomUUID().nn, Seq(TestData.a2), Seq.empty)))
    val result = service.checkQuiz(TestData.quizId, dto, anonymous)
    result.isSuccess should be(true)
    result.get.totalScore should be(0)
    result.get.results.head.isCorrect should be(false)
  }
}

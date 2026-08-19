/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.service

import no.ndla.common.model.NDLADate
import no.ndla.common.auth.Permission
import no.ndla.common.configuration.BaseProps
import no.ndla.common.model.domain.{Description, Title}
import no.ndla.myndlaapi.model.api.{AlternativeDTO, NewQuizDTO}
import no.ndla.myndlaapi.model.domain.*
import no.ndla.scalatestsuite.UnitTestSuite

import java.util.UUID

class QuizConverterServiceTest extends UnitTestSuite {
  given props: BaseProps = new BaseProps {
    override def ApplicationName: String          = "myndla-api-test"
    override def ApplicationPort: Int             = 80
    override val ndlaAuth0Scopes: Seq[Permission] = Seq.empty
  }

  private val service = new QuizConverterService
  private val now     = NDLADate.now().withNano(0)

  test("toDomainQuiz creates a private quiz owned by the caller with default display settings") {
    val quiz = service.toDomainQuiz(
      NewQuizDTO(title = "Kapittelquiz", description = Some("Kort beskrivelse"), displaySettings = None),
      ownerId = "feide-owner-1",
      user = "feide-owner-1",
      now = now,
      language = "nb",
    )

    quiz.ownerId should be("feide-owner-1")
    quiz.revision should be(None)
    quiz.status should be(QuizStatus.PRIVATE)
    quiz.updatedBy should be("feide-owner-1")
    quiz.created should be(now)
    quiz.updated should be(now)
    quiz.displaySettings should be(DisplaySettings.default)
    quiz.title should be(Seq(Title("Kapittelquiz", "nb")))
    quiz.description should be(Seq(Description("Kort beskrivelse", "nb")))
  }

  test("toApiQuiz uses requested language when available and hides correct answers for non-owners") {
    val quiz = Quiz(
      id = UUID.randomUUID(),
      ownerId = "feide-owner-1",
      revision = Some(2),
      title = Seq(Title("Tittel bokmal", "nb"), Title("Title english", "en")),
      description = Seq(Description("Beskrivelse bokmal", "nb"), Description("Description english", "en")),
      questions = Seq(
        Question(
          id = "q1",
          questionType = QuestionType.SINGLE_CHOICE,
          language = "nb",
          title = "Hva er riktig?",
          alternatives =
            Seq(Alternative("a1", "Feil", isCorrect = false), Alternative("a2", "Riktig", isCorrect = true)),
          glossaryPairs = Seq.empty,
          created = now,
          updated = now,
        )
      ),
      status = QuizStatus.PUBLIC,
      created = now,
      updated = now,
      updatedBy = "feide-owner-1",
      published = Some(now),
      displaySettings = DisplaySettings(randomOrder = true, oneQuestionAtATime = true),
    )

    val result = service.toApiQuiz(quiz, language = "en", isOwner = false)

    result.title should be("Title english")
    result.description should be(Some("Description english"))
    result.questions.head.alternatives should be(
      Seq(AlternativeDTO("a1", "Feil", None), AlternativeDTO("a2", "Riktig", None))
    )
  }

  test("toApiQuiz falls back to first available language and exposes fasit to the owner") {
    val quiz = Quiz(
      id = UUID.randomUUID(),
      ownerId = "feide-owner-2",
      revision = Some(1),
      title = Seq(Title("Norsk tittel", "nb")),
      description = Seq.empty,
      questions = Seq(
        Question(
          id = "q2",
          questionType = QuestionType.MULTI_CHOICE,
          language = "nb",
          title = "Velg riktige",
          alternatives = Seq(Alternative("a1", "En", isCorrect = true), Alternative("a2", "To", isCorrect = false)),
          glossaryPairs = Seq.empty,
          created = now,
          updated = now,
        )
      ),
      status = QuizStatus.PRIVATE,
      created = now,
      updated = now,
      updatedBy = "feide-owner-2",
      published = None,
      displaySettings = DisplaySettings.default,
    )

    val result = service.toApiQuiz(quiz, language = "en", isOwner = true)

    result.title should be("Norsk tittel")
    result.description should be(None)
    result.questions.head.alternatives should be(
      Seq(AlternativeDTO("a1", "En", Some(true)), AlternativeDTO("a2", "To", Some(false)))
    )
  }
}

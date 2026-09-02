/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.service

import no.ndla.common.model.NDLADate
import no.ndla.common.model.domain.{Description, Title}
import no.ndla.myndlaapi.model.api.*
import no.ndla.myndlaapi.model.domain.*
import no.ndla.network.model.FeideID

import java.util.UUID

class QuizConverterService {

  def toApiAlternative(a: Alternative, isOwner: Boolean): AlternativeDTO = AlternativeDTO(
    id = a.id,
    text = a.text,
    isCorrect =
      if (isOwner) Some(a.isCorrect)
      else None,
  )

  def toApiQuestion(q: Question, isOwner: Boolean): QuestionDTO = QuestionDTO(
    id = q.id,
    questionType = q.questionType,
    language = q.language,
    title = q.title,
    alternatives = q.alternatives.map(toApiAlternative(_, isOwner)),
    glossaryPairs = q.glossaryPairs.map(p => GlossaryPairDTO(p.word, p.definition)),
    required = q.required,
    alternativesRandomOrder = q.alternativesRandomOrder,
    created = q.created,
    updated = q.updated,
  )

  def toApiQuiz(quiz: Quiz, language: String, isOwner: Boolean): QuizDTO = {
    val titleMatch       = quiz.title.find(_.language == language).orElse(quiz.title.headOption)
    val resolvedLanguage = titleMatch.map(_.language).getOrElse(language)
    val title            = titleMatch.map(_.title).getOrElse("")
    val description      = quiz
      .description
      .find(_.language == resolvedLanguage)
      .orElse(quiz.description.headOption)
      .map(_.content)
    QuizDTO(
      id = quiz.id,
      revision = quiz.revision.getOrElse(1),
      title = title,
      description = description,
      language = resolvedLanguage,
      questions = quiz.questions.map(toApiQuestion(_, isOwner)),
      status = quiz.status,
      created = quiz.created,
      updated = quiz.updated,
      published = quiz.published,
      displaySettings = quiz.displaySettings,
      supportedLanguages = quiz.supportedLanguages,
    )
  }

  def toDomainAlternative(a: NewAlternativeDTO): Alternative =
    Alternative(id = UUID.randomUUID().toString, text = a.text, isCorrect = a.isCorrect)

  def toDomainQuestion(dto: NewQuestionDTO, now: NDLADate, language: String): Question = Question(
    id = UUID.randomUUID().toString,
    questionType = dto.questionType,
    language = language,
    title = dto.title,
    alternatives = dto.alternatives.map(toDomainAlternative),
    glossaryPairs = dto.glossaryPairs.map(p => GlossaryPair(p.word, p.definition)),
    required = dto.required,
    alternativesRandomOrder = dto.alternativesRandomOrder,
    created = now,
    updated = now,
  )

  def toDomainQuiz(dto: NewQuizDTO, ownerId: FeideID, user: String, now: NDLADate, language: String): Quiz = Quiz(
    id = UUID.randomUUID(),
    ownerId = ownerId,
    revision = None,
    title = Seq(Title(dto.title, language)),
    description = dto.description.toSeq.map(d => Description(d, language)),
    questions = Seq.empty,
    status = QuizStatus.PRIVATE,
    created = now,
    updated = now,
    updatedBy = user,
    published = None,
    displaySettings = dto.displaySettings.getOrElse(DisplaySettings.default),
  )

  def mergeQuiz(existing: Quiz, dto: UpdatedQuizDTO, user: String, now: NDLADate, language: String): Quiz = {
    val updatedTitle = dto.title match {
      case Some(t) =>
        val others = existing.title.filterNot(_.language == language)
        others :+ Title(t, language)
      case None => existing.title
    }
    val updatedDesc = dto.description match {
      case Some(d) =>
        val others = existing.description.filterNot(_.language == language)
        others :+ Description(d, language)
      case None => existing.description
    }
    existing.copy(
      revision = Some(dto.revision),
      title = updatedTitle,
      description = updatedDesc,
      displaySettings = dto.displaySettings.getOrElse(existing.displaySettings),
      updated = now,
      updatedBy = user,
    )
  }

  def mergeQuestion(existing: Question, dto: UpdatedQuestionDTO, now: NDLADate): Question = existing.copy(
    questionType = dto.questionType.getOrElse(existing.questionType),
    title = dto.title.getOrElse(existing.title),
    alternatives = dto.alternatives.map(_.map(toDomainAlternative)).getOrElse(existing.alternatives),
    glossaryPairs =
      dto.glossaryPairs.map(_.map(p => GlossaryPair(p.word, p.definition))).getOrElse(existing.glossaryPairs),
    required = dto.required.getOrElse(existing.required),
    alternativesRandomOrder = dto.alternativesRandomOrder.getOrElse(existing.alternativesRandomOrder),
    updated = now,
  )
}

/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi.service

import no.ndla.common.model.NDLADate
import no.ndla.common.model.domain.{Description, Title}
import no.ndla.common.UUIDUtil
import no.ndla.quizapi.model.api.*
import no.ndla.quizapi.model.domain.*

class ConverterService {

  def toApiAlternative(a: Alternative, isStaff: Boolean): AlternativeDTO =
    AlternativeDTO(
      id = a.id,
      text = a.text,
      isCorrect = if (isStaff) Some(a.isCorrect) else None,
    )

  def toApiQuestion(q: Question, isStaff: Boolean): QuestionDTO =
    QuestionDTO(
      id = q.id,
      questionType = q.questionType,
      title = q.title,
      alternatives = q.alternatives.map(toApiAlternative(_, isStaff)),
      glossaryPairs = q.glossaryPairs.map(p => GlossaryPairDTO(p.word, p.definition)),
      created = q.created,
      updated = q.updated,
    )

  def toApiQuiz(quiz: Quiz, language: String, isStaff: Boolean): QuizDTO = {
    val title       = quiz.title.find(_.language == language).orElse(quiz.title.headOption).map(_.title).getOrElse("")
    val description = quiz.description.find(_.language == language).orElse(quiz.description.headOption).map(_.content)
    QuizDTO(
      id = quiz.id.get,
      revision = quiz.revision.getOrElse(1),
      title = title,
      description = description,
      questions = quiz.questions.map(toApiQuestion(_, isStaff)),
      status = quiz.status,
      created = quiz.created,
      updated = quiz.updated,
      published = quiz.published,
      displaySettings = quiz.displaySettings,
    )
  }

  def toDomainAlternative(a: NewAlternativeDTO): Alternative =
    Alternative(id = UUIDUtil.randomUUID(), text = a.text, isCorrect = a.isCorrect)

  def toDomainQuestion(dto: NewQuestionDTO, now: NDLADate): Question =
    Question(
      id = UUIDUtil.randomUUID(),
      questionType = dto.questionType,
      title = dto.title,
      alternatives = dto.alternatives.map(toDomainAlternative),
      glossaryPairs = dto.glossaryPairs.map(p => GlossaryPair(p.word, p.definition)),
      created = now,
      updated = now,
    )

  def toDomainQuiz(dto: NewQuizDTO, user: String, now: NDLADate, language: String): Quiz =
    Quiz(
      id = None,
      revision = None,
      title = Seq(Title(dto.title, language)),
      description = dto.description.toSeq.map(d => Description(d, language)),
      questions = Seq.empty,
      status = QuizStatus.DRAFT,
      created = now,
      updated = now,
      updatedBy = user,
      published = None,
      displaySettings = dto.displaySettings.getOrElse(DisplaySettings.default),
    )

  def mergeQuiz(existing: Quiz, dto: UpdateQuizDTO, user: String, now: NDLADate, language: String): Quiz = {
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

  def mergeQuestion(existing: Question, dto: UpdateQuestionDTO, now: NDLADate): Question =
    existing.copy(
      questionType = dto.questionType.getOrElse(existing.questionType),
      title = dto.title.getOrElse(existing.title),
      alternatives = dto.alternatives.map(_.map(toDomainAlternative)).getOrElse(existing.alternatives),
      glossaryPairs = dto.glossaryPairs.map(_.map(p => GlossaryPair(p.word, p.definition))).getOrElse(existing.glossaryPairs),
      updated = now,
    )
}

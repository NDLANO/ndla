/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.service

import cats.implicits.*
import no.ndla.common.model.NDLADate
import no.ndla.common.model.domain.{Description, Title}
import no.ndla.common.model.domain.myndla.MyNDLAUser
import no.ndla.myndlaapi.randomUUID
import no.ndla.myndlaapi.model.api.*
import no.ndla.myndlaapi.model.domain.*
import no.ndla.network.model.FeideID

import scala.util.Try

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

  def toApiQuiz(quiz: Quiz, language: String, isOwner: Boolean, owner: Option[MyNDLAUser] = None): QuizDTO = {
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
      owner = owner.map(user => OwnerDTO(user.displayName, user.id)),
    )
  }

  def toDomainAlternative(a: NewAlternativeDTO): Try[Alternative] =
    randomUUID().map(id => Alternative(id = id, text = a.text, isCorrect = a.isCorrect))

  def toDomainQuestion(dto: NewQuestionDTO, now: NDLADate, language: String): Try[Question] = for {
    id           <- randomUUID()
    alternatives <- dto.alternatives.traverse(toDomainAlternative)
  } yield Question(
    id = id,
    questionType = dto.questionType,
    language = language,
    title = dto.title,
    alternatives = alternatives,
    glossaryPairs = dto.glossaryPairs.map(p => GlossaryPair(p.word, p.definition)),
    required = dto.required,
    alternativesRandomOrder = dto.alternativesRandomOrder,
    created = now,
    updated = now,
  )

  def toDomainQuiz(dto: NewQuizDTO, ownerId: FeideID, user: String, now: NDLADate, language: String): Try[Quiz] =
    randomUUID().map(id =>
      Quiz(
        id = id,
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
    val updatedDisplaySettings = dto.displaySettings match {
      case Some(ds) => existing
          .displaySettings
          .copy(
            randomOrder = ds.randomOrder.getOrElse(existing.displaySettings.randomOrder),
            randomSubset = ds.randomSubset.getOrElse(existing.displaySettings.randomSubset),
            questionCount = ds.questionCount.orElse(existing.displaySettings.questionCount),
          )
      case None => existing.displaySettings
    }
    existing.copy(
      revision = Some(dto.revision),
      title = updatedTitle,
      description = updatedDesc,
      displaySettings = updatedDisplaySettings,
      updated = now,
      updatedBy = user,
    )
  }

  def mergeQuestion(existing: Question, dto: UpdatedQuestionDTO, now: NDLADate): Try[Question] = dto
    .alternatives
    .traverse(_.traverse(toDomainAlternative))
    .map { alternatives =>
      existing.copy(
        questionType = dto.questionType.getOrElse(existing.questionType),
        title = dto.title.getOrElse(existing.title),
        alternatives = alternatives.getOrElse(existing.alternatives),
        glossaryPairs =
          dto.glossaryPairs.map(_.map(p => GlossaryPair(p.word, p.definition))).getOrElse(existing.glossaryPairs),
        required = dto.required.getOrElse(existing.required),
        alternativesRandomOrder = dto.alternativesRandomOrder.getOrElse(existing.alternativesRandomOrder),
        updated = now,
      )
    }
}

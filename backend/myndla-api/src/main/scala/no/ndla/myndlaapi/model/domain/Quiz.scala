/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import no.ndla.common.CirceUtil
import no.ndla.common.model.NDLADate
import no.ndla.common.model.domain.{Description, Title}
import no.ndla.myndlaapi.Props
import scalikejdbc.*

import java.util.UUID
import scala.util.Try

case class Quiz(
    id: UUID,
    ownerId: String,
    revision: Option[Int],
    title: Seq[Title],
    description: Seq[Description],
    questions: Seq[Question],
    status: QuizStatus,
    created: NDLADate,
    updated: NDLADate,
    updatedBy: String,
    published: Option[NDLADate],
    displaySettings: DisplaySettings,
) {
  def isOwner(ownerId: String): Boolean = this.ownerId == ownerId
  def isPublic: Boolean                 = this.status == QuizStatus.PUBLIC
  def isPrivate: Boolean                = this.status == QuizStatus.PRIVATE
}

object Quiz {
  implicit val encoder: Encoder[Quiz] = deriveEncoder
  implicit val decoder: Decoder[Quiz] = deriveDecoder
}

class DBQuiz(using props: Props) extends SQLSyntaxSupport[Quiz] {
  override def tableName: String          = "quizzes"
  override def schemaName: Option[String] = Some(props.MetaSchema)

  def fromResultSet(qz: SyntaxProvider[Quiz])(rs: WrappedResultSet): Quiz = fromResultSet(qz.resultName)(rs)

  def fromResultSet(qz: ResultName[Quiz])(rs: WrappedResultSet): Quiz = {
    import no.ndla.myndlaapi.uuidBinder
    val meta = CirceUtil.unsafeParseAs[Quiz](rs.string(qz.c("document")))
    meta.copy(
      id = rs.get[Try[UUID]](qz.c("id")).get,
      ownerId = rs.string(qz.c("owner_id")),
      revision = Some(rs.int(qz.c("revision"))),
    )
  }
}

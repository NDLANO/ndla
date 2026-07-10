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
import no.ndla.myndlaapi.Props
import no.ndla.network.model.FeideID
import scalikejdbc.{SQLSyntaxSupport, WrappedResultSet}

import java.util.UUID
import scala.util.Try

case class Quiz(
    id: UUID,
    ownerId: FeideID,
    name: String,
    description: Option[String],
    status: QuizStatus,
    layout: QuizLayout,
    questions: List[Question],
    created: NDLADate,
    updated: NDLADate,
    shared: Option[NDLADate],
) {
  def isPublic: Boolean                  = this.status == QuizStatus.PUBLIC
  def isPrivate: Boolean                 = this.status == QuizStatus.PRIVATE
  def isOwner(feideId: FeideID): Boolean = this.ownerId == feideId
}

object Quiz {
  implicit val encoder: Encoder[Quiz] = deriveEncoder
  implicit val decoder: Decoder[Quiz] = deriveDecoder

  def fromResultSet(rs: WrappedResultSet): Try[Quiz] = CirceUtil.tryParseAs[Quiz](rs.string("document"))
}

class DBQuiz(using props: Props) extends SQLSyntaxSupport[Quiz] {
  override def tableName: String          = "quizzes"
  override def schemaName: Option[String] = Some(props.MetaSchema)
}

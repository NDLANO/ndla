/*
 * Part of NDLA myndla-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import no.ndla.database.Row
import no.ndla.myndlaapi.Props
import no.ndla.common.model.NDLADate
import scalikejdbc.*

import java.util.UUID
import scala.util.Try

case class ResourceConnection(folderId: Option[UUID], resourceId: UUID, rank: Int, favoritedDate: NDLADate)
    extends Rankable {
  override val sortId: UUID          = resourceId
  override val sortRank: Option[Int] = Some(rank)
}

object ResourceConnection {
  implicit val encoder: Encoder[ResourceConnection] = deriveEncoder
  implicit val decoder: Decoder[ResourceConnection] = deriveDecoder

  def fromResultSet(lp: SyntaxProvider[ResourceConnection])(row: Row): Try[ResourceConnection] =
    fromResultSet((s: String) => lp.resultName.c(s).value)(row)

  def fromResultSet(colNameWrapper: String => String)(row: Row): Try[ResourceConnection] = for {
    folderId      <- row.optional[UUID](colNameWrapper("folder_id"))
    resourceId    <- row.required[UUID](colNameWrapper("resource_id"))
    rank          <- row.required[Int](colNameWrapper("rank"))
    favoritedDate <- row.required[NDLADate](colNameWrapper("favorited_date"))
  } yield ResourceConnection(folderId = folderId, resourceId = resourceId, rank = rank, favoritedDate = favoritedDate)
}

class DBResourceConnection(using props: Props) extends SQLSyntaxSupport[ResourceConnection] {
  override def tableName: String          = "resource_connections"
  override def schemaName: Option[String] = Some(props.MetaSchema)
}

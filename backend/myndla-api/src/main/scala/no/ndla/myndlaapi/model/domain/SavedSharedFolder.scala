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
import no.ndla.network.model.FeideID
import scalikejdbc.*

import java.util.UUID
import scala.util.Try

case class SavedSharedFolder(folderId: UUID, feideId: FeideID, rank: Int) {}

object SavedSharedFolder {
  implicit val encoder: Encoder[SavedSharedFolder] = deriveEncoder
  implicit val decoder: Decoder[SavedSharedFolder] = deriveDecoder

  def fromResultSet(sp: SyntaxProvider[SavedSharedFolder])(row: Row): Try[SavedSharedFolder] = {
    val column = (s: String) => sp.resultName.c(s).value
    for {
      folderId <- row.required[UUID](column("folder_id"))
      feideId  <- row.required[String](column("feide_id"))
      rank     <- row.required[Int](column("rank"))
    } yield SavedSharedFolder(folderId = folderId, feideId = feideId, rank = rank)
  }
}

class DBSavedSharedFolder(using props: Props) extends SQLSyntaxSupport[SavedSharedFolder] {
  override def tableName: String          = "saved_shared_folder"
  override def schemaName: Option[String] = Some(props.MetaSchema)
}

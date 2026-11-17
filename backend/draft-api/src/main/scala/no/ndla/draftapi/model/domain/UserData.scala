/*
 * Part of NDLA draft-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.draftapi.model.domain

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import no.ndla.database.{ColumnDecoder, Row}
import no.ndla.draftapi.Props
import no.ndla.draftapi.model.api.SavedSearchDTO
import scalikejdbc.*

import scala.util.Try

case class UserData(
    id: Option[Long],
    userId: String,
    savedSearches: Option[Seq[SavedSearchDTO]],
    latestEditedArticles: Option[Seq[String]],
    latestEditedConcepts: Option[Seq[String]],
    latestEditedLearningpaths: Option[Seq[String]],
    favoriteSubjects: Option[Seq[String]],
)

object UserData {
  implicit val encoder: Encoder[UserData] = deriveEncoder
  implicit val decoder: Decoder[UserData] = deriveDecoder

  def fromResultSet(ud: SyntaxProvider[UserData])(row: Row): Try[UserData] = fromResultSet(ud.resultName)(row)

  def fromResultSet(ud: ResultName[UserData])(row: Row): Try[UserData] = for {
    userData <- row.required[UserData](ud.c("document").value)(using ColumnDecoder.json)
    id       <- row.required[Long](ud.c("id").value)
  } yield userData.copy(id = Some(id))
}

class DBUserData(using props: Props) extends SQLSyntaxSupport[UserData] {
  override def tableName: String          = "userdata"
  override def schemaName: Option[String] = Some(props.MetaSchema)
}

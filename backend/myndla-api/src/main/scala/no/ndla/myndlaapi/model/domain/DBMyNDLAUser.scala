/*
 * Part of NDLA myndla-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import no.ndla.common.model.NDLADate
import no.ndla.common.model.domain.myndla.{MyNDLAUser, MyNDLAUserDocument}
import no.ndla.database.{ColumnDecoder, Row}
import no.ndla.myndlaapi.Props
import scalikejdbc.*

import scala.util.Try

class DBMyNDLAUser(using props: Props) extends SQLSyntaxSupport[MyNDLAUser] {

  override def tableName                  = "my_ndla_users"
  override def schemaName: Option[String] = Some(props.MetaSchema)

  def fromResultSet(lp: SyntaxProvider[MyNDLAUser])(row: Row): Try[MyNDLAUser] = {
    val column = (s: String) => lp.resultName.c(s).value
    for {
      document <- row.required[MyNDLAUserDocument](column("document"))(using ColumnDecoder.json)
      id       <- row.required[Long](column("id"))
      feideId  <- row.required[String](column("feide_id"))
      lastSeen <- row.required[NDLADate](column("last_seen"))
    } yield document.toFullUser(id = id, feideId = feideId, lastSeen = lastSeen)
  }
}

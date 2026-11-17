/*
 * Part of NDLA myndla-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import no.ndla.common.model.domain.config.ConfigMeta
import no.ndla.database.{ColumnDecoder, Row}
import no.ndla.myndlaapi.Props
import scalikejdbc.{SQLSyntaxSupport, SyntaxProvider}

import scala.util.Try

class DBConfigMeta(using props: Props) extends SQLSyntaxSupport[ConfigMeta] {
  override def tableName: String          = "configtable"
  override def schemaName: Option[String] = Some(props.MetaSchema)

  def fromResultSet(c: SyntaxProvider[ConfigMeta])(row: Row): Try[ConfigMeta] =
    row.required[ConfigMeta](c.resultName.c("value").value)(using ColumnDecoder.json)
}

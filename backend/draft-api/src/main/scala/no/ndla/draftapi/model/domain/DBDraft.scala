/*
 * Part of NDLA draft-api
 * Copyright (C) 2017 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.draftapi.model.domain

import no.ndla.common.model.NDLADate
import no.ndla.common.model.domain.Responsible
import no.ndla.common.model.domain.draft.Draft
import no.ndla.database.{ColumnDecoder, Row}
import no.ndla.draftapi.Props
import scalikejdbc.*

import scala.util.Try

class DBDraft(using props: Props) extends SQLSyntaxSupport[Draft] {
  override def tableName                  = "articledata"
  override def schemaName: Option[String] = Some(props.MetaSchema)

  def fromResultSet(dr: SyntaxProvider[Draft])(row: Row): Try[Draft] = fromResultSet(dr.resultName)(row)

  def fromResultSet(dr: ResultName[Draft])(row: Row): Try[Draft] = for {
    meta                 <- row.required[Draft](dr.c("document").value)(using ColumnDecoder.json)
    slug                 <- row.optional[String](dr.c("slug").value)
    externalIds          <- row.optional[List[Option[String]]](dr.c("external_id").value)
    responsibleId        <- row.optional[String](dr.c("responsible").value)
    responsibleUpdatedAt <- row.optional[NDLADate](dr.c("responsible_updated_at").value)
    id                   <- row.required[Long](dr.c("article_id").value)
    revision             <- row.required[Int](dr.c("revision").value)
  } yield meta.copy(
    id = Some(id),
    revision = Some(revision),
    externalIds = externalIds.map(_.flatten).filter(_.nonEmpty),
    slug = slug,
    responsible = responsibleId.zip(responsibleUpdatedAt).map(Responsible.apply),
  )
}

/*
 * Part of NDLA concept-api
 * Copyright (C) 2019 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.conceptapi.model.domain

import no.ndla.common.model.domain.concept.Concept
import no.ndla.conceptapi.Props
import no.ndla.database.{ColumnDecoder, Row}
import scalikejdbc.*

import scala.util.Try

class DBConcept(using props: Props) extends SQLSyntaxSupport[Concept] {
  override def tableName                  = "conceptdata"
  override def schemaName: Option[String] = Some(props.MetaSchema)

  def fromResultSet(lp: SyntaxProvider[Concept])(row: Row): Try[Concept] = fromResultSet(lp.resultName)(row)

  def fromResultSet(lp: ResultName[Concept])(row: Row): Try[Concept] = for {
    id       <- row.required[Long](lp.c("id"))
    revision <- row.optional[Int](lp.c("revision"))
    meta     <- row.required[Concept](lp.c("document"))(using ColumnDecoder.json)
  } yield new Concept(
    id = Some(id),
    revision = revision,
    meta.title,
    meta.content,
    meta.copyright,
    meta.created,
    meta.updated,
    meta.updatedBy,
    meta.tags,
    meta.status,
    meta.visualElement,
    meta.responsible,
    meta.conceptType,
    meta.glossData,
    meta.editorNotes,
  )
}

class DBPublishedConcept(using props: Props) extends SQLSyntaxSupport[Concept] {
  override def tableName                  = "publishedconceptdata"
  override def schemaName: Option[String] = Some(props.MetaSchema)
}

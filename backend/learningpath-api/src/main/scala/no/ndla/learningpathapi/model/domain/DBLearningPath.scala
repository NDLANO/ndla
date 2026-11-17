/*
 * Part of NDLA learningpath-api
 * Copyright (C) 2016 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.learningpathapi.model.domain

import no.ndla.common.model.domain.learningpath.LearningPath
import no.ndla.database.{ColumnDecoder, Row}
import no.ndla.learningpathapi.Props
import scalikejdbc.*

import scala.util.Try

class DBLearningPath(using props: Props) extends SQLSyntaxSupport[LearningPath] {
  override def tableName                  = "learningpaths"
  override def schemaName: Option[String] = Some(props.MetaSchema)

  def fromResultSet(lp: SyntaxProvider[LearningPath])(row: Row): Try[LearningPath] = fromResultSet(lp.resultName)(row)

  def fromResultSet(lp: ResultName[LearningPath])(row: Row): Try[LearningPath] = for {
    meta       <- row.required[LearningPath](lp.c("document").value)(using ColumnDecoder.json)
    id         <- row.required[Long](lp.c("id").value)
    revision   <- row.required[Int](lp.c("revision").value)
    externalId <- row.optional[String](lp.c("external_id").value)
  } yield meta.copy(id = Some(id), revision = Some(revision), externalId = externalId)
}

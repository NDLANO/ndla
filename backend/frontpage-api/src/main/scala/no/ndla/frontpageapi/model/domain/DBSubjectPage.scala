/*
 * Part of NDLA frontpage-api
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.frontpageapi.model.domain

import no.ndla.common.model.domain.frontpage.SubjectPage
import no.ndla.database.{ColumnDecoder, Row}
import no.ndla.frontpageapi.Props
import scalikejdbc.*

import scala.util.Try

class DBSubjectPage(using props: Props) {

  object DBSubjectPage extends SQLSyntaxSupport[SubjectPage] {
    override def tableName                  = "subjectpage"
    override def schemaName: Option[String] = Some(props.MetaSchema)

    def fromDb(lp: SyntaxProvider[SubjectPage])(row: Row): Try[SubjectPage] = fromDb(lp.resultName)(row)

    private def fromDb(lp: ResultName[SubjectPage])(row: Row): Try[SubjectPage] = for {
      id          <- row.required[Long](lp.c("id").value)
      subjectPage <- row.required[SubjectPage](lp.c("document").value)(using ColumnDecoder.json)
    } yield subjectPage.copy(id = Some(id))

  }
}

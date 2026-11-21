/*
 * Part of NDLA database
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.database

import org.postgresql.util.PGobject
import scalikejdbc.*

import scala.util.Try

case class DocumentRow(id: Long, document: String)

abstract class DocumentMigration extends TableMigration[DocumentRow] {
  val columnName: String
  private lazy val columnNameSQL: SQLSyntax = SQLSyntax.createUnsafely(columnName)
  override lazy val whereClause: SQLSyntax  = sqls"$columnNameSQL is not null"

  override def extractRowData(row: Row): Try[DocumentRow] = for {
    id       <- row.required[Long]("id")
    document <- row.required[String](columnName)
  } yield DocumentRow(id, document)

  def updateRow(rowData: DocumentRow)(implicit session: DBSession): Int = {
    val dataObject = new PGobject()
    dataObject.setType("jsonb")
    val newDocument = convertColumn(rowData.document)
    dataObject.setValue(newDocument)
    sql"""update $tableNameSQL
          set $columnNameSQL = $dataObject
          where id = ${rowData.id}
       """.update()
  }

  def convertColumn(value: String): String
}

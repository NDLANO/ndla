/*
 * Part of NDLA database
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.database

import cats.implicits.*
import org.flywaydb.core.api.migration.{BaseJavaMigration, Context}
import scalikejdbc.*

import scala.annotation.tailrec
import scala.util.{Failure, Success, Try}

/** Base class for Scala-based migrations.
  *
  * **NOTE:** If the table you are migrating does not use `bigint` as the ID type, you must override `tableIdType` to
  * return the correct [[TableIdType]].
  */
abstract class TableMigration[ROW_DATA] extends BaseJavaMigration {
  val tableName: String
  lazy val whereClause: SQLSyntax
  val chunkSize: Int = 1000
  def extractRowData(rs: WrappedResultSet): ROW_DATA
  def updateRow(rowData: ROW_DATA)(implicit session: DBSession): Int
  lazy val tableNameSQL: SQLSyntax = SQLSyntax.createUnsafely(tableName)
  val tableIdType: TableIdType     = TableIdType.Bigint

  override def migrate(context: Context | Null): Unit = DB(context.nn.getConnection.nn)
    .autoClose(false)
    .withinTx { session =>
      invalidateCachedPlans(using session)
      migrateRows(using session).get
    }

  /** Drops server-side prepared statements cached on Flyway's shared connection so a later `SELECT *` can't hit a plan
    * whose result shape was invalidated by an earlier migration's DDL (`ERROR: cached plan must not change result
    * type`, SQLSTATE 0A000).
    */
  private def invalidateCachedPlans(using session: DBSession): Unit = {
    val _ = sql"DEALLOCATE ALL".execute()
  }

  protected def migrateRows(implicit session: DBSession): Try[Unit] = {
    @tailrec
    def migrateRowsAfter(lastId: tableIdType.ScalaType): Try[Unit] = getRowChunk(lastId) match {
      case Failure(ex)    => Failure(ex)
      case Success(Nil)   => Success(())
      case Success(chunk) =>
        chunk.foreach((_, rowData) => updateRow(rowData))
        migrateRowsAfter(chunk.last._1)
    }

    migrateRowsAfter(tableIdType.zeroValueScala)
  }

  private def getRowChunk(
      lastId: tableIdType.ScalaType
  )(implicit session: DBSession): Try[Seq[(tableIdType.ScalaType, ROW_DATA)]] = {
    sql"select * from $tableNameSQL where $whereClause and id > $lastId order by id limit $chunkSize"
      .map(rs => tableIdType.fromResultSet(rs).map(id => (id, extractRowData(rs))))
      .list()
      .sequence
  }
}

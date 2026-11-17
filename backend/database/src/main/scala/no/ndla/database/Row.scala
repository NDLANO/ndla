/*
 * Part of NDLA database
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.database

import no.ndla.common.TryUtil.throwIfInterrupted
import no.ndla.common.implicits.toTry
import scalikejdbc.{SQLSyntax, WrappedResultSet}

import scala.util.{Failure, Success, Try}

/** A single row of a query result. Columns can only be read with [[ColumnDecoder]]s, and every read states whether the
  * column is required or optional, so that SQL `NULL` is never mistaken for a value that failed to decode, or the other
  * way around.
  */
opaque type Row = WrappedResultSet

type ColumnName = String | SQLSyntax

object Row {
  private[database] def apply(rs: WrappedResultSet): Row = rs

  private def label(column: ColumnName): String = column match {
    case name: String      => name
    case syntax: SQLSyntax => syntax.value
  }

  extension (row: Row) {

    /** Reads a column that must have a value. SQL `NULL` results in an [[UnexpectedNullColumnException]]. */
    def required[A](column: ColumnName)(using ColumnDecoder[A]): Try[A] = row
      .optional[A](column)
      .flatMap(_.toTry(UnexpectedNullColumnException(label(column))))

    /** Reads a column that may be SQL `NULL`, which results in `None`. */
    def optional[A](column: ColumnName)(using decoder: ColumnDecoder[A]): Try[Option[A]] = decoder
      .decode(row.underlying, label(column))
      .recoverWith { case ex =>
        Failure(ColumnDecodeException(label(column), ex))
      }

    private[database] def isNull(column: ColumnName): Try[Boolean] = Try
      .throwIfInterrupted(row.underlying.getObject(label(column)) == null)
      .recoverWith { case ex =>
        Failure(ColumnDecodeException(label(column), ex))
      }
  }
}

/** Decodes a row that is expected to sometimes be missing, such as the right hand side of a `LEFT JOIN`. */
final class OptionalRow[A] private (decoder: Row => Try[Option[A]]) {
  def decode(row: Row): Try[Option[A]] = decoder(row)
}

object OptionalRow {

  /** The row is present when `presenceColumn` is not SQL `NULL`, and must then be decoded successfully by `decoder`.
    *
    * `presenceColumn` must be a non-nullable column of the joined table, typically its primary key, so that it is only
    * `NULL` when there is no joined row.
    */
  def presentWhen[A](presenceColumn: ColumnName)(decoder: Row => Try[A]): OptionalRow[A] = new OptionalRow(row =>
    row
      .isNull(presenceColumn)
      .flatMap {
        case true  => Success(None)
        case false => decoder(row).map(Some(_))
      }
  )
}

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
import scalikejdbc.WrappedResultSet

import scala.util.{Failure, Success, Try}

/** A single row of a query result. Columns can only be read with [[ColumnDecoder]]s, and every read states whether the
  * column is required or optional, so that SQL `NULL` is never mistaken for a value that failed to decode, or the other
  * way around.
  */
opaque type Row = WrappedResultSet

object Row {
  private[database] def apply(rs: WrappedResultSet): Row = rs

  extension (row: Row) {

    /** Reads a column that must have a value. SQL `NULL` results in an [[UnexpectedNullColumnException]]. */
    def required[A](column: String)(using ColumnDecoder[A]): Try[A] = row
      .optional[A](column)
      .flatMap(_.toTry(UnexpectedNullColumnException(column)))

    /** Reads a column that may be SQL `NULL`, which results in `None`. */
    def optional[A](column: String)(using decoder: ColumnDecoder[A]): Try[Option[A]] = decoder
      .decode(row.underlying, column)
      .recoverWith { case ex =>
        Failure(ColumnDecodeException(column, ex))
      }

    private[database] def isNull(column: String): Try[Boolean] = Try
      .throwIfInterrupted(row.underlying.getObject(column) == null)
      .recoverWith { case ex =>
        Failure(ColumnDecodeException(column, ex))
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
  def presentWhen[A](presenceColumn: String)(decoder: Row => Try[A]): OptionalRow[A] = new OptionalRow(row =>
    row
      .isNull(presenceColumn)
      .flatMap {
        case true  => Success(None)
        case false => decoder(row).map(Some(_))
      }
  )
}

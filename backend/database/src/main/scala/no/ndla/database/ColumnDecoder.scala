/*
 * Part of NDLA database
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.database

import cats.implicits.*
import io.circe.Decoder
import no.ndla.common.CirceUtil
import no.ndla.common.TryUtil.throwIfInterrupted
import no.ndla.common.model.NDLADate

import java.sql.ResultSet
import java.time.OffsetDateTime
import java.util.UUID
import scala.util.{Failure, Success, Try}

/** Decodes the value of a single column in a [[Row]]. */
trait ColumnDecoder[A] {
  self =>

  /** Decodes the column with the given label. Must return `Success(None)` if, and only if, the value is SQL `NULL`, and
    * `Failure` if a value is present, but could not be decoded.
    */
  def decode(rs: ResultSet, column: String): Try[Option[A]]

  def map[B](f: A => B): ColumnDecoder[B] = (rs, column) => self.decode(rs, column).map(_.map(f))

  def emap[B](f: A => Try[B]): ColumnDecoder[B] = (rs, column) => self.decode(rs, column).flatMap(_.traverse(f))
}

object ColumnDecoder {

  /** Creates a decoder from a JDBC getter. SQL `NULL` is detected with [[ResultSet.wasNull]], since primitive getters
    * return `0` or `false` for `NULL`.
    */
  def jdbc[A](get: (ResultSet, String) => A | Null): ColumnDecoder[A] = (rs, column) =>
    Try.throwIfInterrupted {
      val value = get(rs, column)
      if (rs.wasNull()) None
      else Some(value.nn)
    }

  given ColumnDecoder[String]   = jdbc(_.getString(_))
  given ColumnDecoder[Int]      = jdbc(_.getInt(_))
  given ColumnDecoder[Long]     = jdbc(_.getLong(_))
  given ColumnDecoder[Boolean]  = jdbc(_.getBoolean(_))
  given ColumnDecoder[Double]   = jdbc(_.getDouble(_))
  given ColumnDecoder[UUID]     = jdbc(_.getObject(_, classOf[UUID]))
  given ColumnDecoder[NDLADate] = jdbc(_.getObject(_, classOf[OffsetDateTime])).map(NDLADate.fromOffsetDateTime)

  /** Decodes a `text[]` column, where SQL `NULL` elements are `None`. */
  given ColumnDecoder[List[Option[String]]] = jdbc(_.getArray(_)).emap(array =>
    Try(array.getArray()).flatMap {
      case elements: Array[?] => elements
          .toList
          .traverse {
            case null      => Success(None)
            case s: String => Success(Some(s))
            case other     => Failure(IllegalArgumentException(s"Expected text array elements, but found '$other'"))
          }
      case other => Failure(IllegalArgumentException(s"Expected an array, but found '$other'"))
    }
  )

  /** Decodes a `json`/`jsonb` (or text) column containing JSON. */
  def json[A: Decoder]: ColumnDecoder[A] = summon[ColumnDecoder[String]].emap(CirceUtil.tryParseAs[A])
}

case class UnexpectedNullColumnException(column: String)
    extends RuntimeException(s"Column '$column' was NULL, but a value was required")

case class ColumnDecodeException(column: String, cause: Throwable)
    extends RuntimeException(s"Could not decode column '$column': ${cause.getMessage}", cause)

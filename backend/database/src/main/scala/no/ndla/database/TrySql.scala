/*
 * Part of NDLA database
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.database

import cats.implicits.*
import no.ndla.common.TryUtil.throwIfInterrupted
import no.ndla.common.implicits.toTry
import scalikejdbc.*

import scala.util.{Success, Try}

trait TrySqlOps[Output, Extractor <: WithExtractor] {
  val underlying: SQL[Output, Extractor]

  private type ThisHasExtractor = SQL[Output, Extractor] =:= SQL[Output, HasExtractor]

  /** Run the SQL query to a list. Corresponds to [[SQL.list]]. */
  def runList()(using ev: ThisHasExtractor, session: ReadableDbSession): Try[List[Output]] =
    Try.throwIfInterrupted(ev(underlying).list())

  /** Run the SQL query to a list, and flatten the result to a single `Try`. Corresponds to [[SQL.list]]. */
  def runListFlat[U]()(using
      isTry: Output <:< Try[U],
      hasExtractor: ThisHasExtractor,
      session: ReadableDbSession,
  ): Try[List[U]] = Try.throwIfInterrupted(hasExtractor(underlying).list().sequence).flatten

  /** Run the SQL query to an `Option` of the first row. Corresponds to [[SQL.first]]. */
  def runFirst()(using ev: ThisHasExtractor, session: ReadableDbSession): Try[Option[Output]] =
    Try.throwIfInterrupted(ev(underlying).first())

  /** Run the SQL query to an `Option` of the first row, and flatten with the inner `Try`. Corresponds to [[SQL.first]].
    */
  def runFirstFlat[U]()(using
      isTry: Output <:< Try[U],
      hasExtractor: ThisHasExtractor,
      session: ReadableDbSession,
  ): Try[Option[U]] = Try.throwIfInterrupted(hasExtractor(underlying).first().sequence).flatten

  /** Run the SQL query to a single `Option`. Corresponds to [[SQL.single]]. */
  def runSingle()(using ev: ThisHasExtractor, session: ReadableDbSession): Try[Option[Output]] =
    Try.throwIfInterrupted(ev(underlying).single())

  /** Run the SQL query to a single `Option`, and flatten with the inner `Try`. Corresponds to [[SQL.single]]. */
  def runSingleFlat[U]()(using
      isTry: Output <:< Try[U],
      hasExtractor: ThisHasExtractor,
      session: ReadableDbSession,
  ): Try[Option[U]] = Try.throwIfInterrupted(hasExtractor(underlying).single().sequence).flatten

  /** Run the SQL query to a single `Try`, producing a `Failure` of the given `Throwable` if the result was empty.
    * Corresponds to [[SQL.single]].
    */
  def runSingleTry(ex: => Throwable)(using ev: ThisHasExtractor, session: ReadableDbSession): Try[Output] = Try
    .throwIfInterrupted(ev(underlying).single().toTry(ex))
    .flatten
}

final case class TrySql[Output, Extractor <: WithExtractor](override val underlying: SQL[Output, Extractor])
    extends TrySqlOps[Output, Extractor] {

  /** Execute the SQL statement. Corresponds to [[SQL.execute]]. */
  def execute()(using session: WriteableDbSession): Try[Boolean] = Try.throwIfInterrupted(underlying.execute())

  /** Execute the SQL statement, returning the number of updated rows. Corresponds to [[SQL.update]]. */
  def update()(using session: WriteableDbSession): Try[Int] = Try.throwIfInterrupted(underlying.update())

  /** Execute the SQL statement, returning the generated key of the inserted value. Corresponds to
    * [[SQL.updateAndReturnGeneratedKey]].
    */
  def updateAndReturnGeneratedKey()(using session: WriteableDbSession): Try[Long] =
    Try.throwIfInterrupted(underlying.updateAndReturnGeneratedKey())

  def map[A](f: WrappedResultSet => A): TrySql[A, HasExtractor] = TrySql(underlying.map(f))

  /** Decode every row of the result with `f`. A `Failure` for any row fails the whole result. */
  def decode[A](f: Row => Try[A]): DecodedSql[A] = DecodedSql(underlying.map(rs => f(Row(rs))))

  def foldLeft[A](z: A)(f: (A, WrappedResultSet) => A)(using session: ReadableDbSession): Try[A] = Try
    .throwIfInterrupted(underlying.foldLeft(z)(f))

  /** Start a one-to-x query, where `f` decodes the "one" side of each row. */
  def one[A, Out](f: Row => Output)(using ev: Output =:= Try[A]): TryOneToXSql[A, Extractor, Out] =
    TryOneToXSql(ev.substituteCo[[X] =>> SQL[X, Extractor]](underlying).one[Try[Out]](rs => ev(f(Row(rs)))))
}

/** A query where every row has been decoded to a `Try`. Running it fails if decoding any of the rows failed. */
final case class DecodedSql[A](underlying: SQL[Try[A], HasExtractor]) {

  /** Run the SQL query to a list. Corresponds to [[SQL.list]]. */
  def runList()(using session: ReadableDbSession): Try[List[A]] = Try
    .throwIfInterrupted(underlying.list())
    .flatMap(_.sequence)

  /** Run the SQL query to an `Option` of the first row. Corresponds to [[SQL.first]]. */
  def runFirst()(using session: ReadableDbSession): Try[Option[A]] = Try
    .throwIfInterrupted(underlying.first())
    .flatMap(_.sequence)

  /** Run the SQL query to a single `Option`. Corresponds to [[SQL.single]]. */
  def runSingle()(using session: ReadableDbSession): Try[Option[A]] = Try
    .throwIfInterrupted(underlying.single())
    .flatMap(_.sequence)

  /** Run the SQL query to a single value, producing a `Failure` of the given `Throwable` if the result was empty.
    * Corresponds to [[SQL.single]].
    */
  def runSingleTry(ex: => Throwable)(using session: ReadableDbSession): Try[A] = runSingle().flatMap(_.toTry(ex))
}

final case class TryOneToXSql[A, Extractor <: WithExtractor, Out](underlying: OneToXSQL[Try[A], Extractor, Try[Out]]) {

  /** The related row is always present, as in an inner join. */
  def toOne[B](to: Row => Try[B]): TryOneToOneSql[A, B, Extractor, Out] =
    TryOneToOneSql(underlying.toOne(rs => to(Row(rs))))

  /** The related row might be missing, as in an outer join. */
  def toOptionalOne[B](to: OptionalRow[B]): TryOneToOneSql[A, Option[B], Extractor, Out] =
    TryOneToOneSql(underlying.toOne(rs => to.decode(Row(rs))))

  def toMany[B](to: OptionalRow[B]): TryOneToManySql[A, B, Extractor, Out] =
    TryOneToManySql(underlying.toMany(rs => to.decode(Row(rs)).sequence))

  def toManies[B1, B2, B3](
      to1: OptionalRow[B1],
      to2: OptionalRow[B2],
      to3: OptionalRow[B3],
  ): TryOneToManies3Sql[A, B1, B2, B3, Extractor, Out] = TryOneToManies3Sql(
    underlying.toManies(
      rs => to1.decode(Row(rs)).sequence,
      rs => to2.decode(Row(rs)).sequence,
      rs => to3.decode(Row(rs)).sequence,
    )
  )
}

final case class TryOneToOneSql[A, B, Extractor <: WithExtractor, Out](
    underlying: OneToOneSQL[Try[A], Try[B], Extractor, Try[Out]]
) {
  def map(f: (A, B) => Out): DecodedSql[Out] = mapTry((a, b) => Success(f(a, b)))

  def mapTry(f: (A, B) => Try[Out]): DecodedSql[Out] =
    DecodedSql(underlying.map((one, other) => (one, other).tupled.flatMap(f.tupled)))
}

final case class TryOneToManySql[A, B, Extractor <: WithExtractor, Out](
    underlying: OneToManySQL[Try[A], Try[B], Extractor, Try[Out]]
) {
  def map(f: (A, List[B]) => Out): DecodedSql[Out] = mapTry((a, bs) => Success(f(a, bs)))

  def mapTry(f: (A, List[B]) => Try[Out]): DecodedSql[Out] = DecodedSql(
    underlying.map((one, many) =>
      for {
        a   <- one
        bs  <- many.toList.sequence
        out <- f(a, bs)
      } yield out
    )
  )
}

final case class TryOneToManies3Sql[A, B1, B2, B3, Extractor <: WithExtractor, Out](
    underlying: OneToManies3SQL[Try[A], Try[B1], Try[B2], Try[B3], Extractor, Try[Out]]
) {
  def map(f: (A, List[B1], List[B2], List[B3]) => Out): DecodedSql[Out] =
    mapTry((a, bs1, bs2, bs3) => Success(f(a, bs1, bs2, bs3)))

  def mapTry(f: (A, List[B1], List[B2], List[B3]) => Try[Out]): DecodedSql[Out] = DecodedSql(
    underlying.map((one, many1, many2, many3) =>
      for {
        a   <- one
        bs1 <- many1.toList.sequence
        bs2 <- many2.toList.sequence
        bs3 <- many3.toList.sequence
        out <- f(a, bs1, bs2, bs3)
      } yield out
    )
  )
}

/*
 * Part of NDLA database
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.database

import no.ndla.common.implicits.{toOption, toTry}
import scalikejdbc.*

import java.util.UUID as JavaUUID
import scala.util.{Success, Try}

sealed trait TableIdType {
  type ScalaType
  def zeroValueScala: ScalaType
  def zeroValueSql: SQLSyntax
  def fromResultSet(rs: WrappedResultSet): Try[ScalaType]
}

object TableIdType {
  case object Bigint extends TableIdType {
    override type ScalaType = Long
    override def zeroValueSql: SQLSyntax                             = sqls"0::bigint"
    override def zeroValueScala: ScalaType                           = 0L
    override def fromResultSet(rs: WrappedResultSet): Try[ScalaType] = Success(rs.long("id"))
  }

  case object UUID extends TableIdType {
    override type ScalaType = JavaUUID
    override def zeroValueSql: SQLSyntax                             = sqls"'00000000-0000-0000-0000-000000000000'::uuid"
    override def zeroValueScala: ScalaType                           = JavaUUID(0L, 0L)
    override def fromResultSet(rs: WrappedResultSet): Try[ScalaType] = JavaUUID
      .fromString(rs.string("id"))
      .toOption
      .toTry(new IllegalStateException("Could not parse id column as UUID"))
  }
}

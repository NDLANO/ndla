/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi.model.domain

import no.ndla.common.CirceUtil
import no.ndla.quizapi.Props
import scalikejdbc.*

class DBQuiz(using props: Props) extends SQLSyntaxSupport[Quiz] {
  override def tableName                  = "quizzes"
  override def schemaName: Option[String] = Some(props.MetaSchema)

  def fromResultSet(qz: SyntaxProvider[Quiz])(rs: WrappedResultSet): Quiz = fromResultSet(qz.resultName)(rs)

  def fromResultSet(qz: ResultName[Quiz])(rs: WrappedResultSet): Quiz = {
    val meta = CirceUtil.unsafeParseAs[Quiz](rs.string(qz.c("document")))
    meta.copy(id = Some(rs.long(qz.c("id"))), revision = Some(rs.int(qz.c("revision"))))
  }
}

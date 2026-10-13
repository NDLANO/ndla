/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import no.ndla.common.model.NDLADate
import no.ndla.myndlaapi.Props
import scalikejdbc.*

import java.util.UUID

case class SavedQuiz(quizId: UUID, feideId: String, created: NDLADate)

class DBSavedQuiz(using props: Props) extends SQLSyntaxSupport[SavedQuiz] {
  override def tableName: String          = "saved_quizzes"
  override def schemaName: Option[String] = Some(props.MetaSchema)
}

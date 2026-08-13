/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi

import no.ndla.common.auth.Permission
import no.ndla.common.configuration.BaseProps
import no.ndla.database.DatabaseProps

import scala.util.Properties.propOrElse

type Props = QuizApiProperties

class QuizApiProperties extends BaseProps with DatabaseProps {
  override def ApplicationPort: Int    = propOrElse("APPLICATION_PORT", "80").toInt
  override def ApplicationName: String = "quiz-api"

  override def MetaMigrationLocation: String = "no/ndla/quizapi/db/migration"

  override val ndlaAuth0Scopes: Seq[Permission] = Permission.thatStartsWith("quiz")
}

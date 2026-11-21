/*
 * Part of NDLA concept-api
 * Copyright (C) 2019 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.conceptapi.repository

import no.ndla.common.model.domain.concept.Concept
import scalikejdbc.DBSession

import scala.util.Try

trait Repository[T <: Concept] {
  def minMaxId(implicit session: DBSession): Try[(Long, Long)]
  def documentsWithIdBetween(min: Long, max: Long): Try[Seq[T]]
}

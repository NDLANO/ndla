/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi.model.domain

import no.ndla.common.errors.NotFoundException

object NDLAErrors {
  def quizNotFound(id: Long): NotFoundException = NotFoundException(s"Quiz with id $id was not found")
  def questionNotFound(questionId: String, quizId: Long): NotFoundException =
    NotFoundException(s"Question '$questionId' was not found in quiz $quizId")
  def revisionMismatch(id: Long): RuntimeException =
    new RuntimeException(s"Revision mismatch when updating quiz $id – please reload and try again")
}

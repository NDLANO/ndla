/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import no.ndla.common.errors.{AccessDeniedException, NotFoundException}

import java.util.UUID

object QuizErrors {
  def quizNotFound(id: UUID): NotFoundException                             = NotFoundException(s"Quiz with id $id was not found")
  def questionNotFound(questionId: String, quizId: UUID): NotFoundException =
    NotFoundException(s"Question '$questionId' was not found in quiz $quizId")
  def revisionMismatch(id: UUID): RuntimeException =
    new RuntimeException(s"Revision mismatch when updating quiz $id – please reload and try again")
  def notOwner(id: UUID): AccessDeniedException = AccessDeniedException(s"You do not have access to modify quiz $id")
}

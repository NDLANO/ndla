/*
 * Part of NDLA common
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.converter

import cats.syntax.traverse.*
import no.ndla.common.model.api.{CommentDTO, NewCommentDTO, UpdatedCommentDTO}
import no.ndla.common.model.domain.Comment
import no.ndla.common.{Clock, UUIDUtil}
import no.ndla.common.implicits.*
import no.ndla.common.model.api.RevisionMetaDTO
import java.util.UUID
import no.ndla.common.model.domain.RevisionMeta
import no.ndla.common.model.domain.RevisionStatus

import scala.util.{Success, Try}

class CommonConverter(using clock: Clock, uuidUtil: UUIDUtil) {
  def newCommentApiToDomain(comment: NewCommentDTO): Try[Comment] = {
    uuidUtil
      .randomUUID()
      .map(id =>
        Comment(
          id = id,
          created = clock.now(),
          updated = clock.now(),
          content = comment.content,
          isOpen = comment.isOpen.getOrElse(true),
          solved = false,
        )
      )
  }
  def commentDomainToApi(comment: Comment): CommentDTO = {
    CommentDTO(
      id = comment.id.toString,
      content = comment.content,
      created = comment.created,
      updated = comment.updated,
      isOpen = comment.isOpen,
      solved = comment.solved,
    )
  }
  def mergeUpdatedCommentsWithExisting(
      updatedComments: List[UpdatedCommentDTO],
      existingComments: Seq[Comment],
  ): Try[Seq[Comment]] = {
    updatedComments.traverse(updatedComment => {
      existingComments.find(cc => updatedComment.id.contains(cc.id.toString)) match {
        case Some(existingComment) =>
          val isContentChanged = updatedComment.content != existingComment.content
          val newUpdated       =
            if (isContentChanged) clock.now()
            else existingComment.updated
          Success(
            existingComment.copy(
              updated = newUpdated,
              content = updatedComment.content,
              isOpen = updatedComment.isOpen.getOrElse(true),
              solved = updatedComment.solved.getOrElse(false),
            )
          )
        case None => uuidUtil
            .randomUUID()
            .map(id =>
              Comment(
                id = id,
                created = clock.now(),
                updated = clock.now(),
                content = updatedComment.content,
                isOpen = updatedComment.isOpen.getOrElse(true),
                solved = updatedComment.solved.getOrElse(false),
              )
            )
      }
    })
  }

  def revisionMetaApiToDomain(revisionMeta: RevisionMetaDTO): Try[RevisionMeta] = {
    val id = revisionMeta.id match {
      case Some(value) =>
        UUID.fromString(value).toOption.toTry(new IllegalStateException(s"Could not parse '$value' as UUID"))
      case None => uuidUtil.randomUUID()
    }
    id.map(uuid =>
      RevisionMeta(
        id = uuid,
        revisionDate = revisionMeta.revisionDate,
        note = revisionMeta.note,
        status = RevisionStatus.fromStringDefault(revisionMeta.status),
      )
    )
  }

  def revisionMetaDomainToApi(revisionMeta: RevisionMeta): RevisionMetaDTO = {
    RevisionMetaDTO(
      id = Some(revisionMeta.id.toString),
      revisionDate = revisionMeta.revisionDate,
      note = revisionMeta.note,
      status = revisionMeta.status.entryName,
    )
  }
}

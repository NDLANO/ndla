/*
 * Part of NDLA common
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.converter

import no.ndla.common.{Clock, UUIDUtil}
import no.ndla.common.model.NDLADate
import no.ndla.common.model.api.{NewCommentDTO, UpdatedCommentDTO}
import no.ndla.common.model.domain.Comment
import no.ndla.testbase.UnitTestSuiteBase
import no.ndla.testbase.NullSafeMockito.when

import java.util.UUID
import scala.util.Success

class CommonConverterTest extends UnitTestSuiteBase {
  given clock: Clock       = mock[Clock]
  given uuidUtil: UUIDUtil = mock[UUIDUtil]
  val commonConverter      = new CommonConverter
  test("that mergeUpdatedCommentsWithExisting creates and updates comments correctly") {
    val uuid = UUID.randomUUID().nn
    val now  = NDLADate.now()
    when(clock.now()).thenReturn(now)
    when(uuidUtil.randomUUID()).thenReturn(Success(uuid))

    val updatedComments = List(
      UpdatedCommentDTO(id = None, content = "hei", isOpen = Some(true), solved = Some(false)),
      UpdatedCommentDTO(id = Some(uuid.toString), content = "yoo", isOpen = Some(false), solved = Some(false)),
    )
    val existingComments =
      Seq(Comment(id = uuid, created = now, updated = now, content = "nja", isOpen = true, solved = false))
    val expectedComments = Seq(
      Comment(id = uuid, created = now, updated = now, content = "hei", isOpen = true, solved = false),
      Comment(id = uuid, created = now, updated = now, content = "yoo", isOpen = false, solved = false),
    )
    commonConverter.mergeUpdatedCommentsWithExisting(updatedComments, existingComments) should
      be(Success(expectedComments))
  }

  test("that mergeUpdatedCommentsWithExisting only keeps updatedComments and deletes rest") {
    val uuid  = UUID.randomUUID().nn
    val uuid2 = UUID.randomUUID().nn
    val uuid3 = UUID.randomUUID().nn
    val now   = NDLADate.now()
    when(clock.now()).thenReturn(now)

    val updatedComments = List(
      UpdatedCommentDTO(id = Some(uuid.toString), content = "updated keep", isOpen = Some(true), solved = Some(false))
    )
    val existingComments = Seq(
      Comment(id = uuid, created = now, updated = now, content = "keep", isOpen = true, solved = false),
      Comment(id = uuid2, created = now, updated = now, content = "delete", isOpen = true, solved = false),
      Comment(id = uuid3, created = now, updated = now, content = "delete", isOpen = true, solved = false),
    )
    val expectedComments =
      Seq(Comment(id = uuid, created = now, updated = now, content = "updated keep", isOpen = true, solved = false))
    val result = commonConverter.mergeUpdatedCommentsWithExisting(updatedComments, existingComments)
    result should be(Success(expectedComments))
  }

  test("that newCommentApiToDomain creates comments correctly") {
    val uuid = UUID.randomUUID().nn
    val now  = NDLADate.now()
    when(clock.now()).thenReturn(now)
    when(uuidUtil.randomUUID()).thenReturn(Success(uuid))

    val newComments     = NewCommentDTO(content = "hei", isOpen = None)
    val expectedComment =
      Comment(id = uuid, created = now, updated = now, content = "hei", isOpen = true, solved = false)
    commonConverter.newCommentApiToDomain(newComments) should be(Success(expectedComment))
  }
}

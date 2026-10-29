/*
 * Part of NDLA common
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common

import no.ndla.common.implicits.*

import java.util.UUID
import scala.util.Try

class UUIDUtil {
  def randomUUID(): Try[UUID] = {
    UUID.randomUUID().toOption.toTry(new IllegalStateException("Could not generate a random UUID"))
  }
}

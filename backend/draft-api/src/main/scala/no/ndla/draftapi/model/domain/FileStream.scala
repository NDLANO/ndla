/*
 * Part of NDLA draft-api
 * Copyright (C) 2018 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.draftapi.model.domain

import java.io.InputStream

trait FileStream {
  def contentType: String
  def stream: InputStream
  def fileName: String
  def format: String = fileName.drop(fileName.lastIndexOf(".") + 1)
}

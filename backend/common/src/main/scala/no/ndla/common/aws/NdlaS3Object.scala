/*
 * Part of NDLA common
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.aws

import java.io.InputStream

case class NdlaS3Object(bucket: String, key: String, stream: InputStream, contentType: String, contentLength: Long)
    extends NdlaS3ObjectMetadata

case class NdlaS3HeadObject(bucket: String, key: String, contentType: String, contentLength: Long)
    extends NdlaS3ObjectMetadata

trait NdlaS3ObjectMetadata {
  def bucket: String
  def key: String
  def contentType: String
  def contentLength: Long
}

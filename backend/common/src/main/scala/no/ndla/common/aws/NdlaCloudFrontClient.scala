/*
 * Part of NDLA common
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.aws

import no.ndla.common.TryUtil.throwIfInterrupted
import no.ndla.common.UUIDUtil
import software.amazon.awssdk.services.cloudfront.CloudFrontClient
import software.amazon.awssdk.services.cloudfront.model.{CreateInvalidationRequest, InvalidationBatch, Paths}

import scala.jdk.CollectionConverters.*
import scala.util.Try

class NdlaCloudFrontClient {

  lazy val client: CloudFrontClient = {
    import scala.language.unsafeNulls
    val builder = CloudFrontClient.builder()
    builder.build()
  }

  def createInvalidation(distributionId: String, paths: Seq[String]): Try[Unit] = {
    import scala.language.unsafeNulls
    Try.throwIfInterrupted {
      val invalidationBatch = InvalidationBatch
        .builder()
        .paths(Paths.builder().items(paths.asJava).quantity(paths.size).build())
        .callerReference(UUIDUtil.randomUUID().toString)
        .build()

      val request = CreateInvalidationRequest
        .builder()
        .distributionId(distributionId)
        .invalidationBatch(invalidationBatch)
        .build()

      client.createInvalidation(request): Unit
    }
  }
}

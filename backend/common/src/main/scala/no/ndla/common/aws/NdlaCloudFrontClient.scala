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
import no.ndla.common.implicits.*
import software.amazon.awssdk.services.cloudfront.CloudFrontClient
import software.amazon.awssdk.services.cloudfront.model.{CreateInvalidationRequest, InvalidationBatch, Paths}

import scala.jdk.CollectionConverters.*
import scala.util.Try

class NdlaCloudFrontClient {

  lazy val client: Option[CloudFrontClient] = CloudFrontClient.builder().toOption.flatMap(_.build().toOption)

  private def unexpectedNull(operation: String): NullPointerException =
    new NullPointerException(s"Got unexpected null value from CloudFront client during '$operation'")

  def createInvalidation(distributionId: String, paths: Seq[String]): Try[Unit] = {
    Try
      .throwIfInterrupted {
        for {
          invalidationPaths <- Paths.builder().toOption
          invalidationPaths <- invalidationPaths.items(paths.asJava).toOption
          invalidationPaths <- invalidationPaths.quantity(paths.size).toOption
          invalidationPaths <- invalidationPaths.build().toOption
          invalidationBatch <- InvalidationBatch.builder().toOption
          invalidationBatch <- invalidationBatch.paths(invalidationPaths).toOption
          invalidationBatch <- invalidationBatch.callerReference(UUIDUtil.randomUUID().toString).toOption
          invalidationBatch <- invalidationBatch.build().toOption
          request           <- CreateInvalidationRequest.builder().toOption
          request           <- request.distributionId(distributionId).toOption
          request           <- request.invalidationBatch(invalidationBatch).toOption
          request           <- request.build().toOption
          cloudFront        <- client
        } yield cloudFront.createInvalidation(request): Unit
      }
      .flatMap(_.toTry(unexpectedNull("createInvalidation")))
  }
}

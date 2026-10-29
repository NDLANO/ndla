/*
 * Part of NDLA common
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.aws

import cats.data.NonEmptySeq
import cats.syntax.traverse.*
import no.ndla.common.TryUtil.throwIfInterrupted
import no.ndla.common.errors.MissingBucketKeyException
import no.ndla.common.implicits.*
import no.ndla.common.model.domain.UploadedFile
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.model.*
import software.amazon.awssdk.services.s3.S3Client

import java.io.InputStream
import scala.jdk.CollectionConverters.*
import scala.util.{Failure, Try}

class NdlaS3Client(bucket: String, region: Option[String]) {
  lazy val client: Option[S3Client] = S3Client
    .builder()
    .toOption
    .flatMap { builder =>
      region match {
        case Some(value) => builder.region(Region.of(value)).toOption.flatMap(_.build().toOption)
        case None        => builder.build().toOption
      }
    }

  private def unexpectedNull(operation: String): NullPointerException =
    new NullPointerException(s"Got unexpected null value from S3 client during '$operation'")

  def headObject(key: String): Try[HeadObjectResponse] = Try
    .throwIfInterrupted {
      for {
        builder           <- HeadObjectRequest.builder().toOption
        builder           <- builder.bucket(bucket).toOption
        builder           <- builder.key(key).toOption
        headObjectRequest <- builder.build().toOption
        s3                <- client
        response          <- s3.headObject(headObjectRequest).toOption
      } yield response
    }
    .flatMap(_.toTry(unexpectedNull("headObject")))

  def objectExists(key: String): Boolean = headObject(key).isSuccess

  def canAccessBucket: Try[Unit] = Try
    .throwIfInterrupted {
      for {
        builder <- ListObjectsV2Request.builder().toOption
        builder <- builder.bucket(bucket).toOption
        builder <- builder.maxKeys(1).toOption
        listReq <- builder.build().toOption
        s3      <- client
      } yield {
        s3.listObjectsV2(listReq)
        ()
      }
    }
    .flatMap(_.toTry(unexpectedNull("canAccessBucket")))

  def getObject(key: String): Try[NdlaS3Object] = {
    val gor = for {
      builder <- GetObjectRequest.builder().toOption
      builder <- builder.bucket(bucket).toOption
      builder <- builder.key(key).toOption
      request <- builder.build().toOption
    } yield request
    Try
      .throwIfInterrupted(client.flatMap(s3 => gor.flatMap(s3.getObject(_).toOption)))
      .flatMap(_.toTry(unexpectedNull("getObject")))
      .flatMap(res =>
        (
          for {
            response      <- res.response().toOption
            contentLength <- response.contentLength().toOption
          } yield NdlaS3Object(
            bucket = bucket,
            key = key,
            stream = res,
            contentType = response.contentType().toOption.getOrElse("application/octet-stream"),
            contentLength = contentLength,
          )
        ).toTry(unexpectedNull("getObject"))
      )
      .recoverWith {
        case _: NoSuchKeyException => Failure(MissingBucketKeyException(key))
        case ex                    => Failure(ex)
      }
  }

  def deleteObject(key: String): Try[DeleteObjectResponse] = Try
    .throwIfInterrupted {
      for {
        builder  <- DeleteObjectRequest.builder().toOption
        builder  <- builder.key(key).toOption
        builder  <- builder.bucket(bucket).toOption
        dor      <- builder.build().toOption
        s3       <- client
        response <- s3.deleteObject(dor).toOption
      } yield response
    }
    .flatMap(_.toTry(unexpectedNull("deleteObject")))

  def deleteObjects(keys: NonEmptySeq[String]): Try[DeleteObjectsResponse] = Try
    .throwIfInterrupted {
      val objects = keys.traverse(key =>
        for {
          builder    <- ObjectIdentifier.builder().toOption
          builder    <- builder.key(key).toOption
          identifier <- builder.build().toOption
        } yield identifier
      )
      for {
        identifiers <- objects
        builder     <- Delete.builder().toOption
        builder     <- builder.objects(identifiers.toSeq.asJava).toOption
        delete      <- builder.build().toOption
        builder     <- DeleteObjectsRequest.builder().toOption
        builder     <- builder.bucket(bucket).toOption
        builder     <- builder.delete(delete).toOption
        dor         <- builder.build().toOption
        s3          <- client
        response    <- s3.deleteObjects(dor).toOption
      } yield response
    }
    .flatMap(_.toTry(unexpectedNull("deleteObjects")))

  def putObject(key: String, uploadedFile: UploadedFile): Try[PutObjectResponse] = putObject(key, uploadedFile, None)

  def putObject(key: String, uploadedFile: UploadedFile, cacheControl: Option[String]): Try[PutObjectResponse] = Try
    .throwIfInterrupted {
      val contentType = uploadedFile.contentType.getOrElse("application/octet-stream")
      val por         = for {
        builder <- PutObjectRequest.builder().toOption
        builder <- builder.contentLength(uploadedFile.fileSize).toOption
        builder <- builder.contentType(contentType).toOption
        builder <- builder.key(key).toOption
        builder <- builder.bucket(bucket).toOption
      } yield builder

      val porWithCacheControl = cacheControl match {
        case Some(value) => por.flatMap(_.cacheControl(value).toOption)
        case None        => por
      }

      val requestBody = RequestBody.fromFile(uploadedFile.file)

      for {
        s3       <- client
        request  <- porWithCacheControl.flatMap(_.build().toOption)
        response <- s3.putObject(request, requestBody).toOption
      } yield response
    }
    .flatMap(_.toTry(unexpectedNull("putObject")))

  def putObject(
      key: String,
      stream: InputStream,
      contentLength: Long,
      contentType: String,
      cacheControl: Option[String],
  ): Try[PutObjectResponse] = {
    val por = for {
      builder <- PutObjectRequest.builder().toOption
      builder <- builder.contentLength(contentLength).toOption
      builder <- builder.contentType(contentType).toOption
      builder <- builder.key(key).toOption
      builder <- builder.bucket(bucket).toOption
    } yield builder

    val porWithCacheControl = cacheControl match {
      case Some(value) => por.flatMap(_.cacheControl(value).toOption)
      case None        => por
    }

    val requestBody = RequestBody.fromInputStream(stream, contentLength)

    Try
      .throwIfInterrupted(
        for {
          s3       <- client
          request  <- porWithCacheControl.flatMap(_.build().toOption)
          response <- s3.putObject(request, requestBody).toOption
        } yield response
      )
      .flatMap(_.toTry(unexpectedNull("putObject")))
  }

  def updateContentType(key: String, contentType: String): Try[CopyObjectResponse] = Try
    .throwIfInterrupted {
      for {
        hor         <- HeadObjectRequest.builder().toOption
        hor         <- hor.bucket(bucket).toOption
        hor         <- hor.key(key).toOption
        s3          <- client
        headRequest <- hor.build().toOption
        head        <- s3.headObject(headRequest).toOption
        cor         <- CopyObjectRequest.builder().toOption
        cor         <- cor.sourceBucket(bucket).toOption
        cor         <- cor.destinationBucket(bucket).toOption
        cor         <- cor.sourceKey(key).toOption
        cor         <- cor.destinationKey(key).toOption
        cor         <- cor.contentType(contentType).toOption
        cor         <- cor.cacheControl(head.cacheControl()).toOption
        cor         <- cor.metadataDirective(MetadataDirective.REPLACE).toOption
        copyRequest <- cor.build().toOption
        response    <- s3.copyObject(copyRequest).toOption
      } yield response
    }
    .flatMap(_.toTry(unexpectedNull("updateContentType")))

  def copyObject(fromKey: String, toKey: String): Try[CopyObjectResponse] = Try
    .throwIfInterrupted {
      for {
        builder  <- CopyObjectRequest.builder().toOption
        builder  <- builder.sourceBucket(bucket).toOption
        builder  <- builder.destinationBucket(bucket).toOption
        builder  <- builder.sourceKey(fromKey).toOption
        builder  <- builder.destinationKey(toKey).toOption
        cor      <- builder.build().toOption
        s3       <- client
        response <- s3.copyObject(cor).toOption
      } yield response
    }
    .flatMap(_.toTry(unexpectedNull("copyObject")))
}

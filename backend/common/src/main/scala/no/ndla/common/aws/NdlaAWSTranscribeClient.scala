/*
 * Part of NDLA common
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.aws

import no.ndla.common.implicits.*
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.transcribe.model.*
import software.amazon.awssdk.services.transcribe.TranscribeClient

import scala.util.{Failure, Try}

class NdlaAWSTranscribeClient(region: Option[String]) {
  lazy val client: Option[TranscribeClient] = TranscribeClient
    .builder()
    .toOption
    .flatMap { builder =>
      region match {
        case Some(value) => builder.region(Region.of(value)).toOption.flatMap(_.build().toOption)
        case None        => builder.build().toOption
      }
    }

  private def unexpectedNull(operation: String): NullPointerException =
    new NullPointerException(s"Got unexpected null value from Transcribe client during '$operation'")

  def startTranscriptionJob(
      jobName: String,
      mediaUri: String,
      mediaFormat: String,
      languageCode: String,
      outputBucket: String,
      outputKey: String,
      maxSpeakers: Int,
      includeSubtitles: Boolean = true,
      outputSubtitleFormat: String = "VTT",
  ): Try[StartTranscriptionJobResponse] = Try {
    val requestBuilder = for {
      media    <- Media.builder().toOption
      media    <- media.mediaFileUri(mediaUri).toOption
      media    <- media.build().toOption
      settings <- Settings.builder().toOption
      settings <- settings.showSpeakerLabels(true).toOption
      settings <- settings.maxSpeakerLabels(maxSpeakers).toOption
      settings <- settings.build().toOption
      builder  <- StartTranscriptionJobRequest.builder().toOption
      builder  <- builder.transcriptionJobName(jobName).toOption
      builder  <- builder.media(media).toOption
      builder  <- builder.mediaFormat(mediaFormat).toOption
      builder  <- builder.languageCode(languageCode).toOption
      builder  <- builder.outputBucketName(outputBucket).toOption
      builder  <- builder.outputKey(outputKey).toOption
      builder  <- builder.settings(settings).toOption
    } yield builder

    val toBuild =
      if (includeSubtitles) {
        for {
          builder   <- requestBuilder
          subtitles <- Subtitles.builder().toOption
          subtitles <- subtitles.formats(SubtitleFormat.valueOf(outputSubtitleFormat)).toOption
          subtitles <- subtitles.build().toOption
          builder   <- builder.subtitles(subtitles).toOption
        } yield builder
      } else {
        requestBuilder
      }

    for {
      transcribe <- client
      request    <- toBuild.flatMap(_.build().toOption)
      response   <- transcribe.startTranscriptionJob(request).toOption
    } yield response
  }.flatMap(_.toTry(unexpectedNull("startTranscriptionJob")))

  def getTranscriptionJob(jobName: String): Try[GetTranscriptionJobResponse] = {
    Try {
      for {
        builder  <- GetTranscriptionJobRequest.builder().toOption
        builder  <- builder.transcriptionJobName(jobName).toOption
        request  <- builder.build().toOption
        response <- client.flatMap(_.getTranscriptionJob(request).toOption)
      } yield response
    }.flatMap(_.toTry(unexpectedNull("getTranscriptionJob")))
      .recoverWith { case e: BadRequestException =>
        val nfe = no.ndla.common.errors.NotFoundException("Transcription job not found")
        nfe.initCause(e): Unit
        Failure(nfe)
      }
  }

  def listTranscriptionJobs(status: Option[String] = None): Try[ListTranscriptionJobsResponse] = Try {
    for {
      requestBuilder <- ListTranscriptionJobsRequest.builder().toOption
      requestBuilder <- status match {
        case Some(jobStatus) => requestBuilder.status(jobStatus).toOption
        case None            => Some(requestBuilder)
      }
      request    <- requestBuilder.build().toOption
      transcribe <- client
      response   <- transcribe.listTranscriptionJobs(request).toOption
    } yield response
  }.flatMap(_.toTry(unexpectedNull("listTranscriptionJobs")))

  def deleteTranscriptionJob(jobName: String): Try[DeleteTranscriptionJobResponse] = Try {
    for {
      builder    <- DeleteTranscriptionJobRequest.builder().toOption
      builder    <- builder.transcriptionJobName(jobName).toOption
      request    <- builder.build().toOption
      transcribe <- client
      response   <- transcribe.deleteTranscriptionJob(request).toOption
    } yield response
  }.flatMap(_.toTry(unexpectedNull("deleteTranscriptionJob")))
}

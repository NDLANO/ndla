/*
 * Part of NDLA image-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.imageapi.controller

import no.ndla.imageapi.Props
import sttp.model.{HeaderNames, StatusCode}
import sttp.tapir.*

import java.io.InputStream

case class ImageResponse(
    inputStream: InputStream,
    contentType: String,
    contentLength: String,
    contentDisposition: Option[String],
)

object ImageResponse {
  def endpointOutput(using props: Props): EndpointOutput[ImageResponse] = statusCode(StatusCode.Ok)
    .and(inputStreamBody)
    .and(headersOutput)
    .mapTo[ImageResponse]

  private[controller] def headersOutput(using props: Props): EndpointIO[(String, String, Option[String])] =
    header[String](HeaderNames.ContentType)
      .and(header[String](HeaderNames.ContentLength))
      .and(header[Option[String]](HeaderNames.ContentDisposition))
      .and(header(HeaderNames.CacheControl, props.RawControllerCacheControl))
}

case class ImageHeadResponse(contentType: String, contentLength: String, contentDisposition: Option[String])

object ImageHeadResponse {
  def endpointOutput(using props: Props): EndpointOutput[ImageHeadResponse] = statusCode(StatusCode.Ok)
    .and(ImageResponse.headersOutput)
    .mapTo[ImageHeadResponse]
}

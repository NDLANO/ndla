/*
 * Part of NDLA image-api
 * Copyright (C) 2017 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.imageapi.controller

import no.ndla.common.errors.{MissingBucketKeyException, ValidationException, ValidationMessage}
import no.ndla.imageapi.Props
import no.ndla.imageapi.model.ImageNotFoundException
import no.ndla.imageapi.model.domain.{ImageStream, ProcessableImage}
import no.ndla.imageapi.service.*
import no.ndla.network.tapir.*
import no.ndla.network.tapir.TapirUtil.errorOutputsFor
import sttp.tapir.*
import sttp.tapir.server.ServerEndpoint

import scala.util.{Failure, Success, Try, Using}

class RawController(using
    imageStorage: ImageStorageService,
    imageConverter: ImageConverter,
    errorHandling: ErrorHandling,
    readService: ReadService,
    props: Props,
) extends TapirController {
  override val serviceName: String         = "raw"
  override val prefix: EndpointInput[Unit] = "image-api" / serviceName
  override val enableSwagger: Boolean      = true

  override val endpoints: List[ServerEndpoint[Any, Eff]] = List(
    getImageById,
    headImageById,
    getImageByFileName,
    headImageByFileName,
    getImageVariantByFileName,
    headImageVariantByFileName,
  )

  private def imageByIdEndpoint = endpoint
    .in("id" / path[Long]("image_id").description("The ID of the image"))
    .in(EndpointInput.derived[ImageParams])
    .errorOut(errorOutputsFor(404))

  private def imageByFileNameEndpoint = endpoint
    .in(path[String]("image_name").description("The name of the image"))
    .in(EndpointInput.derived[ImageParams])
    .errorOut(errorOutputsFor(404))

  private def imageVariantByFileNameEndpoint = endpoint
    .in(path[String]("image_name").description("The name of the image (with file extension)").example("foobar.jpg"))
    .in(path[String]("variant_size").description("Image variant size (with file extension)").example("medium.webp"))
    .errorOut(errorOutputsFor(404))

  def getImageById: ServerEndpoint[Any, Eff] = imageByIdEndpoint
    .get
    .summary("Fetch an image with options to resize and crop")
    .description("Fetches a image with options to resize and crop")
    .out(ImageResponse.endpointOutput)
    .serverLogicPure { case (imageId, imageParams) =>
      getImageFileName(imageId, imageParams).flatMap(getImageResponse(_, imageParams))
    }

  def headImageById: ServerEndpoint[Any, Eff] = imageByIdEndpoint
    .head
    .summary("Fetch headers for an image with options to resize and crop")
    .description("Fetches the headers of an image with options to resize and crop, without the image itself")
    .out(ImageHeadResponse.endpointOutput)
    .serverLogicPure { case (imageId, imageParams) =>
      getImageFileName(imageId, imageParams).flatMap(getImageHeadResponse(_, imageParams))
    }

  def getImageByFileName: ServerEndpoint[Any, Eff] = imageByFileNameEndpoint
    .get
    .summary("Fetch an image with options to resize and crop")
    .description("Fetches a image with options to resize and crop")
    .out(ImageResponse.endpointOutput)
    .serverLogicPure(getImageResponse)

  def headImageByFileName: ServerEndpoint[Any, Eff] = imageByFileNameEndpoint
    .head
    .summary("Fetch headers for an image with options to resize and crop")
    .description("Fetches the headers of an image with options to resize and crop, without the image itself")
    .out(ImageHeadResponse.endpointOutput)
    .serverLogicPure(getImageHeadResponse)

  def getImageVariantByFileName: ServerEndpoint[Any, Eff] = imageVariantByFileNameEndpoint
    .get
    .summary("Fetch an image variant")
    .description("Fetches a specific image variant size")
    .out(ImageResponse.endpointOutput)
    .serverLogicPure { (fileName, variantName) =>
      imageStorage
        .getRaw(s"$fileName/$variantName")
        .map(s3Object => ImageResponse(s3Object.stream, s3Object.contentType, s3Object.contentLength.toString, None))
    }

  def headImageVariantByFileName: ServerEndpoint[Any, Eff] = imageVariantByFileNameEndpoint
    .head
    .summary("Fetch headers for an image variant")
    .description("Fetches the headers of a specific image variant size, without the image itself")
    .out(ImageHeadResponse.endpointOutput)
    .serverLogicPure { (fileName, variantName) =>
      imageStorage
        .getRawMetadata(s"$fileName/$variantName")
        .map(meta => ImageHeadResponse(meta.contentType, meta.contentLength.toString, None))
    }

  private def getImageFileName(imageId: Long, imageParams: ImageParams): Try[String] = readService
    .getImageFileName(imageId, imageParams.language)
    .flatMap {
      case Some(fileName) => Success(fileName)
      case None           => Failure(ImageNotFoundException(s"Image with id $imageId not found"))
    }

  private def getImageResponse(fileName: String, imageParams: ImageParams): Try[ImageResponse] = {
    val contentDisposition = imageParams.download.map(_ => "attachment")
    if (imageParams.isEmptyOrOnlyDownload) {
      imageStorage
        .getRaw(fileName)
        .map(s3Object =>
          ImageResponse(s3Object.stream, s3Object.contentType, s3Object.contentLength.toString, contentDisposition)
        )
    } else {
      getAndProcessImage(fileName, imageParams).map { imageStream =>
        ImageResponse(
          imageStream.stream,
          imageStream.contentType.toString,
          imageStream.contentLength.toString,
          contentDisposition,
        )
      }
    }
  }

  private def getImageHeadResponse(fileName: String, imageParams: ImageParams): Try[ImageHeadResponse] = {
    val contentDisposition = imageParams.download.map(_ => "attachment")
    if (imageParams.isEmptyOrOnlyDownload) {
      imageStorage
        .getRawMetadata(fileName)
        .map(meta => ImageHeadResponse(meta.contentType, meta.contentLength.toString, contentDisposition))
    } else {
      // The content length of a processed image is only known after processing it
      getAndProcessImage(fileName, imageParams).flatMap(
        Using(_) { imageStream =>
          ImageHeadResponse(imageStream.contentType.toString, imageStream.contentLength.toString, contentDisposition)
        }
      )
    }
  }

  private def getAndProcessImage(imageName: String, imageParams: ImageParams): Try[ImageStream] = {
    val dynamicCropOrResize = {
      val canDynamicCrop = canDoDynamicCrop(imageParams)
      if (canDynamicCrop) dynamicCrop
      else {
        resize
      }
    }
    val processableStream = imageStorage.get(imageName) match {
      case Success(stream: ImageStream.Processable)   => stream
      case Success(stream: ImageStream.Gif)           => return Success(stream)
      case Success(stream: ImageStream.Unprocessable) => return Success(stream)
      case Failure(ex: MissingBucketKeyException)     => return Failure(ex)
      case Failure(ex)                                =>
        logger.error(s"Failed to get image '$imageName' from S3", ex)
        return Failure(ex)
    }

    val triedStream = for {
      img                  <- ProcessableImage.fromStream(processableStream)
      cropped              <- crop(img, imageParams)
      dynamicCropOrResized <- dynamicCropOrResize(cropped, imageParams)
      stream               <- dynamicCropOrResized.toProcessableImageStream
    } yield stream

    triedStream match {
      case Success(stream)                  => Success(stream)
      case Failure(ex: ValidationException) => Failure(ex)
      case Failure(ex)                      =>
        logger.error(s"Could not crop or resize image '$imageName'", ex)
        // Return image unmodified if reading/cropping/resizing fails
        imageStorage.get(imageName)
    }
  }

  private def doubleInRange(paramName: String, double: Option[Double], from: Int, to: Int): Option[Double] = {
    double match {
      case Some(d) if d >= Math.min(from, to) && d <= Math.max(from, to) => Some(d)
      case Some(d)                                                       => throw ValidationException(errors =
          Seq(ValidationMessage(paramName, s"Invalid value for $paramName. Must be in range $from-$to but was $d"))
        )
      case None => None
    }
  }

  private def crop(image: ProcessableImage, imageParams: ImageParams): Try[ProcessableImage] = {
    val unit = imageParams.cropUnit.getOrElse("percent")
    unit match {
      case "percent" =>
        val startX = doubleInRange("cropStartX", imageParams.cropStartX, PercentPoint.MinValue, PercentPoint.MaxValue)
        val startY = doubleInRange("cropStartY", imageParams.cropStartY, PercentPoint.MinValue, PercentPoint.MaxValue)
        val endX   = doubleInRange("cropEndX", imageParams.cropEndX, PercentPoint.MinValue, PercentPoint.MaxValue)
        val endY   = doubleInRange("cropEndY", imageParams.cropEndY, PercentPoint.MinValue, PercentPoint.MaxValue)
        (startX, startY, endX, endY) match {
          case (Some(sx), Some(sy), Some(ex), Some(ey)) =>
            imageConverter.crop(image, PercentPoint(sx, sy), PercentPoint(ex, ey))
          case _ => Success(image)
        }
      case "pixel" =>
        val startX = imageParams.cropStartX.map(_.toInt)
        val startY = imageParams.cropStartY.map(_.toInt)
        val endX   = imageParams.cropEndX.map(_.toInt)
        val endY   = imageParams.cropEndY.map(_.toInt)
        (startX, startY, endX, endY) match {
          case (Some(sx), Some(sy), Some(ex), Some(ey)) =>
            imageConverter.crop(image, PixelPoint(sx, sy), PixelPoint(ex, ey))
          case _ => Success(image)
        }
    }
  }

  private def canDoDynamicCrop(imageParams: ImageParams) = {
    imageParams.focalX.isDefined && imageParams.focalY.isDefined &&
    (imageParams.width.isDefined || imageParams.height.isDefined || imageParams.ratio.isDefined)
  }

  private def dynamicCrop(image: ProcessableImage, imageParams: ImageParams): Try[ProcessableImage] = {

    (imageParams.focalX, imageParams.focalY, imageParams.width, imageParams.height) match {
      case (Some(fx), Some(fy), w, h) =>
        imageConverter.dynamicCrop(image, PercentPoint(fx, fy), w.map(_.toInt), h.map(_.toInt), imageParams.ratio)
      case _ => Success(image)
    }
  }

  private def resize(image: ProcessableImage, imageParams: ImageParams): Try[ProcessableImage] = {
    (imageParams.width, imageParams.height) match {
      case (Some(width), Some(height)) => imageConverter.resize(image, width.toInt, height.toInt)
      case (Some(width), _)            => imageConverter.resizeWidth(image, width.toInt)
      case (_, Some(height))           => imageConverter.resizeHeight(image, height.toInt)
      case _                           => Success(image)
    }
  }
}

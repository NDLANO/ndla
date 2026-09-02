/*
 * Part of NDLA image-api
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.imageapi.model

import no.ndla.common.CirceUtil
import no.ndla.imageapi.model.domain.{ImageContentType, ImageVariant, ImageVariantSize}
import no.ndla.imageapi.{TestEnvironment, UnitSuite}

class ImageVariantTest extends UnitSuite, TestEnvironment {
  test("that ImageVariantSize successfully decodes from valid JSON") {
    val json    = "\"medium\""
    val decoded = CirceUtil.tryParseAs[ImageVariantSize](json).failIfFailure
    decoded should be(ImageVariantSize.Medium)
  }

  test("that ImageVariant successfully decodes from valid JSON") {
    val json = """
        |{
        |  "size": "medium",
        |  "bucketKey": "makkapakka"
        |}
        |""".stripMargin
    val expected = ImageVariant(ImageVariantSize.Medium, "makkapakka")
    val decoded  = CirceUtil.tryParseAs[ImageVariant](json).failIfFailure
    decoded should be(expected)
  }

  test("that image files differing only by file extension do not share variant bucket keys") {
    val jpg = TestData.clownfishFileData.copy(fileName = "clownfish.jpg", contentType = ImageContentType.Jpeg)
    val png = TestData.clownfishFileData.copy(fileName = "clownfish.png", contentType = ImageContentType.Png)

    ImageVariant.fromFileName(jpg.fileName, ImageVariantSize.Medium) should be("clownfish.jpg/medium.webp")
    ImageVariant.fromFileName(png.fileName, ImageVariantSize.Medium) should be("clownfish.png/medium.webp")

    val jpgKeys = jpg.expectedVariants.map(_.bucketKey).toSet
    val pngKeys = png.expectedVariants.map(_.bucketKey).toSet
    jpgKeys should not be empty
    jpgKeys.intersect(pngKeys) should be(empty)
  }
}

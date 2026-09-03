/*
 * Part of NDLA image-api
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.imageapi.model

import no.ndla.common.CirceUtil
import no.ndla.imageapi.model.domain.{ImageContentType, ImageDimensions, ImageVariant, ImageVariantSize}
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

  test("that forDimensions includes the first size at or above the image width") {
    import ImageVariantSize.*

    // The widest size is above the image width, and is generated at the native width of 1280
    forDimensions(ImageDimensions(1280, 853)) should be(Seq(Icon, ExtraSmall, Small, Medium, Large))
    // An image exactly as wide as a size gets no redundant size above it
    forDimensions(ImageDimensions(1080, 720)) should be(Seq(Icon, ExtraSmall, Small, Medium))
    // Images narrower than every size still get a single native width variant
    forDimensions(ImageDimensions(100, 100)) should be(Seq(Icon))
    // Images at least as wide as the widest size get the full ladder
    forDimensions(ImageDimensions(2560, 1440)) should be(ImageVariantSize.values)
    forDimensions(ImageDimensions(4000, 3000)) should be(ImageVariantSize.values)
  }

  test("that forDimensions returns a ladder prefix with at most one size above the image width") {
    for (width <- 1 to 3000) {
      val sizes = ImageVariantSize.forDimensions(ImageDimensions(width, width))
      withClue(s"width = $width: ") {
        sizes should not be empty
        sizes should be(ImageVariantSize.values.take(sizes.size))
        sizes.count(_.width > width) should be <= 1
      }
    }
  }

  test("that image files differing only by file extension do not share variant bucket keys") {
    val jpg = TestData.clownfishFileData.copy(fileName = "clownfish.jpg", contentType = ImageContentType.Jpeg)
    val png = TestData.clownfishFileData.copy(fileName = "clownfish.png", contentType = ImageContentType.Png)

    ImageVariant.bucketKeyFor(jpg.fileName, ImageVariantSize.Medium) should be("clownfish.jpg/medium.webp")
    ImageVariant.bucketKeyFor(png.fileName, ImageVariantSize.Medium) should be("clownfish.png/medium.webp")

    val jpgKeys = jpg.expectedVariants.map(_.bucketKey).toSet
    val pngKeys = png.expectedVariants.map(_.bucketKey).toSet
    jpgKeys should not be empty
    jpgKeys.intersect(pngKeys) should be(empty)
  }
}

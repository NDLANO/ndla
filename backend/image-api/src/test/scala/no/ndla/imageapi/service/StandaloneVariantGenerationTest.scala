/*
 * Part of NDLA image-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.imageapi.service

import no.ndla.common.errors.MissingBucketKeyException
import no.ndla.database.DBUtility
import no.ndla.imageapi.model.domain.*
import no.ndla.imageapi.{TestEnvironment, UnitSuite}
import no.ndla.scalatestsuite.DBUtilityStub
import org.mockito.ArgumentMatchers.{any, eq as eqTo}
import org.mockito.Mockito.*

import scala.util.{Failure, Success}

class StandaloneVariantGenerationTest extends UnitSuite with TestEnvironment {
  override implicit lazy val dbUtility: DBUtility       = DBUtilityStub()
  override implicit lazy val writeService: WriteService = WriteService()
  val standaloneVariantGeneration                       =
    StandaloneVariantGeneration(imageConverter, writeService, imageStorage, imageRepository, dbUtility)

  override def beforeEach(): Unit = {
    reset(imageRepository, imageStorage)
    when(imageRepository.update(any, any)(using any)).thenAnswer(i => Success(i.getArgument(0)))
    when(imageStorage.deleteObjects(any)).thenReturn(Success(()))
    when(imageStorage.uploadFromStream(any, any, any, any)).thenAnswer(i => Success(i.getArgument(0)))
  }

  private def withChangedFileStem(original: ImageFileData, newFileStem: String): ImageFileData = {
    val newFileName = s"$newFileStem${original.contentType.fileEndings.head}"
    original.copy(
      fileName = newFileName,
      variants = original.variants.map(v => v.copy(bucketKey = s"$newFileName/${v.sizeName}.webp")),
    )
  }

  private def withOutdatedVariantKeys(original: ImageFileData): ImageFileData = original.copy(variants =
    original.variants.map(v => v.copy(bucketKey = s"${original.getFileStem}/${v.sizeName}.webp"))
  )

  test("MissingOnly should generate variants only for image files without variants") {
    val withVariants        = TestData.clownfishFileDataWithVariants.copy(language = "nb")
    val expectedNewFileData =
      withChangedFileStem(TestData.clownfishFileDataWithVariants.copy(language = "en"), "clownfish2")
    val withoutVariants    = expectedNewFileData.copy(variants = Seq.empty)
    val meta               = TestData.clownfish.copy(images = Seq(withVariants, withoutVariants))
    val expectedMetaUpdate = TestData.clownfish.copy(images = Seq(withVariants, expectedNewFileData))

    when(imageRepository.getImageMetaBatched(any)).thenReturn(Success(Iterator.single(Seq(meta))))
    when(imageStorage.getRaw(eqTo(withoutVariants.fileName))).thenReturn(Success(TestData.clownfishS3Object))

    standaloneVariantGeneration.generateVariantsForExistingImages(ImageVariantGenerationMode.MissingOnly).get

    expectedNewFileData
      .variants
      .foreach { case ImageVariant(_, key) =>
        verify(imageStorage, times(1)).uploadFromStream(eqTo(key), any, any, any)
      }
    verify(imageRepository, times(1)).update(eqTo(expectedMetaUpdate), eqTo(expectedMetaUpdate.id.get))(using any)
  }

  test("MissingOnly should generate variants for image files with partial variants") {
    val allVariants     = TestData.clownfishFileDataWithVariants
    val partialVariants = allVariants.copy(variants = allVariants.variants.take(1))
    val meta            = TestData.clownfish.copy(images = Seq(partialVariants))
    val expectedUpdate  = TestData.clownfish.copy(images = Seq(allVariants))

    when(imageRepository.getImageMetaBatched(any)).thenReturn(Success(Iterator.single(Seq(meta))))
    when(imageStorage.getRaw(eqTo(partialVariants.fileName))).thenReturn(Success(TestData.clownfishS3Object))

    standaloneVariantGeneration.generateVariantsForExistingImages(ImageVariantGenerationMode.MissingOnly).get

    allVariants
      .variants
      .foreach { case ImageVariant(_, key) =>
        verify(imageStorage, times(1)).uploadFromStream(eqTo(key), any, any, any)
      }
    verify(imageRepository, times(1)).update(eqTo(expectedUpdate), eqTo(expectedUpdate.id.get))(using any)
  }

  test("ReplaceAll should regenerate all processable image files and delete obsolete variant keys") {
    val expectedFirst      = withChangedFileStem(TestData.clownfishFileDataWithVariants.copy(language = "nb"), "clownfish1")
    val expectedSecond     = withChangedFileStem(TestData.clownfishFileDataWithVariants.copy(language = "en"), "clownfish2")
    val expectedMetaUpdate = TestData.clownfish.copy(images = Seq(expectedFirst, expectedSecond))
    val markerVariants1    = Seq(ImageVariant(ImageVariantSize.Small, s"${expectedFirst.fileName}/marker1.webp"))
    val markerVariants2    = Seq(ImageVariant(ImageVariantSize.Small, s"${expectedSecond.fileName}/marker2.webp"))
    val first              = expectedFirst.copy(variants = markerVariants1)
    val second             = expectedSecond.copy(variants = markerVariants2)
    val meta               = TestData.clownfish.copy(images = Seq(first, second))

    when(imageRepository.getImageMetaBatched(any)).thenReturn(Success(Iterator.single(Seq(meta))))
    when(imageStorage.getRaw(eqTo(first.fileName))).thenReturn(Success(TestData.clownfishS3Object))
    when(imageStorage.getRaw(eqTo(second.fileName))).thenReturn(Success(TestData.clownfishS3Object))

    standaloneVariantGeneration.generateVariantsForExistingImages(ImageVariantGenerationMode.ReplaceAll).get

    Seq(expectedFirst.variants, expectedSecond.variants).foreach(variants =>
      variants.foreach { case ImageVariant(_, key) =>
        verify(imageStorage, times(1)).uploadFromStream(eqTo(key), any, any, any)
      }
    )
    verify(imageRepository, times(1)).update(eqTo(expectedMetaUpdate), eqTo(expectedMetaUpdate.id.get))(using any)
    verify(imageStorage, times(1)).deleteObjects(eqTo(markerVariants1.concat(markerVariants2).map(_.bucketKey)))
  }

  test("should skip non-processable content types") {
    val gifFile = TestData.clownfishFileData.copy(contentType = ImageContentType.Gif)
    val meta    = TestData.clownfish.copy(images = Seq(gifFile))

    for {
      mode <- Seq(ImageVariantGenerationMode.ReplaceAll, ImageVariantGenerationMode.MissingOnly)
    } do {
      reset(imageRepository, imageStorage)
      when(imageRepository.getImageMetaBatched(any)).thenReturn(Success(Iterator.single(Seq(meta))))
      when(imageRepository.update(any, any)(using any)).thenAnswer(i => Success(i.getArgument(0)))

      standaloneVariantGeneration.generateVariantsForExistingImages(mode).get

      verify(imageRepository, times(1)).getImageMetaBatched(any)
      verify(imageRepository, times(1)).update(eqTo(meta), eqTo(meta.id.get))(using any)
      verifyNoMoreInteractions(imageRepository)
      verifyNoInteractions(imageStorage)
    }
  }

  test("should ignore missing bucket objects when ignoreMissingObjects is true") {
    val fileData = TestData.clownfishFileData
    val meta     = TestData.clownfish.copy(images = Seq(fileData))

    for {
      mode <- Seq(ImageVariantGenerationMode.ReplaceAll, ImageVariantGenerationMode.MissingOnly)
    } do {
      reset(imageRepository, imageStorage)
      when(imageRepository.getImageMetaBatched(any)).thenReturn(Success(Iterator.single(Seq(meta))))
      when(imageRepository.update(any, any)(using any)).thenAnswer(i => Success(i.getArgument(0)))
      when(imageStorage.getRaw(eqTo(fileData.fileName))).thenReturn(
        Failure(MissingBucketKeyException(fileData.fileName))
      )

      standaloneVariantGeneration.generateVariantsForExistingImages(ImageVariantGenerationMode.MissingOnly).get

      verify(imageStorage, times(1)).getRaw(eqTo(fileData.fileName))
      verify(imageRepository, times(1)).update(eqTo(meta), eqTo(meta.id.get))(using any)
      verify(imageStorage, never).uploadFromStream(any, any, any, any)
    }
  }

  test("generation should not fail if obsolete variant cleanup fails") {
    val expectedFileData   = TestData.clownfishFileDataWithVariants
    val markerVariants     = Seq(ImageVariant(ImageVariantSize.Small, s"${expectedFileData.fileName}/marker.webp"))
    val fileData           = expectedFileData.copy(variants = markerVariants)
    val meta               = TestData.clownfish.copy(images = Seq(fileData))
    val storageException   = RuntimeException("cleanup failed")
    val expectedMetaUpdate = meta.copy(images = Seq(expectedFileData))

    when(imageRepository.getImageMetaBatched(any)).thenReturn(Success(Iterator.single(Seq(meta))))
    when(imageStorage.getRaw(eqTo(fileData.fileName))).thenReturn(Success(TestData.clownfishS3Object))
    when(imageStorage.deleteObjects(any)).thenReturn(Failure(storageException))

    standaloneVariantGeneration.generateVariantsForExistingImages(ImageVariantGenerationMode.ReplaceAll).get

    expectedFileData
      .variants
      .foreach { case ImageVariant(_, key) =>
        verify(imageStorage, times(1)).uploadFromStream(eqTo(key), any, any, any)
      }
    verify(imageRepository, times(1)).update(eqTo(expectedMetaUpdate), eqTo(expectedMetaUpdate.id.get))(using any)
    verify(imageStorage, times(1)).deleteObjects(eqTo(markerVariants.map(_.bucketKey)))
  }

  test("MissingOnly should regenerate variants stored under outdated bucket keys") {
    val expectedFileData = TestData.clownfishFileDataWithVariants
    val fileData         = withOutdatedVariantKeys(expectedFileData)
    val meta             = TestData.clownfish.copy(images = Seq(fileData))
    val expectedUpdate   = TestData.clownfish.copy(images = Seq(expectedFileData))

    when(imageRepository.getImageMetaBatched(any)).thenReturn(Success(Iterator.single(Seq(meta))))
    when(imageStorage.getRaw(eqTo(fileData.fileName))).thenReturn(Success(TestData.clownfishS3Object))

    standaloneVariantGeneration.generateVariantsForExistingImages(ImageVariantGenerationMode.MissingOnly).get

    expectedFileData
      .variants
      .foreach { case ImageVariant(_, key) =>
        verify(imageStorage, times(1)).uploadFromStream(eqTo(key), any, any, any)
      }
    verify(imageRepository, times(1)).update(eqTo(expectedUpdate), eqTo(expectedUpdate.id.get))(using any)
  }

  test("ReplaceAll should not delete outdated variant keys, since they may be shared with other image files") {
    val expectedFileData = TestData.clownfishFileDataWithVariants
    val fileData         = withOutdatedVariantKeys(expectedFileData)
    val meta             = TestData.clownfish.copy(images = Seq(fileData))
    val expectedUpdate   = TestData.clownfish.copy(images = Seq(expectedFileData))

    when(imageRepository.getImageMetaBatched(any)).thenReturn(Success(Iterator.single(Seq(meta))))
    when(imageStorage.getRaw(eqTo(fileData.fileName))).thenReturn(Success(TestData.clownfishS3Object))

    standaloneVariantGeneration.generateVariantsForExistingImages(ImageVariantGenerationMode.ReplaceAll).get

    verify(imageRepository, times(1)).update(eqTo(expectedUpdate), eqTo(expectedUpdate.id.get))(using any)
    verify(imageStorage, never).deleteObjects(any)
  }

  test("CleanupLegacyKeys should delete legacy variant keys that are no longer referenced") {
    val migrated            = TestData.clownfishFileDataWithVariants
    val meta                = TestData.clownfish.copy(images = Seq(migrated))
    val expectedDeletedKeys = ImageVariantSize.values.map(size => s"${migrated.getFileStem}/${size.entryName}.webp")

    when(imageRepository.getImageMetaBatched(any)).thenAnswer(_ => Success(Iterator.single(Seq(meta))))

    standaloneVariantGeneration.run(ImageVariantGenerationMode.CleanupLegacyKeys).get

    verify(imageStorage, times(1)).deleteObjects(eqTo(expectedDeletedKeys))
    verify(imageStorage, never).uploadFromStream(any, any, any, any)
    verify(imageRepository, never).update(any, any)(using any)
  }

  test("CleanupLegacyKeys should not delete legacy keys that are still referenced by another image file") {
    val migrated   = TestData.clownfishFileDataWithVariants
    val unmigrated =
      withOutdatedVariantKeys(migrated.copy(fileName = "clownfish.png", contentType = ImageContentType.Png))
    val migratedMeta         = TestData.clownfish.copy(id = Some(1), images = Seq(migrated))
    val unmigratedMeta       = TestData.clownfish.copy(id = Some(2), images = Seq(unmigrated))
    val referencedLegacyKeys = unmigrated.variants.map(_.bucketKey)
    val expectedDeletedKeys  = ImageVariantSize
      .values
      .map(size => s"${migrated.getFileStem}/${size.entryName}.webp")
      .filterNot(referencedLegacyKeys.contains)

    when(imageRepository.getImageMetaBatched(any)).thenAnswer(_ =>
      Success(Iterator.single(Seq(migratedMeta, unmigratedMeta)))
    )

    standaloneVariantGeneration.run(ImageVariantGenerationMode.CleanupLegacyKeys).get

    referencedLegacyKeys should not be empty
    expectedDeletedKeys should not be empty
    verify(imageStorage, times(1)).deleteObjects(eqTo(expectedDeletedKeys))
  }

  test("CleanupLegacyKeys should not delete the keys of an image file without a file extension") {
    val migrated      = TestData.clownfishFileDataWithVariants
    val extensionless = withOutdatedVariantKeys(migrated.copy(fileName = "clownfish"))
    val meta          = TestData.clownfish.copy(images = Seq(migrated, extensionless))
    // An image file without a file extension keeps the same keys, so its file stem based keys are still in use
    val expectedDeletedKeys = ImageVariantSize
      .values
      .map(size => s"${migrated.getFileStem}/${size.entryName}.webp")
      .filterNot(extensionless.variants.map(_.bucketKey).contains)

    when(imageRepository.getImageMetaBatched(any)).thenAnswer(_ => Success(Iterator.single(Seq(meta))))

    standaloneVariantGeneration.run(ImageVariantGenerationMode.CleanupLegacyKeys).get

    extensionless.variants.map(_.bucketKey) should be(extensionless.expectedVariants.map(_.bucketKey))
    expectedDeletedKeys should not be empty
    verify(imageStorage, times(1)).deleteObjects(eqTo(expectedDeletedKeys))
    verify(imageStorage, never).deleteObject(any)
  }
}

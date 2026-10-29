/*
 * Part of NDLA draft-api
 * Copyright (C) 2018 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.draftapi.service
import no.ndla.draftapi.{TestEnvironment, UnitSuite}
import org.mockito.ArgumentCaptor
import no.ndla.testbase.NullSafeMockito
import no.ndla.testbase.NullSafeMockito.{any, reset, verify, when}

class FileStorageServiceTest extends UnitSuite with TestEnvironment {
  override lazy val fileStorage = new FileStorageService

  override def beforeEach(): Unit = reset(s3Client)

  test("That objectExists returns true when file exists") {
    val argumentCaptor: ArgumentCaptor[String] = ArgumentCaptor.forClass(classOf[String]).nn
    when(s3Client.objectExists(any)).thenReturn(true)

    fileStorage.resourceExists("existingKey") should be(true)

    verify(s3Client).objectExists(NullSafeMockito.capture(argumentCaptor))
    argumentCaptor.getValue.nn should be("resources/existingKey")
  }

  test("That objectExists returns false when file does not exist") {
    when(s3Client.objectExists(any[String])).thenReturn(false)
    val argumentCaptor: ArgumentCaptor[String] = ArgumentCaptor.forClass(classOf[String]).nn

    fileStorage.resourceExists("nonExistingKey") should be(false)

    verify(s3Client).objectExists(NullSafeMockito.capture(argumentCaptor))
    argumentCaptor.getValue.nn should be("resources/nonExistingKey")
  }
}

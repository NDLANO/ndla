/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import java.net.URI
import no.ndla.taxonomy.TestUtils
import no.ndla.taxonomy.rest.v1.dtos.RelevanceDTO
import no.ndla.taxonomy.service.dtos.TranslationDTO
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class RelevanceTranslationsTest : RestTest() {

  @Test
  fun can_get_all_relevances() {
    val response = testUtils.getResource("/v1/relevances?language=nb")
    val relevances = testUtils.getObject(Array<RelevanceDTO>::class.java, response)

    assertEquals(2, relevances.size)
    TestUtils.assertAnyTrue(relevances) { s -> "Kjernestoff" == s.name }
    TestUtils.assertAnyTrue(relevances) { s -> "Tilleggsstoff" == s.name }
  }

  @Test
  fun can_get_single_relevance() {
    val relevanceDTO = getRelevanceDTO(URI.create("urn:relevance:core"), "nb")
    assertEquals("Kjernestoff", relevanceDTO.name)
  }

  @Test
  fun fallback_to_default_language() {
    val relevance = getRelevanceDTO(URI.create("urn:relevance:core"), "XX")
    assertEquals("Kjernestoff", relevance.name)
  }

  @Test
  fun can_get_all_translations() {
    val id = URI.create("urn:relevance:core")
    val translations =
        testUtils.getObject(
            Array<TranslationDTO>::class.java,
            testUtils.getResource("/v1/relevances/$id/translations"),
        )

    assertEquals(4, translations.size)
    TestUtils.assertAnyTrue(translations) { t -> "Kjernestoff" == t.name && "nb" == t.language }
    TestUtils.assertAnyTrue(translations) { t -> "Core content" == t.name && "en" == t.language }
    TestUtils.assertAnyTrue(translations) { t -> "Kjernestoff" == t.name && "nn" == t.language }
    TestUtils.assertAnyTrue(translations) { t -> "Guovddášávnnas" == t.name && "se" == t.language }
  }

  @Test
  fun can_get_single_translation() {
    val id = URI.create("urn:relevance:core")
    val translation =
        testUtils.getObject(
            TranslationDTO::class.java,
            testUtils.getResource("/v1/relevances/$id/translations/nb"),
        )

    assertEquals("Kjernestoff", translation.name)
    assertEquals("nb", translation.language)
  }

  private fun getRelevanceDTO(id: URI, language: String): RelevanceDTO {
    var path = "/v1/relevances/$id"
    if (language.isNotEmpty()) path = "$path?language=$language"
    return testUtils.getObject(RelevanceDTO::class.java, testUtils.getResource(path))
  }
}

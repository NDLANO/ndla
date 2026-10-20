/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import no.ndla.taxonomy.TestUtils
import no.ndla.taxonomy.rest.v1.dtos.RelevanceDTO
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class RelevancesTest : RestTest() {

  @Test
  fun can_get_a_single_relevance() {
    val response = testUtils.getResource("/v1/relevances/" + "urn:relevance:core")
    val relevance = testUtils.getObject(RelevanceDTO::class.java, response)

    assertEquals("Kjernestoff", relevance.name)
  }

  @Test
  fun can_get_all_relevances() {
    val response = testUtils.getResource("/v1/relevances")
    val relevances = testUtils.getObject(Array<RelevanceDTO>::class.java, response)

    assertEquals(2, relevances.size)
    TestUtils.assertAnyTrue(relevances) { f -> "Kjernestoff" == f.name }
    TestUtils.assertAnyTrue(relevances) { f -> "Tilleggsstoff" == f.name }
  }

  @Test
  fun get_unknown_relevance_fails_gracefully() {
    testUtils.getResource("/v1/relevances/nonexistantid", status().isNotFound())
  }
}

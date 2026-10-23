/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import no.ndla.taxonomy.domain.NodeConnection
import no.ndla.taxonomy.domain.Relevance
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class RankableConnectionUpdaterTest {
  private fun verifyOrder(list: List<NodeConnection>, expectedOrder: List<String>) {
    assertEquals(expectedOrder.size, list.size)

    for (index in expectedOrder.indices) {
      assertEquals(expectedOrder[index], list[index].publicId.toString())
    }
  }

  @Test
  fun rank() {
    val relevance = Relevance.CORE

    val rankable1 = NodeConnection("urn:1", relevance, 0)
    val rankable2 = NodeConnection("urn:2", relevance, 1)
    val rankable3 = NodeConnection("urn:3", relevance, 10)
    val rankable4 = NodeConnection("urn:4", relevance, 11)
    val rankable5 = NodeConnection("urn:5", relevance, 12)
    val rankable6 = NodeConnection("urn:6", relevance, 20)
    val rankable7 = NodeConnection("urn:7", relevance, 100)
    val rankable8 = NodeConnection("urn:8", relevance, 1000)

    var rankableList: List<NodeConnection> = ArrayList()

    rankableList = RankableConnectionUpdater.rank(rankableList, rankable1, 0)
    rankableList = RankableConnectionUpdater.rank(rankableList, rankable2, 1)
    rankableList = RankableConnectionUpdater.rank(rankableList, rankable3, 10)
    rankableList = RankableConnectionUpdater.rank(rankableList, rankable4, 11)
    rankableList = RankableConnectionUpdater.rank(rankableList, rankable5, 12)
    rankableList = RankableConnectionUpdater.rank(rankableList, rankable6, 20)
    rankableList = RankableConnectionUpdater.rank(rankableList, rankable7, 100)

    assertEquals(0, rankable1.rank)
    assertEquals(1, rankable2.rank)
    assertEquals(10, rankable3.rank)
    assertEquals(11, rankable4.rank)
    assertEquals(12, rankable5.rank)
    assertEquals(20, rankable6.rank)
    assertEquals(100, rankable7.rank)
    assertEquals(1000, rankable8.rank)

    verifyOrder(rankableList, listOf("urn:1", "urn:2", "urn:3", "urn:4", "urn:5", "urn:6", "urn:7"))

    rankableList = RankableConnectionUpdater.rank(rankableList, rankable3, 0)
    verifyOrder(rankableList, listOf("urn:3", "urn:1", "urn:2", "urn:4", "urn:5", "urn:6", "urn:7"))

    assertEquals(1, rankable1.rank)
    assertEquals(2, rankable2.rank)
    assertEquals(0, rankable3.rank)
    assertEquals(11, rankable4.rank)
    assertEquals(12, rankable5.rank)
    assertEquals(20, rankable6.rank)
    assertEquals(100, rankable7.rank)
    assertEquals(1000, rankable8.rank)

    rankableList = RankableConnectionUpdater.rank(rankableList, rankable2, 200)
    verifyOrder(rankableList, listOf("urn:3", "urn:1", "urn:4", "urn:5", "urn:6", "urn:7", "urn:2"))

    assertEquals(1, rankable1.rank)
    assertEquals(200, rankable2.rank)
    assertEquals(0, rankable3.rank)
    assertEquals(11, rankable4.rank)
    assertEquals(12, rankable5.rank)
    assertEquals(20, rankable6.rank)
    assertEquals(100, rankable7.rank)
    assertEquals(1000, rankable8.rank)

    rankableList = RankableConnectionUpdater.rank(rankableList, rankable2, 11)
    verifyOrder(rankableList, listOf("urn:3", "urn:1", "urn:2", "urn:4", "urn:5", "urn:6", "urn:7"))

    assertEquals(1, rankable1.rank)
    assertEquals(11, rankable2.rank)
    assertEquals(0, rankable3.rank)
    assertEquals(12, rankable4.rank)
    assertEquals(13, rankable5.rank)
    assertEquals(20, rankable6.rank)
    assertEquals(100, rankable7.rank)
    assertEquals(1000, rankable8.rank)

    rankableList = RankableConnectionUpdater.rank(rankableList, rankable8, 11)
    verifyOrder(
        rankableList,
        listOf("urn:3", "urn:1", "urn:8", "urn:2", "urn:4", "urn:5", "urn:6", "urn:7"),
    )

    assertEquals(1, rankable1.rank)
    assertEquals(12, rankable2.rank)
    assertEquals(0, rankable3.rank)
    assertEquals(13, rankable4.rank)
    assertEquals(14, rankable5.rank)
    assertEquals(20, rankable6.rank)
    assertEquals(100, rankable7.rank)
    assertEquals(11, rankable8.rank)
  }

  @Test
  fun rank_cascading() {
    val relevance = Relevance.CORE

    val rankable1 = NodeConnection("urn:1", relevance, 0)
    val rankable2 = NodeConnection("urn:2", relevance, 1)
    val rankable3 = NodeConnection("urn:3", relevance, 10)
    val rankable4 = NodeConnection("urn:4", relevance, 10)
    val rankable5 = NodeConnection("urn:5", relevance, 10)
    val rankable6 = NodeConnection("urn:6", relevance, 10)
    val rankable7 = NodeConnection("urn:7", relevance, 13)
    val rankable8 = NodeConnection("urn:8", relevance, 20)

    var rankableList =
        listOf(
            rankable1,
            rankable2,
            rankable3,
            rankable4,
            rankable5,
            rankable6,
            rankable7,
            rankable8,
        )

    assertEquals(0, rankable1.rank)
    assertEquals(1, rankable2.rank)
    assertEquals(10, rankable3.rank)
    assertEquals(10, rankable4.rank)
    assertEquals(10, rankable5.rank)
    assertEquals(10, rankable6.rank)
    assertEquals(13, rankable7.rank)
    assertEquals(20, rankable8.rank)

    verifyOrder(
        rankableList,
        listOf("urn:1", "urn:2", "urn:3", "urn:4", "urn:5", "urn:6", "urn:7", "urn:8"),
    )

    rankableList = RankableConnectionUpdater.rank(rankableList, rankable5, 10)
    verifyOrder(
        rankableList,
        listOf("urn:1", "urn:2", "urn:5", "urn:3", "urn:4", "urn:6", "urn:7", "urn:8"),
    )

    assertEquals(0, rankable1.rank)
    assertEquals(1, rankable2.rank)
    assertEquals(11, rankable3.rank)
    assertEquals(12, rankable4.rank)
    assertEquals(10, rankable5.rank)
    assertEquals(13, rankable6.rank)
    assertEquals(14, rankable7.rank)
    assertEquals(20, rankable8.rank)
  }
}

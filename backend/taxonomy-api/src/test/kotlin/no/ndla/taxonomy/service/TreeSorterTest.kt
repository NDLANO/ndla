/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class TreeSorterTest {
  @Test
  fun sortList() {
    val sorter = TreeSorter()

    val l1a = TestSortable(null, URI("urn:l1a"), 1)
    val l1b = TestSortable(null, URI("urn:l1b"), 2)
    val l1c = TestSortable(null, URI("urn:l1c"), 3)
    val l1d = TestSortable(null, URI("urn:l1d"), 4)

    val l1a2a = TestSortable(URI("urn:l1a"), URI("urn:l1a2a"), 1)
    val l1a2b = TestSortable(URI("urn:l1a"), URI("urn:l1a2b"), 2)
    val l1c2a = TestSortable(URI("urn:l1c"), URI("urn:l1c2a"), 1)
    val l1c2b = TestSortable(URI("urn:l1c"), URI("urn:l1c2b"), 2)

    val l1c2b3a = TestSortable(URI("urn:l1c2b"), URI("urn:l1c2b3a"), 1)
    val l1c2b3b = TestSortable(URI("urn:l1c2b"), URI("urn:l1c2b3b"), 2)

    // Adding in any order to a collection (sorted or not) and sending for sorting must return a
    // sorted list
    val sortedList =
        sorter.sortList(setOf(l1c2b3b, l1a2b, l1c, l1c2b, l1c2b3a, l1a, l1b, l1c2a, l1d, l1a2a))

    assertEquals(10, sortedList.size)
    assertEquals("urn:l1a", sortedList[0].sortableId.toString())
    assertEquals("urn:l1a2a", sortedList[1].sortableId.toString())
    assertEquals("urn:l1a2b", sortedList[2].sortableId.toString())
    assertEquals("urn:l1b", sortedList[3].sortableId.toString())
    assertEquals("urn:l1c", sortedList[4].sortableId.toString())
    assertEquals("urn:l1c2a", sortedList[5].sortableId.toString())
    assertEquals("urn:l1c2b", sortedList[6].sortableId.toString())
    assertEquals("urn:l1c2b3a", sortedList[7].sortableId.toString())
    assertEquals("urn:l1c2b3b", sortedList[8].sortableId.toString())
    assertEquals("urn:l1d", sortedList[9].sortableId.toString())
  }

  @JvmRecord
  private data class TestSortable(val parentId: URI?, val id: URI, val rank: Int) :
      TreeSorter.Sortable {
    override val sortableRank: Int
      get() = rank

    override val sortableId: URI
      get() = id

    override val sortableParentId: URI?
      get() = parentId
  }
}

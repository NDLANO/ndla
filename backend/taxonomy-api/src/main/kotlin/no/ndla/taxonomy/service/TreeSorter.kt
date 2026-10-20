/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import com.fasterxml.jackson.annotation.JsonIgnore
import java.net.URI
import org.springframework.stereotype.Component

@Component
class TreeSorter {
  private fun <T : Sortable> addElements(
      elementsToAddFrom: Map<URI?, Collection<T>>,
      parentId: URI?,
  ): List<T> {
    val itemsToAdd = ArrayList<T>()

    elementsToAddFrom
        .getOrDefault(parentId, listOf())
        .sortedWith(Comparator.comparingInt(Sortable::sortableRank))
        .forEach { element ->
          itemsToAdd.add(element)
          itemsToAdd.addAll(addElements(elementsToAddFrom, element.sortableId))
        }

    return itemsToAdd
  }

  /**
   * Sorts all elements by tree structure and rank at each level
   *
   * <p>
   * 1 (rank 2) - 1:2-1 (rank 0) - 1:2:3-1 (rank 2) - 1:2:3-2 (rank 1) - 1:2-2 (rank 1) 2 (rank 1)
   *
   * <p>
   * Becomes a flat list of
   *
   * <p>
   * 2 1 1:2-1 1:2:3-2 1:2:3-1 1:2-2
   *
   * @param elements Elements to sort
   * @return sorted flat list
   */
  fun <T : Sortable> sortList(elements: Collection<T>): List<T> {
    val elementsByParent = HashMap<URI?, MutableCollection<T>>()

    elements.forEach { element ->
      var foundParent = false
      if (element.sortableParentId != null) {
        for (element2 in elements) {
          if (element2.sortableId == element.sortableParentId) {
            foundParent = true
          }
        }
      }

      val parentId = if (!foundParent) null else element.sortableParentId

      elementsByParent.getOrPut(parentId) { ArrayList() }.add(element)
    }

    return addElements(elementsByParent, null)
  }

  interface Sortable {
    @get:JsonIgnore val sortableRank: Int

    @get:JsonIgnore val sortableId: URI

    @get:JsonIgnore val sortableParentId: URI?
  }
}

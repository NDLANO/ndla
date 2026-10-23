/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class LanguageFieldTest {

  @Test
  fun test_create_language_field() {
    val languageField = LanguageField<String>()
    assertEquals(0, languageField.size)
  }

  @Test
  fun test_create_language_field_from_node() {
    val node = Node(NodeType.NODE)
    node.name = "Name"
    node.addTranslation("Name", "nb")

    val languageField = LanguageField.fromNode(node)
    assertEquals(1, languageField.size)
    assertEquals("Name", languageField["nb"])
  }

  @Test
  fun test_create_language_field_list_from_node() {
    val node = Node(NodeType.NODE)
    node.name = "Name"
    node.addTranslation("Name", "nb")

    val languageField = LanguageField.listFromNode(node)
    assertEquals(1, languageField.size)
    assertEquals(listOf("Name"), languageField["nb"])
  }

  @Test
  fun test_create_language_field_list_from_old_list_and_node() {
    val node = Node(NodeType.NODE)
    node.name = "Name"
    node.addTranslation("Name", "nb")

    val node2 = Node(NodeType.NODE)
    node2.name = "Name 2"
    node2.addTranslation("Name 2", "nb")

    val languageField =
        LanguageField.listFromLists(LanguageField.listFromNode(node), LanguageField.fromNode(node2))
    assertEquals(1, languageField.size)
    assertEquals(listOf("Name", "Name 2"), languageField["nb"])
  }

  @Test
  fun test_create_language_field_list_without_changing_original_list() {
    val node = Node(NodeType.NODE)
    node.name = "Name"
    node.addTranslation("Name", "nb")

    val node2 = Node(NodeType.NODE)
    node2.name = "Name 2"
    node2.addTranslation("Name 2", "nb")

    val node3 = Node(NodeType.NODE)
    node3.name = "Name 3"
    node3.addTranslation("Name 3", "nb")

    val languageField =
        LanguageField.listFromLists(LanguageField.listFromNode(node), LanguageField.fromNode(node2))
    assertEquals(1, languageField.size)
    assertEquals(listOf("Name", "Name 2"), languageField["nb"])

    val updatedLanguageField =
        LanguageField.listFromLists(languageField, LanguageField.fromNode(node3))
    assertEquals(1, updatedLanguageField.size)
    assertEquals(listOf("Name", "Name 2", "Name 3"), updatedLanguageField["nb"])
    // original list not updated
    assertEquals(listOf("Name", "Name 2"), languageField["nb"])
  }

  @Test
  fun test_create_language_field_list_with_complete_crumbs() {
    val node = Node(NodeType.NODE)
    node.name = "Name"
    node.addTranslation("Name nb", "nb")
    node.addTranslation("Name nn", "nn")

    val node2 = Node(NodeType.NODE)
    node2.name = "Name 2"
    node2.addTranslation("Name 2 nb", "nb")
    node2.addTranslation("Name 2 en", "en")

    val languageField =
        LanguageField.listFromLists(LanguageField.listFromNode(node), LanguageField.fromNode(node2))
    assertEquals(3, languageField.size)
    assertEquals(listOf("Name nb", "Name 2 nb"), languageField["nb"])
    assertEquals(listOf("Name nn", "Name 2 nb"), languageField["nn"])
    assertEquals(listOf("Name nb", "Name 2 en"), languageField["en"])

    val node3 = Node(NodeType.NODE)
    node3.name = "Name 3"
    node3.addTranslation("Name 3 se", "se")

    val languageField2 = LanguageField.listFromLists(languageField, LanguageField.fromNode(node3))
    assertEquals(4, languageField2.size)
    assertEquals(listOf("Name nb", "Name 2 nb", "Name 3"), languageField2["nb"])
    assertEquals(listOf("Name nn", "Name 2 nb", "Name 3"), languageField2["nn"])
    assertEquals(listOf("Name nb", "Name 2 en", "Name 3"), languageField2["en"])
    assertEquals(listOf("Name nb", "Name 2 nb", "Name 3 se"), languageField2["se"])
  }
}

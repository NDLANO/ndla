/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1

import java.net.URI
import no.ndla.taxonomy.TestUtils
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.ResourceType
import no.ndla.taxonomy.rest.v1.dtos.TranslationPUT
import no.ndla.taxonomy.service.dtos.NodeChildDTO
import no.ndla.taxonomy.service.dtos.NodeDTO
import no.ndla.taxonomy.service.dtos.TranslationDTO
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

class NodeTranslationsTest : RestTest() {

  @Test
  fun can_get_all_nodes() {
    builder.node(NodeType.NODE) { t ->
      t.name("Trigonometry").translation("nb") { l -> l.name("Trigonometri") }
    }
    builder.node(NodeType.NODE) { t ->
      t.name("Integration").translation("nb") { l -> l.name("Integrasjon") }
    }

    val response = testUtils.getResource("/v1/nodes?language=nb")
    val nodes = testUtils.getObject(Array<NodeDTO>::class.java, response)

    assertEquals(2, nodes.size)
    TestUtils.assertAnyTrue(nodes) { s -> "Trigonometri" == s.name }
    TestUtils.assertAnyTrue(nodes) { s -> "Integrasjon" == s.name }
    TestUtils.assertAllTrue(nodes) { s -> "nb" == s.language }
  }

  @Test
  fun can_get_single_node() {
    val id =
        builder
            .node(NodeType.NODE) { t ->
              t.name("Trigonometry").translation("nb") { l -> l.name("Trigonometri") }
            }
            .publicId

    val topic = getNode(id, "nb")
    assertEquals("Trigonometri", topic.name)
  }

  @Test
  fun fallback_to_default_language_if_no_translation() {
    val id = builder.node(NodeType.TOPIC) { t -> t.name("Trigonometry") }.publicId
    val topic = getNode(id, "XX")
    assertEquals("Trigonometry", topic.name)
    // assertEquals("nb", topic.getLanguage());
  }

  @Test
  fun fallback_to_translated_name() {
    val id =
        builder
            .node(NodeType.TOPIC) { t -> t.name("Trignometri").translation("Trignometry", "en") }
            .publicId
    val topic = getNode(id, "nb")
    // assertEquals("Trignometry", topic.getName());
    assertEquals("nb", topic.language)
    assertEquals("Trignometri", topic.baseName)
  }

  @Test
  fun defaults_to_default_language() {
    val id =
        builder
            .node(NodeType.TOPIC) { t ->
              t.name("Trigonometry").translation("nb") { l -> l.name("Trigonometri") }
            }
            .publicId

    val topic = getNode(id, null)
    assertEquals("Trigonometri", topic.name)
  }

  @Test
  fun can_add_translation() {
    val trigonometry = builder.node(NodeType.NODE) { t -> t.name("Trigonometry") }
    val id = trigonometry.publicId

    testUtils.updateResource("/v1/nodes/$id/translations/nb", TranslationPUT("Trigonometri"))

    assertEquals("Trigonometri", trigonometry.getTranslation("nb").get().name)

    testUtils.updateResource("/v1/nodes/$id/translations/nn", TranslationPUT("Trigonometri"))

    assertEquals("Trigonometri", trigonometry.getTranslation("nn").get().name)
    assertEquals(2, trigonometry.translations.size)
  }

  @Test
  fun adding_translation_with_existing_code_overwrites_translation() {
    val trigonometry =
        builder.node(NodeType.NODE) { t -> t.name("Trigonometry").translation("Trignometry", "nb") }
    val id = trigonometry.publicId

    testUtils.updateResource("/v1/nodes/$id/translations/nb", TranslationPUT("Trigonometri"))

    assertEquals("Trigonometri", trigonometry.getTranslation("nb").get().name)
    assertEquals(1, trigonometry.translations.size)
  }

  @Test
  fun can_delete_translation() {
    val node =
        builder.node(NodeType.TOPIC) { t ->
          t.name("Trigonometry").translation("Trigonometri", "nb")
        }
    val id = node.publicId

    testUtils.deleteResource("/v1/nodes/$id/translations/nb")

    assertNull(node.getTranslation("nb").orElse(null))
  }

  @Test
  fun can_get_all_translations() {
    val topic =
        builder.node(NodeType.TOPIC) { t ->
          t.name("Trigonometry")
              .translation("nb") { l -> l.name("Trigonometri") }
              .translation("en") { l -> l.name("Trigonometry") }
              .translation("de") { l -> l.name("Trigonometrie") }
        }
    val id = topic.publicId

    val translations =
        testUtils.getObject(
            Array<TranslationDTO>::class.java,
            testUtils.getResource("/v1/nodes/$id/translations"),
        )

    assertEquals(3, translations.size)
    TestUtils.assertAnyTrue(translations) { t -> "Trigonometri" == t.name && "nb" == t.language }
    TestUtils.assertAnyTrue(translations) { t -> "Trigonometry" == t.name && "en" == t.language }
    TestUtils.assertAnyTrue(translations) { t -> "Trigonometrie" == t.name && "de" == t.language }
  }

  @Test
  fun can_get_single_translation() {
    val topic =
        builder.node(NodeType.TOPIC) { t ->
          t.name("Trigonometry").translation("nb") { l -> l.name("Trigonometri") }
        }
    val id = topic.publicId

    val translation =
        testUtils.getObject(
            TranslationDTO::class.java,
            testUtils.getResource("/v1/nodes/$id/translations/nb"),
        )
    assertEquals("Trigonometri", translation.name)
    assertEquals("nb", translation.language)
  }

  @Test
  fun can_get_resources_for_a_node_recursively_with_translation() {
    val a =
        builder
            .node(NodeType.TOPIC) { t ->
              t.resource { r ->
                    r.name("Introduction to calculus")
                        .translation("nb") { tr -> tr.name("Introduksjon til calculus") }
                        .resourceType(ResourceType.SUBJECT_MATERIAL)
                  }
                  .child(NodeType.TOPIC) { st ->
                    st.resource { r ->
                      r.name("Introduction to integration")
                          .translation("nb") { tr -> tr.name("Introduksjon til integrasjon") }
                          .resourceType(ResourceType.SUBJECT_MATERIAL)
                    }
                  }
            }
            .publicId

    val response = testUtils.getResource("/v1/nodes/$a/resources?recursive=true&language=nb")
    val result = testUtils.getObject(Array<NodeChildDTO>::class.java, response)

    assertEquals(2, result.size)
    TestUtils.assertAnyTrue(result) { r -> "Introduksjon til calculus" == r.name }
    TestUtils.assertAnyTrue(result) { r -> "Introduksjon til integrasjon" == r.name }
    TestUtils.assertAllTrue(result) { r -> "Fagstoff" == r.resourceTypes.iterator().next().name }
  }

  @Test
  fun can_get_resources_for_a_node_without_child_resources_with_translation() {
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).child(NodeType.TOPIC) { t ->
        t.publicId("urn:topic:1")
            .resource { r ->
              r.name("resource 1")
                  .translation("nb") { tr -> tr.name("ressurs 1") }
                  .resourceType(ResourceType.SUBJECT_MATERIAL)
            }
            .resource { r ->
              r.name("resource 2")
                  .translation("nb") { tr -> tr.name("ressurs 2") }
                  .resourceType(ResourceType.SUBJECT_MATERIAL)
            }
            .child(NodeType.TOPIC) { st ->
              st.name("subtopic").resource { r -> r.name("subtopic resource") }
            }
      }
    }

    val response = testUtils.getResource("/v1/nodes/urn:topic:1/resources?language=nb")
    val result = testUtils.getObject(Array<NodeChildDTO>::class.java, response)

    assertEquals(2, result.size)
    TestUtils.assertAnyTrue(result) { r -> "ressurs 1" == r.name }
    TestUtils.assertAnyTrue(result) { r -> "ressurs 2" == r.name }
    TestUtils.assertAllTrue(result) { r -> "Fagstoff" == r.resourceTypes.iterator().next().name }
  }

  private fun getNode(id: URI, language: String?): NodeDTO {
    var path = "/v1/nodes/$id"
    if (!language.isNullOrEmpty()) path = "$path?language=$language"
    return testUtils.getObject(NodeDTO::class.java, testUtils.getResource(path))
  }
}

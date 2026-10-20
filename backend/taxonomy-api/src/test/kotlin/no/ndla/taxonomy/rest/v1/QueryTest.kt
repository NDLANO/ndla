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
import no.ndla.taxonomy.rest.v1.dtos.searchapi.LanguageFieldDTO
import no.ndla.taxonomy.rest.v1.dtos.searchapi.TaxonomyContextDTO
import no.ndla.taxonomy.service.dtos.NodeDTO
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class QueryTest : RestTest() {

  @BeforeEach
  fun add_core_relevance() {
    nodeRepository.deleteAllAndFlush()
    nodeConnectionRepository.deleteAllAndFlush()
  }

  @Test
  fun can_get_resource_by_contentURI() {
    builder.node(NodeType.RESOURCE) { r ->
      r.publicId("urn:resource:1")
          .contentUri("urn:article:345")
          .resourceType(ResourceType.SUBJECT_MATERIAL)
    }

    val response = testUtils.getResource("/v1/nodes?nodeType=RESOURCE&contentURI=urn:article:345")
    val resources = testUtils.getObject(Array<NodeDTO>::class.java, response)

    assertEquals(1, resources.size)
    assertEquals(1, resources[0].resourceTypes.size)
  }

  @Test
  fun no_resources_matching_contentURI() {
    val response = testUtils.getResource("/v1/nodes?nodeType=RESOURCE&contentURI=urn:article:345")
    val resources = testUtils.getObject(Array<NodeDTO>::class.java, response)

    assertEquals(0, resources.size)
  }

  @Test
  fun can_get_all_resources_matching_contentURI() {
    builder.node(NodeType.RESOURCE) { r ->
      r.publicId("urn:resource:1")
          .contentUri("urn:article:345")
          .resourceType(ResourceType.SUBJECT_MATERIAL)
    }

    builder.node(NodeType.RESOURCE) { r ->
      r.publicId("urn:resource:2").contentUri("urn:article:3")
    }

    val response = testUtils.getResource("/v1/nodes?nodeType=RESOURCE&contentURI=urn:article:345")
    val resources = testUtils.getObject(Array<NodeDTO>::class.java, response)

    assertEquals(1, resources.size)
    TestUtils.assertAnyTrue(resources) { r -> "urn:resource:1" == r.id.toString() }
  }

  @Test
  fun can_get_all_resource_types_for_a_resource() {
    builder.node(NodeType.RESOURCE) { r ->
      r.publicId("urn:resource:1")
          .contentUri("urn:article:345")
          .resourceType(ResourceType.SUBJECT_MATERIAL)
          .resourceType(ResourceType.LEARNING_PATH)
    }

    val response = testUtils.getResource("/v1/nodes?nodeType=RESOURCE&contentURI=urn:article:345")
    val resources = testUtils.getObject(Array<NodeDTO>::class.java, response)

    assertEquals(1, resources.size)
    assertEquals(2, resources[0].resourceTypes.size)
  }

  @Test
  fun can_get_translated_name_for_resource() {
    builder.node(NodeType.RESOURCE) { r ->
      r.publicId("urn:resource:1")
          .name("Resource")
          .translation("nb") { tr -> tr.name("ressurs") }
          .contentUri("urn:article:345")
          .resourceType(ResourceType.SUBJECT_MATERIAL)
    }

    val response =
        testUtils.getResource("/v1/nodes?nodeType=RESOURCE&contentURI=urn:article:345&language=nb")
    val resources = testUtils.getObject(Array<NodeDTO>::class.java, response)

    assertEquals(1, resources.size)
    assertEquals(1, resources[0].resourceTypes.size)
    assertEquals("ressurs", resources[0].name)
  }

  @Test
  fun can_get_a_topic_matching_contentURI() {
    builder.node(NodeType.RESOURCE) { r ->
      r.publicId("urn:resource:1")
          .contentUri("urn:article:345")
          .resourceType(ResourceType.SUBJECT_MATERIAL)
    }

    builder.node(NodeType.TOPIC) { r -> r.publicId("urn:topic:2").contentUri("urn:article:345") }

    val response = testUtils.getResource("/v1/nodes?nodeType=TOPIC&contentURI=urn:article:345")
    val resources = testUtils.getObject(Array<NodeDTO>::class.java, response)

    assertEquals(1, resources.size)
    TestUtils.assertAnyTrue(resources) { r -> "urn:topic:2" == r.id.toString() }
  }

  @Test
  fun can_get_all_topics_matching_contentURI() {
    builder.node(NodeType.TOPIC) { r -> r.publicId("urn:topic:2").contentUri("urn:article:345") }

    builder.node(NodeType.TOPIC) { r -> r.publicId("urn:topic:3").contentUri("urn:article:345") }

    val response = testUtils.getResource("/v1/nodes?nodeType=TOPIC&contentURI=urn:article:345")
    val resources = testUtils.getObject(Array<NodeDTO>::class.java, response)

    assertEquals(2, resources.size)
    TestUtils.assertAnyTrue(resources) { r -> "urn:topic:2" == r.id.toString() }
    TestUtils.assertAnyTrue(resources) { r -> "urn:topic:3" == r.id.toString() }
  }

  @Test
  fun no_topics_matching_contentURI() {
    val response = testUtils.getResource("/v1/nodes?nodeType=TOPIC&contentURI=urn:article:345")
    val resources = testUtils.getObject(Array<NodeDTO>::class.java, response)

    assertEquals(0, resources.size)
  }

  @Test
  fun can_get_translated_name_for_topic() {
    builder.node(NodeType.TOPIC) { r ->
      r.publicId("urn:topic:2")
          .name("topic")
          .translation("nb") { tr -> tr.name("Emne") }
          .contentUri("urn:article:345")
    }

    val response =
        testUtils.getResource("/v1/nodes?nodeType=TOPIC&contentURI=urn:article:345&language=nb")
    val resources = testUtils.getObject(Array<NodeDTO>::class.java, response)

    assertEquals(1, resources.size)
    assertEquals("Emne", resources[0].name)
    TestUtils.assertAnyTrue(resources) { r -> "urn:topic:2" == r.id.toString() }
  }

  @Test
  fun can_get_searchable_context_with_visible_filtering() {
    val resource =
        builder.node(NodeType.RESOURCE) { r ->
          r.publicId("urn:resource:1").contentUri("urn:article:1").translation("nb") { t ->
            t.name("Ressurs")
          }
        }

    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true)
          .publicId("urn:subject:1")
          .name("subject")
          .translation("nb") { tr -> tr.name("Fag") }
          .child(NodeType.TOPIC) { t ->
            t.publicId("urn:topic:1")
                .name("topic")
                .translation("nb") { tr -> tr.name("Emne") }
                .child(resource)
          }
    }

    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true)
          .publicId("urn:subject:2")
          .name("subject 2")
          .translation("nb") { tr -> tr.name("Fag 2") }
          .child(NodeType.TOPIC) { t ->
            t.publicId("urn:topic:2")
                .name("topic 2")
                .translation("nb") { tr -> tr.name("Emne 2") }
                .child(resource)
          }
    }

    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true)
          .isVisible(false)
          .publicId("urn:subject:3")
          .name("subject 3")
          .translation("nb") { tr -> tr.name("Fag 3") }
          .child(NodeType.TOPIC) { t ->
            t.publicId("urn:topic:3")
                .name("topic 3")
                .translation("nb") { tr -> tr.name("Emne 3") }
                .child(resource)
          }
    }

    val response = testUtils.getResource("/v1/queries/urn:article:1?filterVisibles=true")
    val result = testUtils.getObject(Array<TaxonomyContextDTO>::class.java, response)

    assertEquals(2, result.size)

    val firstResult = result[0]
    assertEquals(URI.create("urn:resource:1"), firstResult.publicId)
    assertEquals(
        listOf(URI.create("urn:subject:1"), URI.create("urn:topic:1")),
        firstResult.parentIds.sorted(),
    )
    assertEquals(URI.create("urn:subject:1"), firstResult.rootId)
    assertEquals("/subject:1/topic:1/resource:1", firstResult.path)
    assertEquals(URI.create("urn:relevance:core"), firstResult.relevanceId)
    val breadcrumbs = LanguageFieldDTO<List<String>>()
    breadcrumbs["nb"] = listOf("Fag", "Emne")
    assertEquals(breadcrumbs, firstResult.breadcrumbs)

    val secondResult = result[1]
    assertEquals(URI.create("urn:resource:1"), secondResult.publicId)
    assertEquals(
        listOf(URI.create("urn:subject:2"), URI.create("urn:topic:2")),
        secondResult.parentIds.sorted(),
    )
    assertEquals(URI.create("urn:subject:2"), secondResult.rootId)
    assertEquals("/subject:2/topic:2/resource:1", secondResult.path)
    assertEquals(URI.create("urn:relevance:core"), secondResult.relevanceId)
    val breadcrumbs2 = LanguageFieldDTO<List<String>>()
    breadcrumbs2["nb"] = listOf("Fag 2", "Emne 2")
    assertEquals(breadcrumbs2, secondResult.breadcrumbs)
  }

  @Test
  fun can_get_searchable_context_with_no_visible_filtering() {
    val resource =
        builder.node(NodeType.RESOURCE) { r ->
          r.publicId("urn:resource:1").contentUri("urn:article:1").translation("nb") { t ->
            t.name("Ressurs")
          }
        }

    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true)
          .publicId("urn:subject:1")
          .name("subject")
          .translation("nb") { tr -> tr.name("Fag") }
          .child(NodeType.TOPIC) { t ->
            t.publicId("urn:topic:1")
                .name("topic")
                .translation("nb") { tr -> tr.name("Emne") }
                .child(resource)
          }
    }

    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true)
          .publicId("urn:subject:2")
          .name("subject 2")
          .translation("nb") { tr -> tr.name("Fag 2") }
          .child(NodeType.TOPIC) { t ->
            t.publicId("urn:topic:2")
                .name("topic 2")
                .translation("nb") { tr -> tr.name("Emne 2") }
                .child(resource)
          }
    }

    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true)
          .isVisible(false)
          .publicId("urn:subject:3")
          .name("subject 3")
          .translation("nb") { tr -> tr.name("Fag 3") }
          .child(NodeType.TOPIC) { t ->
            t.publicId("urn:topic:3")
                .name("topic 3")
                .translation("nb") { tr -> tr.name("Emne 3") }
                .child(resource)
          }
    }

    val response = testUtils.getResource("/v1/queries/urn:article:1?filterVisibles=false")
    val result = testUtils.getObject(Array<TaxonomyContextDTO>::class.java, response)

    assertEquals(3, result.size)
    val firstResult = result[0]
    assertEquals(URI.create("urn:resource:1"), firstResult.publicId)
    assertEquals(
        listOf(URI.create("urn:subject:1"), URI.create("urn:topic:1")),
        firstResult.parentIds.sorted(),
    )
    assertEquals(URI.create("urn:subject:1"), firstResult.rootId)
    assertEquals("/subject:1/topic:1/resource:1", firstResult.path)
    assertEquals(URI.create("urn:relevance:core"), firstResult.relevanceId)
    val breadcrumbs = LanguageFieldDTO<List<String>>()
    breadcrumbs["nb"] = listOf("Fag", "Emne")
    assertEquals(breadcrumbs, firstResult.breadcrumbs)

    val secondResult = result[1]
    assertEquals(URI.create("urn:resource:1"), secondResult.publicId)
    assertEquals(
        listOf(URI.create("urn:subject:2"), URI.create("urn:topic:2")),
        secondResult.parentIds.sorted(),
    )
    assertEquals(URI.create("urn:subject:2"), secondResult.rootId)
    assertEquals("/subject:2/topic:2/resource:1", secondResult.path)
    assertEquals(URI.create("urn:relevance:core"), secondResult.relevanceId)
    val breadcrumbs2 = LanguageFieldDTO<List<String>>()
    breadcrumbs2["nb"] = listOf("Fag 2", "Emne 2")
    assertEquals(breadcrumbs2, secondResult.breadcrumbs)

    val thirdResult = result[2]
    assertEquals(URI.create("urn:resource:1"), thirdResult.publicId)
    assertEquals(
        listOf(URI.create("urn:subject:3"), URI.create("urn:topic:3")),
        thirdResult.parentIds.sorted(),
    )
    assertEquals(URI.create("urn:subject:3"), thirdResult.rootId)
    assertEquals("/subject:3/topic:3/resource:1", thirdResult.path)
    assertEquals(URI.create("urn:relevance:core"), thirdResult.relevanceId)
    val breadcrumbs3 = LanguageFieldDTO<List<String>>()
    breadcrumbs3["nb"] = listOf("Fag 3", "Emne 3")
    assertEquals(breadcrumbs3, thirdResult.breadcrumbs)
  }

  @Test
  fun that_parent_topic_ids_are_derived_correctly() {
    val resource =
        builder.node(NodeType.RESOURCE) { r ->
          r.publicId("urn:resource:1").contentUri("urn:article:1").translation("nb") { t ->
            t.name("Ressurs")
          }
        }

    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true)
          .publicId("urn:subject:1")
          .name("subject")
          .translation("nb") { tr -> tr.name("Fag") }
          .child(NodeType.TOPIC) { t ->
            t.publicId("urn:topic:1")
                .name("topic")
                .translation("nb") { tr -> tr.name("Emne") }
                .child(resource)
          }
    }

    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true)
          .publicId("urn:subject:2")
          .name("subject 2")
          .translation("nb") { tr -> tr.name("Fag 2") }
          .child(NodeType.TOPIC) { t ->
            t.publicId("urn:topic:2")
                .name("topic 2")
                .translation("nb") { tr -> tr.name("Emne 2") }
                .child(resource)
          }
    }

    val response = testUtils.getResource("/v1/queries/urn:article:1?filterVisibles=false")
    val result = testUtils.getObject(Array<TaxonomyContextDTO>::class.java, response)

    assertEquals(2, result.size)
    assertEquals(
        listOf(URI.create("urn:subject:1"), URI.create("urn:topic:1")),
        result[0].parentIds.sorted(),
    )
    assertEquals(
        listOf(URI.create("urn:subject:2"), URI.create("urn:topic:2")),
        result[1].parentIds.sorted(),
    )
  }

  @Test
  fun that_topics_can_be_contexts_too() {
    val resource =
        builder.node(NodeType.RESOURCE) { r ->
          r.publicId("urn:resource:1").contentUri("urn:article:1").translation("nb") { t ->
            t.name("Ressurs")
          }
        }

    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true)
          .publicId("urn:subject:1")
          .name("subject")
          .translation("nb") { tr -> tr.name("Fag") }
          .child(NodeType.TOPIC) { t ->
            t.publicId("urn:topic:1")
                .name("topic")
                .translation("nb") { tr -> tr.name("Emne") }
                .child(resource)
          }
    }

    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true)
          .publicId("urn:subject:2")
          .name("subject 2")
          .translation("nb") { tr -> tr.name("Fag 2") }
          .child(NodeType.TOPIC) { t ->
            t.isContext(true)
                .publicId("urn:topic:2")
                .name("topic 2")
                .translation("nb") { tr -> tr.name("Emne 2") }
                .child(resource)
          }
    }

    val response = testUtils.getResource("/v1/queries/urn:article:1?filterVisibles=false")
    val result = testUtils.getObject(Array<TaxonomyContextDTO>::class.java, response)

    assertEquals(3, result.size)
    val firstResult = result[0]
    assertEquals(URI.create("urn:resource:1"), firstResult.publicId)
    assertEquals(
        listOf(URI.create("urn:subject:1"), URI.create("urn:topic:1")),
        firstResult.parentIds.sorted(),
    )
    assertEquals(URI.create("urn:subject:1"), firstResult.rootId)
    assertEquals("/subject:1/topic:1/resource:1", firstResult.path)
    assertEquals(URI.create("urn:relevance:core"), firstResult.relevanceId)
    val breadcrumbs = LanguageFieldDTO<List<String>>()
    breadcrumbs["nb"] = listOf("Fag", "Emne")
    assertEquals(breadcrumbs, firstResult.breadcrumbs)

    val secondResult = result[1]
    assertEquals(URI.create("urn:resource:1"), secondResult.publicId)
    assertEquals(
        listOf(URI.create("urn:subject:2"), URI.create("urn:topic:2")),
        secondResult.parentIds.sorted(),
    )
    assertEquals(URI.create("urn:subject:2"), secondResult.rootId)
    assertEquals("/subject:2/topic:2/resource:1", secondResult.path)
    assertEquals(URI.create("urn:relevance:core"), secondResult.relevanceId)
    val breadcrumbs2 = LanguageFieldDTO<List<String>>()
    breadcrumbs2["nb"] = listOf("Fag 2", "Emne 2")
    assertEquals(breadcrumbs2, secondResult.breadcrumbs)

    val thirdResult = result[2]
    assertEquals(URI.create("urn:resource:1"), thirdResult.publicId)
    assertEquals(listOf(URI.create("urn:topic:2")), thirdResult.parentIds.sorted())
    assertEquals(URI.create("urn:topic:2"), thirdResult.rootId)
    assertEquals("/topic:2/resource:1", thirdResult.path)
    assertEquals(URI.create("urn:relevance:core"), thirdResult.relevanceId)
    val breadcrumbs3 = LanguageFieldDTO<List<String>>()
    breadcrumbs3["nb"] = listOf("Emne 2")
    assertEquals(breadcrumbs3, thirdResult.breadcrumbs)
  }

  @Test
  fun that_contexts_can_be_found_by_path() {
    builder.node(NodeType.SUBJECT) { s ->
      s.isContext(true).publicId("urn:subject:1").name("Subject").child(NodeType.TOPIC) { t ->
        t.name("Topic").publicId("urn:topic:1").resource { r ->
          r.name("One fine resource").contentUri("urn:article:1").publicId("urn:resource:1")
        }
      }
    }
    val resource = nodeRepository.getByPublicId(URI.create("urn:resource:1"))
    run {
      val response =
          testUtils.getResource(
              "/v1/queries/path?path=/one-fine-resource/r/${resource.contexts.first().contextId}")
      val result = testUtils.getObject(Array<TaxonomyContextDTO>::class.java, response)

      assertEquals(1, result.size)
      assertEquals(listOf("Subject", "Topic"), result[0].breadcrumbs["nb"])
    }
    run {
      // Old format used for programmes
      val response =
          testUtils.getResource(
              "/v1/queries/path?path=/one-fine-resource__${resource.contexts.first().contextId}")
      val result = testUtils.getObject(Array<TaxonomyContextDTO>::class.java, response)

      assertEquals(1, result.size)
      assertEquals(listOf("Subject", "Topic"), result[0].breadcrumbs["nb"])
    }
  }
}

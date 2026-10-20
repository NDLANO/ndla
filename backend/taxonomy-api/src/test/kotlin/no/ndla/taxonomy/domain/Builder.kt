/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import jakarta.persistence.EntityManager
import java.net.URI
import java.util.function.Consumer
import no.ndla.taxonomy.service.ContextUpdaterService
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Component
@Transactional(propagation = Propagation.MANDATORY)
class Builder(
    private val entityManager: EntityManager,
    private val contextUpdaterService: ContextUpdaterService,
) {
  private val versions: MutableMap<String, VersionBuilder> = HashMap()
  private val nodes: MutableMap<String, NodeBuilder> = HashMap()
  private val cachedUrlOldRigBuilders: MutableMap<String, UrlMappingBuilder> = HashMap()
  private var keyCounter = 0

  private fun createKey(): String = "DefaultKey:${keyCounter++}"

  fun version(): Version = version(null, null)

  fun version(key: String?): Version = version(key, null)

  fun version(consumer: Consumer<VersionBuilder>?): Version = version(null, consumer)

  fun version(key: String?, consumer: Consumer<VersionBuilder>?): Version {
    val builder = getVersionBuilder(key)
    consumer?.accept(builder)

    entityManager.persist(builder.version)

    return builder.version
  }

  private fun getVersionBuilder(key: String?): VersionBuilder {
    val versionKey = key ?: createKey()
    versions.putIfAbsent(versionKey, VersionBuilder())
    return versions.getValue(versionKey)
  }

  private fun getNodeBuilder(key: String?, nodeType: NodeType?): NodeBuilder {
    val nodeKey = key ?: createKey()
    nodes.putIfAbsent(nodeKey, NodeBuilder(nodeType ?: NodeType.NODE))
    return nodes.getValue(nodeKey)
  }

  private fun getResourceBuilder(key: String?): NodeBuilder = getNodeBuilder(key, NodeType.RESOURCE)

  fun node(): Node = node(null, null, null)

  fun node(key: String?): Node = node(key, null, null)

  fun node(nodeType: NodeType?): Node = node(null, nodeType, null)

  fun node(consumer: Consumer<NodeBuilder>?): Node = node(null, null, consumer)

  fun node(nodeType: NodeType?, consumer: Consumer<NodeBuilder>?): Node =
      node(null, nodeType, consumer)

  fun node(key: String?, nodeType: NodeType?, consumer: Consumer<NodeBuilder>?): Node {
    val nodeBuilder = getNodeBuilder(key, nodeType)
    consumer?.accept(nodeBuilder)

    entityManager.persist(nodeBuilder.node)
    contextUpdaterService.updateContexts(nodeBuilder.node)

    return nodeBuilder.node
  }

  private fun getUrlMappingBuilder(key: String?): UrlMappingBuilder {
    val urlMappingKey = key ?: createKey()
    cachedUrlOldRigBuilders.putIfAbsent(urlMappingKey, UrlMappingBuilder())
    return cachedUrlOldRigBuilders.getValue(urlMappingKey)
  }

  @Transactional
  class VersionBuilder {
    internal val version = Version()

    fun publicId(publicId: URI): VersionBuilder = apply { version.publicId = publicId }

    fun type(versionType: VersionType): VersionBuilder = apply { version.versionType = versionType }

    fun locked(locked: Boolean): VersionBuilder = apply { version.isLocked = locked }
  }

  class JsonTranslationBuilder(private val translation: JsonTranslation) {
    fun name(name: String): JsonTranslationBuilder = apply { translation.name = name }
  }

  @Transactional
  class UrlMappingBuilder {
    private var oldUrl: String? = null
    private var publicId: String? = null
    private var subjectId: String? = null

    fun oldUrl(p: String): UrlMappingBuilder = apply { oldUrl = p }

    fun public_id(p: String): UrlMappingBuilder = apply { publicId = p }

    fun subject_id(s: String): UrlMappingBuilder = apply { subjectId = s }

    fun build(): UrlMapping =
        UrlMapping(
            checkNotNull(oldUrl) { "oldUrl must be set before build()" },
            URI.create(checkNotNull(publicId) { "publicId must be set before build()" }),
            subjectId?.let { URI.create(it) },
        )
  }

  fun urlMapping(consumer: Consumer<UrlMappingBuilder>?): UrlMapping = urlMapping(null, consumer)

  fun urlMapping(key: String?, consumer: Consumer<UrlMappingBuilder>?): UrlMapping {
    val urlMappingBuilder = getUrlMappingBuilder(key)
    consumer?.accept(urlMappingBuilder)
    return urlMappingBuilder.build()
  }

  @Transactional
  inner class NodeBuilder(nodeType: NodeType) {
    internal val node: Node = Node(nodeType).also { entityManager.persist(it) }

    fun nodeType(nodeType: NodeType): NodeBuilder = apply {
      node.nodeType = nodeType
      contextUpdaterService.updateContexts(node)
    }

    fun name(name: String): NodeBuilder = apply { node.name = name }

    fun resourceType(rt: ResourceType): NodeBuilder = apply { node.addResourceType(rt) }

    fun qualityEvaluation(grade: Grade): NodeBuilder = apply { node.setQualityEvaluation(grade) }

    fun contentUri(contentUri: String): NodeBuilder = contentUri(URI.create(contentUri))

    fun contentUri(contentUri: URI): NodeBuilder = apply { node.contentUri = contentUri }

    fun publicId(id: String): NodeBuilder = apply {
      node.publicId = URI.create(id)

      contextUpdaterService.updateContexts(node)
    }

    fun isContext(b: Boolean): NodeBuilder = apply {
      node.isContext = b

      contextUpdaterService.updateContexts(node)
    }

    fun isVisible(visible: Boolean): NodeBuilder = apply { node.metadata.setVisible(visible) }

    fun grepCode(code: String): NodeBuilder = apply {
      node.addGrepCode(code)
      entityManager.persist(node)
    }

    fun customField(key: String, value: String): NodeBuilder = apply {
      node.setCustomField(key, value)
      entityManager.persist(node)
    }

    fun child(nodeKey: String?): NodeBuilder = child(nodeKey, null, null)

    fun child(nodeKey: String?, nodeType: NodeType?): NodeBuilder = child(nodeKey, nodeType, null)

    fun child(consumer: Consumer<NodeBuilder>?): NodeBuilder = child(null, null, consumer)

    fun child(nodeType: NodeType?, consumer: Consumer<NodeBuilder>?): NodeBuilder =
        child(null, nodeType, consumer)

    fun child(key: String?, nodeType: NodeType?, consumer: Consumer<NodeBuilder>?): NodeBuilder =
        apply {
          val nodeBuilder = getNodeBuilder(key, nodeType)
          consumer?.accept(nodeBuilder)
          child(nodeBuilder.node)
        }

    fun child(child: Node): NodeBuilder = apply {
      entityManager.persist(NodeConnection.create(node, child, Relevance.CORE))
      contextUpdaterService.updateContexts(child)
    }

    fun link(other: Node): NodeBuilder = apply {
      entityManager.persist(
          NodeConnection.create(node, other, Relevance.CORE, NodeConnectionType.LINK))
      contextUpdaterService.updateContexts(other)
    }

    fun resource(): NodeBuilder = resource(null, null)

    fun resource(resourceKey: String?): NodeBuilder = resource(resourceKey, null)

    fun resource(primary: Boolean, consumer: Consumer<NodeBuilder>?): NodeBuilder =
        resource(null, primary, consumer)

    fun resource(consumer: Consumer<NodeBuilder>?): NodeBuilder = resource(null, consumer)

    fun resource(resourceKey: String?, consumer: Consumer<NodeBuilder>?): NodeBuilder =
        resource(resourceKey, false, consumer)

    fun resource(
        resourceKey: String?,
        primary: Boolean,
        consumer: Consumer<NodeBuilder>?,
    ): NodeBuilder {
      val resourceBuilder = getResourceBuilder(resourceKey)
      consumer?.accept(resourceBuilder)

      return resource(resourceBuilder.node, primary)
    }

    fun resource(resourceKey: String?, primary: Boolean): NodeBuilder =
        resource(resourceKey, primary, null)

    fun resource(resource: Node): NodeBuilder = this.child(resource)

    fun resource(resource: Node, primary: Boolean): NodeBuilder = apply {
      entityManager.persist(
          NodeConnection.create(node, resource, Relevance.CORE, NodeConnectionType.BRANCH, primary))

      contextUpdaterService.updateContexts(resource)
    }

    fun translation(languageCode: String, consumer: Consumer<JsonTranslationBuilder>): NodeBuilder =
        apply {
          val nodeTranslation = node.addTranslation("", languageCode)
          val builder = JsonTranslationBuilder(nodeTranslation)
          consumer.accept(builder)
          entityManager.persist(node)
        }

    fun translation(name: String, languageCode: String): NodeBuilder = apply {
      node.addTranslation(name, languageCode)
      entityManager.persist(node)
    }
  }
}

/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.PreRemove
import java.net.URI
import java.time.Instant
import java.util.UUID
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.Type
import org.hibernate.annotations.UpdateTimestamp

@Entity
class NodeConnection :
    DomainEntity, EntityWithMetadata, Comparable<NodeConnection>, SortableResourceConnection {
  // only for publishing
  @ManyToOne @JoinColumn(name = "parent_id") override var parent: Node? = null

  // only for publishing
  @ManyToOne @JoinColumn(name = "child_id") var child: Node? = null

  @Column(name = "rank") override var rank: Int = 0

  @Column(name = "is_primary") var isPrimary: Boolean = false

  @Enumerated(EnumType.STRING) @Column var relevance: Relevance? = null

  @Column private var visible: Boolean = true

  @Type(JsonBinaryType::class)
  @Column(name = "grepcodes", columnDefinition = "jsonb")
  private var grepcodes: Set<JsonGrepCode> = HashSet()

  @Type(JsonBinaryType::class)
  @Column(name = "customfields", columnDefinition = "jsonb")
  private var customfields: Map<String, String> = HashMap()

  @Column @CreationTimestamp private var created_at: Instant? = null

  @Column @UpdateTimestamp private var updated_at: Instant? = null

  @Enumerated(EnumType.STRING)
  @Column
  var connectionType: NodeConnectionType = NodeConnectionType.BRANCH
    protected set

  constructor() {
    publicId = URI.create("urn:node-connection:${UUID.randomUUID()}")
  }

  constructor(nodeConnection: NodeConnection) {
    this.rank = nodeConnection.rank
    this.relevance = nodeConnection.relevance
    this.parent = nodeConnection.parent
    this.child = nodeConnection.child
    this.connectionType = nodeConnection.connectionType
    publicId = nodeConnection.publicId
    isPrimary = nodeConnection.isPrimary
    setMetadata(Metadata(nodeConnection.metadata))
  }

  // Special constructor for rankable test
  constructor(uri: String, relevance: Relevance?, rank: Int) {
    publicId = URI.create(uri)
    this.relevance = relevance
    this.rank = rank
  }

  fun disassociate() {
    val parent = this.parent
    val child = this.child

    this.parent = null
    this.child = null

    parent?.removeChildConnection(this)
    child?.removeParentConnection(this)
  }

  override val resource: Node?
    get() {
      val child = child
      check(child == null || child.nodeType == NodeType.RESOURCE) {
        "Tried to getResource on a nodeConnection connected to a non-resource"
      }
      return child
    }

  @PreRemove
  fun preRemove() {
    disassociate()
  }

  override val metadata: Metadata
    get() = Metadata(this)

  override fun getGrepCodes(): Set<JsonGrepCode> = this.grepcodes

  override fun setCustomField(key: String, value: String) {
    this.customfields += key to value
  }

  override fun unsetCustomField(key: String) {
    this.customfields -= key
  }

  override fun setGrepCodes(codes: Set<JsonGrepCode>) {
    this.grepcodes = codes
  }

  override fun setCustomFields(customFields: Map<String, String>) {
    this.customfields = customFields
  }

  override fun setVisible(visible: Boolean) {
    this.visible = visible
  }

  override fun setUpdatedAt(updatedAt: Instant?) {
    this.updated_at = updatedAt
  }

  override fun setCreatedAt(createdAt: Instant?) {
    this.created_at = createdAt
  }

  override fun isVisible(): Boolean = this.visible

  override fun getCreatedAt(): Instant? = this.created_at

  override fun getUpdatedAt(): Instant? = this.updated_at

  override fun compareTo(other: NodeConnection): Int = publicId.compareTo(other.publicId)

  override fun getCustomFields(): Map<String, String> = this.customfields

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other == null || javaClass != other.javaClass) return false
    val that = other as NodeConnection
    return rank == that.rank &&
        parent == that.parent &&
        child == that.child &&
        relevance == that.relevance &&
        connectionType == that.connectionType
  }

  companion object {
    @JvmStatic
    @JvmOverloads
    fun create(
        parent: Node,
        child: Node,
        relevance: Relevance,
        connectionType: NodeConnectionType = NodeConnectionType.BRANCH,
        isPrimary: Boolean = true,
    ): NodeConnection {
      val nodeConnection = NodeConnection()
      nodeConnection.parent = parent
      nodeConnection.child = child
      nodeConnection.isPrimary = isPrimary
      nodeConnection.relevance = relevance
      nodeConnection.connectionType = connectionType

      parent.addChildConnection(nodeConnection)
      child.addParentConnection(nodeConnection)

      return nodeConnection
    }
  }
}

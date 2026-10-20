/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Convert
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.OneToMany
import jakarta.persistence.PrePersist
import jakarta.persistence.PreRemove
import jakarta.persistence.PreUpdate
import java.net.URI
import java.time.Instant
import java.util.TreeSet
import java.util.UUID
import no.ndla.taxonomy.config.Constants
import no.ndla.taxonomy.domain.exceptions.ChildNotFoundException
import no.ndla.taxonomy.domain.exceptions.DuplicateIdException
import no.ndla.taxonomy.util.PrettyUrlUtil
import org.hibernate.annotations.BatchSize
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.annotations.Type
import org.hibernate.type.SqlTypes
import org.slf4j.LoggerFactory

@Entity
class Node : DomainObject, EntityWithMetadata {
  @OneToMany(mappedBy = "child", cascade = [CascadeType.ALL], orphanRemoval = true)
  @BatchSize(size = 100)
  private val parentConnections: MutableSet<NodeConnection> = TreeSet()

  @OneToMany(mappedBy = "parent", cascade = [CascadeType.ALL], orphanRemoval = true)
  @BatchSize(size = 100)
  private val childConnections: MutableSet<NodeConnection> = TreeSet()

  @Column var contentUri: URI? = null

  @Column
  @Enumerated(EnumType.STRING)
  var nodeType: NodeType = NodeType.NODE
    set(nodeType) {
      field = nodeType
      updatePublicID()
    }

  @Column
  var ident: String? = null
    set(ident) {
      field = ident
      updatePublicID()
    }

  @Column private var created_at: Instant? = null

  @Column private var updated_at: Instant? = null

  @Column private var context: Boolean = false

  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "resource_type_ids", columnDefinition = "text[]")
  private var resourceTypeIds: MutableSet<String> = HashSet()

  @Column private var visible: Boolean = true

  @Type(JsonBinaryType::class)
  @Column(name = "translations", columnDefinition = "jsonb")
  override var translations: MutableList<JsonTranslation> = ArrayList()

  @Type(JsonBinaryType::class)
  @Column(name = "grepcodes", columnDefinition = "jsonb")
  private var grepcodes: Set<JsonGrepCode> = HashSet()

  @Type(JsonBinaryType::class)
  @Column(name = "customfields", columnDefinition = "jsonb")
  private var customfields: Map<String, String> = HashMap()

  @Type(JsonBinaryType::class)
  @Column(name = "contexts", columnDefinition = "jsonb")
  var contexts: Set<TaxonomyContext> = HashSet()

  @Type(JsonBinaryType::class)
  @Column(name = "contextids", columnDefinition = "jsonb")
  var contextIds: MutableSet<String> = HashSet()

  @Column(name = "quality_evaluation")
  @Convert(converter = GradeConverter::class)
  private var qualityEvaluation: Grade? = null

  @Column(name = "quality_evaluation_comment") var qualityEvaluationComment: String? = null

  @Column(name = "child_quality_evaluation_sum") private var childQualityEvaluationSum: Int = 0

  @Column(name = "child_quality_evaluation_count") private var childQualityEvaluationCount: Int = 0

  @Column(name = "requires_technical_evaluation") var requiresTechnicalEvaluation: Boolean? = null

  @Column(name = "technical_evaluation_comment") var technicalEvaluationComment: String? = null

  // Needed for hibernate
  constructor()

  constructor(nodeType: NodeType) {
    this.nodeType = nodeType
    ident = UUID.randomUUID().toString()
    updatePublicID()
  }

  @PrePersist
  fun prePersist() {
    val now = Instant.now()
    setCreatedAt(now)
    setUpdatedAt(now)
  }

  @PreUpdate
  fun preUpdate() {
    setUpdatedAt(Instant.now())
  }

  constructor(node: Node, keepPublicId: Boolean = true) {
    this.contentUri = node.contentUri
    this.nodeType = node.nodeType
    this.ident = node.ident
    this.context = node.context
    this.qualityEvaluation = node.qualityEvaluationGrade
    this.qualityEvaluationComment = node.qualityEvaluationComment

    if (keepPublicId) {
      publicId = node.publicId
    } else {
      ident = UUID.randomUUID().toString()
      updatePublicID()
    }

    this.translations = node.translations.mapTo(ArrayList()) { JsonTranslation(it) }
    this.resourceTypeIds = HashSet(node.resourceTypeIds)
    setMetadata(Metadata(node.metadata))
    name = node.name
  }

  val qualityEvaluationGrade: Grade?
    get() = qualityEvaluation

  val qualityEvaluationNote: String?
    get() = qualityEvaluationComment

  val childQualityEvaluationAverage: GradeAverage?
    get() {
      if (this.childQualityEvaluationCount == 0 || this.childQualityEvaluationSum == 0) {
        return null
      }
      return GradeAverage(this.childQualityEvaluationSum, this.childQualityEvaluationCount)
    }

  fun setChildQualityEvaluationAverage(averageSum: Int, count: Int) {
    if (count <= 0 || averageSum <= 0) {
      this.childQualityEvaluationSum = 0
      this.childQualityEvaluationCount = 0
      return
    }

    this.childQualityEvaluationSum = averageSum
    this.childQualityEvaluationCount = count
  }

  fun addGradeAverageTreeToAverageCalculation(newGradeAverage: GradeAverage) {
    val childAvg = childQualityEvaluationAverage
    if (childAvg == null) {
      this.childQualityEvaluationSum = newGradeAverage.averageSum
      this.childQualityEvaluationCount = newGradeAverage.count
      return
    }

    val oldSum = childAvg.averageSum
    val sumToAdd = newGradeAverage.averageSum
    val newSum = oldSum + sumToAdd
    val newCount = childAvg.count + newGradeAverage.count

    if (newCount > 0) {
      this.childQualityEvaluationSum = newSum
      this.childQualityEvaluationCount = newCount
    } else {
      this.childQualityEvaluationSum = 0
      this.childQualityEvaluationCount = 0
    }
  }

  fun removeGradeAverageTreeFromAverageCalculation(previousGradeAverage: GradeAverage) {
    val childAvg = childQualityEvaluationAverage
    if (childAvg == null) {
      logger.error(
          "Tried to remove {} from node '{}' but child average is missing. This seems like a bug or data inconsistency.",
          previousGradeAverage,
          this.publicId,
      )
      return
    }

    val totalSum = childAvg.averageSum
    val sumToRemove = previousGradeAverage.averageSum

    val newSum = totalSum - sumToRemove
    val newCount = childAvg.count - previousGradeAverage.count

    if (newCount <= 0 || newSum <= 0) {
      this.childQualityEvaluationSum = 0
      this.childQualityEvaluationCount = 0
    } else {
      this.childQualityEvaluationSum = newSum
      this.childQualityEvaluationCount = newCount
    }
  }

  fun updateChildQualityEvaluationAverage(previousGrade: Grade?, newGrade: Grade?) {
    val avg = childQualityEvaluationAverage
    if (avg == null) {
      if (newGrade != null) {
        this.childQualityEvaluationSum = newGrade.toInt()
        this.childQualityEvaluationCount = 1
      }
      return
    }

    if (previousGrade == null) {
      if (newGrade == null) return
      // New grade is present
      val newCount = avg.count + 1
      val newSum = avg.averageSum + newGrade.toInt()
      this.childQualityEvaluationCount = newCount
      this.childQualityEvaluationSum = newSum
    } else if (newGrade == null) { // Previous grade is present
      val newCount = avg.count - 1
      val oldSum = avg.averageSum
      val newSum = oldSum - previousGrade.toInt()
      if (newCount <= 0 || newSum <= 0) {
        this.childQualityEvaluationCount = 0
        this.childQualityEvaluationSum = 0
      } else {
        this.childQualityEvaluationCount = newCount
        this.childQualityEvaluationSum = newSum
      }
    } else { // Both grades are present
      val oldSum = avg.averageSum
      val newSum = oldSum - previousGrade.toInt() + newGrade.toInt()
      this.childQualityEvaluationCount = avg.count
      this.childQualityEvaluationSum = newSum
    }
  }

  fun updateEntireAverageTree() {
    val allChildGrades = getChildGradesRecursively()
    val gradeAverage = GradeAverage.fromGrades(allChildGrades)
    logger.info(
        "Found average grades for {} children of node '{}' -> {}",
        allChildGrades.size,
        this.publicId,
        gradeAverage,
    )

    if (gradeAverage.count == 0) {
      this.childQualityEvaluationSum = 0
      this.childQualityEvaluationCount = 0
    } else if (gradeAverage.count > 0) {
      this.childQualityEvaluationSum = gradeAverage.averageSum
      this.childQualityEvaluationCount = gradeAverage.count
    }
  }

  fun getChildGradesRecursively(): List<Grade?> = buildList {
    for (child in childNodesForQualityEvaluation) {
      addAll(child.getChildGradesRecursively())
      if (child.nodeType == NodeType.RESOURCE) {
        add(child.qualityEvaluationGrade)
      }
    }
  }

  fun setQualityEvaluation(qualityEvaluation: Grade?) {
    this.qualityEvaluation = qualityEvaluation
  }

  val pathPart: String
    get() = "/${publicId.schemeSpecificPart}"

  private fun updatePublicID() {
    super.publicId = URI.create("urn:${nodeType.typeName}:$ident")
  }

  val primaryPath: String?
    get() = pickContext(null, null, null, NodeConnectionType.BRANCH, emptySet())?.path

  /**
   * Picks a context based on parameters. If no parameters or no matches, pick by comparing path and
   * primary
   *
   * @param contextId If this is present, return the context with corresponding id
   * @param parent If this is present, filter contexts where parent is in parentIds
   * @param root If this is present, return context with this publicId as root. Else pick context
   *   containing roots publicId.
   * @param connectionType If this is present and of type LINK, return the default context
   * @param contextSet Possibly filtered set of contexts to choose from
   * @return Context
   */
  fun pickContext(
      contextId: String?,
      parent: Node?,
      root: Node?,
      connectionType: NodeConnectionType,
      contextSet: Set<TaxonomyContext>,
  ): TaxonomyContext? {
    val contexts = if (contextSet.isNotEmpty()) contextSet else this.contexts
    val maybeContext = contextId?.let { id -> contexts.firstOrNull { it.contextId == id } }
    if (maybeContext != null) {
      return maybeContext
    }
    val containsParent =
        parent?.let { p ->
          val parentId = p.publicId.toString()
          contexts.filterTo(HashSet()) { it.parentIds.contains(parentId) }
        } ?: contexts
    val containsRoot =
        root?.let { p ->
          val rootId = p.publicId.toString()
          containsParent.filterTo(HashSet()) { it.parentIds.contains(rootId) }
        } ?: containsParent
    // If no context is found based on params, or connection is of type LINK return the one with the
    // shortest path
    val filtered =
        if (connectionType == NodeConnectionType.LINK || containsRoot.isEmpty()) contextSet
        else containsRoot
    val rootPathPart = root?.pathPart ?: "other"
    return filtered.minWithOrNull { context1, context2 ->
      val inPath1 = context1.path.contains(rootPathPart)
      val inPath2 = context2.path.contains(rootPathPart)

      when {
        // contexts are of equal value, pick the shortest
        inPath1 && inPath2 && context1.isPrimary && context2.isPrimary ->
            context1.parentIds.size - context2.parentIds.size
        inPath1 && inPath2 && context1.isPrimary -> -1
        inPath1 && inPath2 && context2.isPrimary -> 1
        inPath1 && !inPath2 -> -1
        inPath2 && !inPath1 -> 1
        context1.isPrimary && !context2.isPrimary -> -1
        context2.isPrimary && !context1.isPrimary -> 1
        // contexts are of equal value, pick the shortest
        else -> context1.parentIds.size - context2.parentIds.size
      }
    }
  }

  val allPaths: TreeSet<String>
    get() = contexts.mapTo(TreeSet()) { it.path }

  /*
   * In the old code the primary URL for topics was special since it would try to return a context URL (a topic
   * behaving as a subject) rather than a subject URL if that is available. Trying to re-implement it by sorting the
   * context URLs first by the same path comparing as the old code
   */
  /*
   * public Optional<String> getPrimaryPath() { return getCachedPaths() .stream()
   * .map(CachedPath::getPath).min((path1, path2) -> { if (path1.startsWith("/topic") && path2.startsWith("/topic")) {
   * return 0; }
   *
   * if (path1.startsWith("/topic")) { return -1; }
   *
   * if (path2.startsWith("/topic")) { return 1; }
   *
   * return 0; }); }
   */

  fun getParentConnections(): Collection<NodeConnection> = this.parentConnections.toList()

  fun getChildConnections(): Collection<NodeConnection> = HashSet(childConnections)

  val resourceChildren: Collection<NodeConnection>
    get() = this.childConnections.filterTo(HashSet()) { it.child?.nodeType == NodeType.RESOURCE }

  val resourceTypes: Collection<ResourceType>
    get() = resourceTypeIds.mapNotNullTo(TreeSet()) { ResourceType.findByPublicId(URI.create(it)) }

  fun addResourceType(resourceType: ResourceType) {
    val id = resourceType.publicId.toString()
    require(this.nodeType == NodeType.RESOURCE) {
      "Resource types can only be added to nodes of type ${NodeType.RESOURCE}"
    }
    if (resourceTypeIds.contains(id)) {
      throw DuplicateIdException(
          "Resource with id $publicId is already marked with resource type with id ${resourceType.publicId}")
    }
    resourceTypeIds.add(id)
  }

  fun clearResourceTypes() {
    resourceTypeIds.clear()
  }

  fun removeResourceType(resourceType: ResourceType) {
    if (!resourceTypeIds.remove(resourceType.publicId.toString())) {
      throw ChildNotFoundException(
          "Resource with id ${this.publicId} is not of type ${resourceType.publicId}")
    }
  }

  fun addChildConnection(nodeConnection: NodeConnection) {
    require(nodeConnection.parent === this) {
      "Parent must be set on NodeConnection before associating with child"
    }
    require(this.nodeType != NodeType.RESOURCE) {
      "'${NodeType.RESOURCE}' nodes cannot have children"
    }

    this.childConnections.add(nodeConnection)
  }

  fun removeChildConnection(nodeConnection: NodeConnection) {
    this.childConnections.remove(nodeConnection)

    nodeConnection.disassociate()
  }

  fun addParentConnection(nodeConnection: NodeConnection) {
    require(nodeConnection.child === this) {
      "Child must be set on NodeConnection before associating with Parent"
    }

    this.parentConnections.add(nodeConnection)
  }

  fun removeParentConnection(nodeConnection: NodeConnection) {
    this.parentConnections.remove(nodeConnection)

    nodeConnection.disassociate()
  }

  val childNodes: Collection<Node>
    get() = childConnections.mapNotNull { it.child }

  val childNodesForQualityEvaluation: Collection<Node>
    get() =
        childConnections.mapNotNull { connection ->
          if (connection.connectionType != NodeConnectionType.LINK) connection.child else null
        }

  val parentNodes: Collection<Node>
    get() = parentConnections.mapNotNull { it.parent }

  val parentNodesForQualityEvaluation: Collection<Node>
    get() =
        parentConnections.mapNotNull { connection ->
          if (connection.connectionType != NodeConnectionType.LINK) connection.parent else null
        }

  val resources: Collection<Node>
    get() =
        childConnections.mapNotNull { connection ->
          connection.child?.takeIf { it.nodeType == NodeType.RESOURCE }
        }

  private fun getAllParentsRecursive(): Collection<Node> {
    val parents = parentNodes
    val all = ArrayList(parents)
    parents.forEach { all.addAll(it.getAllParentsRecursive()) }
    return all
  }

  fun getAllParentContexts(): Set<TaxonomyContext> =
      getAllParentsRecursive().flatMapTo(HashSet()) { it.contexts }

  val contextType: String?
    get() {
      val contentUri = contentUri ?: return null
      if (contentUri.schemeSpecificPart.startsWith("learningpath")) return "learningpath"
      if (NodeType.TOPIC == nodeType) return "topic-article"
      if (contentUri.schemeSpecificPart.startsWith("article")) return "standard"
      return null
    }

  var isContext: Boolean
    get() = context
    set(context) {
      this.context = context
    }

  fun addContextIds(contextId: Set<String>) {
    this.contextIds.addAll(contextId)
  }

  override val entityName: String
    get() = nodeType.typeName

  override var publicId: URI
    get() = super.publicId
    set(publicId) {
      val idParts = publicId.toString().split(":").dropLastWhile { it.isEmpty() }.toTypedArray()
      ident = idParts.copyOfRange(2, idParts.size).joinToString(":")
    }

  fun name(name: String?): Node {
    this.name = name
    return this
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

  @PreRemove
  fun preRemove() {
    childConnections.toList().forEach { it.disassociate() }
    parentConnections.toList().forEach { it.disassociate() }
  }

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other == null || javaClass != other.javaClass) return false
    val that = other as Node
    return context == that.context &&
        contentUri == that.contentUri &&
        nodeType == that.nodeType &&
        ident == that.ident &&
        translations == that.translations &&
        this.customfields == that.customfields &&
        this.visible == that.visible &&
        this.grepcodes == that.grepcodes
  }

  val primaryNode: Node?
    get() {
      for (node in this.parentConnections) {
        if (node.isPrimary) return node.parent
      }
      return null
    }

  override fun getCustomFields(): Map<String, String> = this.customfields

  fun addGrepCode(code: String) {
    val now = Instant.now().toString()
    val newGrepCode = JsonGrepCode(code, now, now)
    this.grepcodes += newGrepCode
  }

  fun translatedPrettyNames(): Set<String> {
    val pretties =
        this.translations.mapNotNullTo(HashSet()) { it.name?.let(PrettyUrlUtil::prettyName) }
    prettyName?.let { pretties.add(it) }
    return pretties
  }

  val prettyName: String?
    get() = getTranslatedName(Constants.DefaultLanguage)?.let(PrettyUrlUtil::prettyName)

  companion object {
    private val logger = LoggerFactory.getLogger(Node::class.java)
  }
}

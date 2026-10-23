/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service

import java.net.URI
import no.ndla.taxonomy.config.Constants
import no.ndla.taxonomy.domain.LanguageField
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeConnection
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.Relevance
import no.ndla.taxonomy.domain.TaxonomyContext
import no.ndla.taxonomy.repositories.NodeConnectionRepository
import no.ndla.taxonomy.repositories.NodeRepository
import no.ndla.taxonomy.rest.NotFoundHttpResponseException
import no.ndla.taxonomy.rest.v1.dtos.searchapi.LanguageFieldDTO
import no.ndla.taxonomy.rest.v1.dtos.searchapi.SearchableTaxonomyResourceType
import no.ndla.taxonomy.rest.v1.dtos.searchapi.TaxonomyContextDTO
import no.ndla.taxonomy.rest.v1.dtos.searchapi.TaxonomyCrumbDTO
import no.ndla.taxonomy.service.dtos.ConnectionDTO
import no.ndla.taxonomy.service.dtos.NodeChildDTO
import no.ndla.taxonomy.service.dtos.NodeDTO
import no.ndla.taxonomy.service.exceptions.NotFoundServiceException
import no.ndla.taxonomy.util.PrettyUrlUtil
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Transactional(readOnly = true)
@Service
class NodeService(
    private val domainEntityHelperService: DomainEntityHelperService,
    private val connectionService: NodeConnectionService,
    private val nodeConnectionRepository: NodeConnectionRepository,
    private val nodeRepository: NodeRepository,
    private val recursiveNodeTreeService: RecursiveNodeTreeService,
    private val treeSorter: TreeSorter,
    private val contextUpdaterService: ContextUpdaterService,
) {
  private val logger = LoggerFactory.getLogger(javaClass.name)

  @Transactional
  fun delete(publicId: URI) {
    val nodeToDelete =
        nodeRepository.findFirstByPublicId(publicId)
            ?: throw NotFoundServiceException("Node was not found")

    connectionService.disconnectAllParents(nodeToDelete)
    connectionService.disconnectAllChildren(nodeToDelete)

    nodeRepository.delete(nodeToDelete)
    nodeRepository.flush()
  }

  fun getNodesByType(
      nodeType: List<NodeType>?,
      language: String,
      publicIds: List<URI>?,
      contentUri: URI?,
      contextId: String?,
      contextIds: List<String>?,
      isRoot: Boolean?,
      isContext: Boolean?,
      metadataFilters: MetadataFilters,
      includeContexts: Boolean,
      filterProgrammes: Boolean,
      includeParents: Boolean,
      rootId: URI?,
      parentId: URI?,
  ): List<NodeDTO> {
    val listToReturn = ArrayList<NodeDTO>()
    val ids =
        if (contextId != null || contextIds != null) {
          val input = (contextIds ?: listOfNotNull(contextId)).toTypedArray()
          nodeRepository.findIdsByContextIds(input)
        } else {
          nodeRepository.findIdsFiltered(
              nodeType,
              publicIds,
              metadataFilters.key,
              metadataFilters.likeQueryValue,
              contentUri,
              isRoot,
              isContext,
          )
        }
    val root = rootId?.let { getNode(it) }
    val parent = parentId?.let { getNode(it) }
    ids.chunked(1000).forEach { idChunk ->
      val nodes = nodeRepository.findByIds(idChunk)
      val parentContexts = if (includeParents) prefetchParentContexts(nodes) else null
      nodes.mapTo(listToReturn) { node ->
        NodeDTO(
            root,
            parent,
            node,
            NodeConnectionType.BRANCH,
            language,
            contextId,
            includeContexts,
            filterProgrammes,
            metadataFilters.visible ?: false,
            includeParents,
            parentContexts,
        )
      }
    }

    return listToReturn
  }

  private fun prefetchParentContexts(nodes: Collection<Node>): Set<TaxonomyContext> {
    val ancestorIds =
        nodes
            .asSequence()
            .flatMap { it.contexts }
            .flatMap { it.parentIds }
            .mapTo(HashSet()) { URI.create(it) }
    if (ancestorIds.isEmpty()) {
      return emptySet()
    }
    return nodeRepository.findByPublicIds(ancestorIds).flatMapTo(HashSet()) { it.contexts }
  }

  fun getAllConnections(nodePublicId: URI): List<ConnectionDTO> {
    val node =
        nodeRepository.findFirstByPublicId(nodePublicId)
            ?: throw NotFoundServiceException("Node was not found")

    return buildList {
      connectionService.getParentConnections(node).mapTo(this) {
        ConnectionDTO.parentConnection(it)
      }
      connectionService.getChildConnections(node).mapTo(this) { ConnectionDTO.childConnection(it) }
    }
  }

  fun getNode(
      publicId: URI,
      language: String,
      rootId: URI?,
      parentId: URI?,
      includeContexts: Boolean,
      filterProgrammes: Boolean,
      isVisible: Boolean,
  ): NodeDTO {
    val node = getNode(publicId)
    val root = rootId?.let { getMaybeNode(it) }
    val parent = parentId?.let { getMaybeNode(it) }
    return NodeDTO(
        root,
        parent,
        node,
        NodeConnectionType.BRANCH,
        language,
        null,
        includeContexts,
        filterProgrammes,
        isVisible,
        true,
        prefetchParentContexts(listOf(node)),
    )
  }

  fun getMaybeNode(publicId: URI): Node? = nodeRepository.findFirstByPublicId(publicId)

  fun getNode(publicId: URI): Node =
      getMaybeNode(publicId) ?: throw NotFoundHttpResponseException("Node was not found")

  fun getResourcesByNodeId(
      nodePublicId: URI,
      resourceTypeIds: List<URI>?,
      relevanceId: URI?,
      languageCode: String?,
      recursive: Boolean,
      includeContexts: Boolean,
      filterProgrammes: Boolean,
      isVisible: Boolean,
  ): List<NodeChildDTO> {
    val node = domainEntityHelperService.getNodeByPublicId(nodePublicId)

    val topicIdsToSearchFor: Set<URI>

    // Add both topics and resourceTopics to a common list that will be sorted in a tree-structure
    // based on rank at each level
    val resourcesToSort = HashSet<ResourceTreeSortable>()

    // Populate a list of topic IDs we are going to fetch first, and then fetch the actual topics
    // later
    // This allows searching recursively without having to fetch the whole relation tree on each
    // element in the recursive logic. It is also necessary to have the tree information later for
    // ordering the result
    if (recursive) {
      val nodeList = recursiveNodeTreeService.getRecursiveNodes(node)

      nodeList.forEach { treeElement ->
        resourcesToSort.add(
            ResourceTreeSortable(
                "node",
                "node",
                treeElement.id,
                treeElement.parentId ?: URI.create(""),
                treeElement.rank,
            ))
      }

      topicIdsToSearchFor = nodeList.mapTo(HashSet()) { it.id }
    } else {
      topicIdsToSearchFor = setOf(node.publicId)
    }

    return filterNodeResourcesByIdsAndReturn(
        node,
        topicIdsToSearchFor,
        resourceTypeIds,
        relevanceId,
        resourcesToSort,
        languageCode,
        includeContexts,
        filterProgrammes,
        isVisible,
    )
  }

  private fun filterNodeResourcesByIdsAndReturn(
      root: Node,
      nodeIds: Set<URI>,
      resourceTypeIds: List<URI>?,
      relevanceId: URI?,
      sortableListToAddTo: MutableSet<ResourceTreeSortable>,
      languageCode: String?,
      includeContexts: Boolean,
      filterProgrammes: Boolean,
      isVisible: Boolean,
  ): List<NodeChildDTO> {
    var nodeResources =
        nodeConnectionRepository.getResourceBy(
            nodeIds.mapTo(HashSet()) { it.toString() },
            resourceTypeIds?.map { it.toString() }?.toTypedArray(),
            relevanceId?.let { Relevance.findRelevanceById(it) }?.name,
        )
    if (relevanceId != null) {
      val isRequestingCore = "urn:relevance:core" == relevanceId.toString()
      nodeResources =
          nodeResources.filter { nodeResource ->
            if (nodeResource.connectionType != NodeConnectionType.BRANCH) return@filter false

            if (nodeResource.child == null) {
              return@filter false
            }
            val rel = nodeResource.relevance
            if (rel != null) {
              rel.id == relevanceId
            } else {
              isRequestingCore
            }
          }
    }

    nodeResources.forEach { sortableListToAddTo.add(ResourceTreeSortable(it)) }

    // Sort the list, extract all the topicResource objects in between topics and return list of
    // documents
    return treeSorter
        .sortList(sortableListToAddTo)
        .asSequence()
        .mapNotNull { it.resourceConnection as NodeConnection? }
        .filter { it.child?.nodeType == NodeType.RESOURCE }
        .map { nodeConnection ->
          NodeChildDTO(
              root,
              nodeConnection,
              languageCode ?: Constants.DefaultLanguage,
              includeContexts,
              filterProgrammes,
              isVisible,
          )
        }
        .toList()
  }

  @Transactional
  fun makeAllResourcesPrimary(nodePublicId: URI, recursive: Boolean): Boolean {
    val node =
        nodeRepository.findFirstByPublicId(nodePublicId)
            ?: throw NotFoundServiceException("Node was not found")
    if (recursive) {
      node.getChildConnections().forEach { nc ->
        nc.child
            ?.takeIf { it.nodeType != NodeType.RESOURCE }
            ?.let { makeAllResourcesPrimary(it.publicId, true) }
      }
    }

    node.resourceChildren.forEach { cc ->
      connectionService.updateParentChild(cc, cc.relevance, cc.rank, true)
    }

    return node.resourceChildren.all { it.isPrimary }
  }

  fun cloneNode(publicId: URI, contentUri: URI?): Node {
    val node = getNode(publicId)
    val cloned = Node(node, false)
    cloned.contentUri = contentUri // Set to null if not provided
    return nodeRepository.save(cloned)
  }

  fun getSearchableByContentUri(
      contentURI: URI?,
      filterVisibles: Boolean,
      language: String,
  ): List<TaxonomyContextDTO> {
    val nodes = nodeRepository.findByContentUri(contentURI)
    val contextDtos = nodesToContexts(nodes, filterVisibles, language)

    return contextDtos.sortedBy { it.path }
  }

  fun nodesToContexts(
      nodes: List<Node>,
      filterVisibles: Boolean,
      language: String,
  ): List<TaxonomyContextDTO> {
    val allParentContexts = prefetchParentContexts(nodes)
    return buildList {
      for (node in nodes) {
        val contexts =
            if (filterVisibles) node.contexts.filterTo(HashSet()) { it.isVisible }
            else node.contexts
        val resourceTypes = node.resourceTypes.map(::SearchableTaxonomyResourceType)
        val nodeName = LanguageField.fromNode(node)
        contexts.mapTo(this) { context ->
          val relevance = Relevance.findRelevanceById(URI.create(context.relevanceId))
          val relevanceName = relevance?.let { LanguageField.fromRelevance(it) } ?: LanguageField()
          val breadcrumbs = context.breadcrumbs
          val parents =
              context.parentContextIds.mapNotNull { parentCtxId ->
                val p = allParentContexts.firstOrNull { it.contextId == parentCtxId }
                if (p != null) {
                  val url =
                      PrettyUrlUtil.createPrettyUrl(
                          context.rootName,
                          p.name,
                          language,
                          parentCtxId,
                          p.nodeType,
                      )
                  TaxonomyCrumbDTO(
                      URI.create(p.publicId),
                      parentCtxId,
                      LanguageFieldDTO.fromLanguageField(p.name),
                      p.path,
                      url ?: p.path,
                  )
                } else {
                  null
                }
              }
          val url =
              PrettyUrlUtil.createPrettyUrl(
                  context.rootName,
                  nodeName,
                  language,
                  context.contextId,
                  node.nodeType,
              ) ?: context.path

          val defaultUrl =
              PrettyUrlUtil.createPrettyUrl(
                  context.rootName,
                  nodeName,
                  Constants.DefaultLanguage,
                  context.contextId,
                  node.nodeType,
              ) ?: context.path

          TaxonomyContextDTO(
              node.publicId,
              node.publicId,
              URI.create(context.rootId),
              LanguageFieldDTO.fromLanguageField(context.rootName),
              context.path,
              LanguageFieldDTO.fromLanguageFieldList(breadcrumbs),
              context.contextType,
              URI.create(context.relevanceId),
              LanguageFieldDTO.fromLanguageField(relevanceName),
              resourceTypes,
              context.parentIds.map(URI::create),
              context.parentContextIds.toList(),
              context.isPrimary,
              context.isActive,
              context.isVisible,
              context.isArchived,
              context.contextId,
              context.rank,
              context.connectionId,
              url,
              defaultUrl,
              parents,
          )
        }
      }
    }
  }

  @Async
  @Transactional
  fun buildAllContextsAsync() {
    buildAllContexts()
  }

  @Transactional
  protected fun buildAllContexts(): List<Node> {
    logger.info("Building contexts for all roots in schema")
    val startTime = System.currentTimeMillis()
    val rootNodes = nodeRepository.findProgrammes()
    rootNodes.forEach { contextUpdaterService.updateContexts(it) }
    logger.info(
        "Building contexts for all roots. took {} ms",
        System.currentTimeMillis() - startTime,
    )
    return rootNodes
  }

  fun getContextByPath(path: String?, language: String): List<TaxonomyContextDTO> =
      path?.let { getContextByContextId(PrettyUrlUtil.getHashFromPath(it), language) }
          ?: emptyList()

  fun getContextByContextId(contextId: String?, language: String): List<TaxonomyContextDTO> {
    if (contextId == null) {
      return emptyList()
    }
    val ids = nodeRepository.findIdsByContextId(contextId)
    val nodes = nodeRepository.findByIds(ids)
    val contexts = nodesToContexts(nodes, false, language)
    return contexts.filter { it.contextId == contextId }
  }
}

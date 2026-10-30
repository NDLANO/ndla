/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service.dtos

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import java.net.URI
import java.time.Instant
import java.util.TreeSet
import no.ndla.taxonomy.config.Constants
import no.ndla.taxonomy.domain.LanguageField
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeConnectionType
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.Relevance
import no.ndla.taxonomy.domain.TaxonomyContext
import no.ndla.taxonomy.rest.v1.dtos.ResourceTypeWithConnectionDTO
import no.ndla.taxonomy.rest.v1.dtos.searchapi.LanguageFieldDTO
import no.ndla.taxonomy.rest.v1.dtos.searchapi.SearchableTaxonomyResourceType
import no.ndla.taxonomy.rest.v1.dtos.searchapi.TaxonomyContextDTO
import no.ndla.taxonomy.rest.v1.dtos.searchapi.TaxonomyCrumbDTO
import no.ndla.taxonomy.util.PrettyUrlUtil

@Schema(
    name = "Node",
    requiredProperties =
        [
            "id",
            "baseName",
            "name",
            "nodeType",
            "metadata",
            "translations",
            "supportedLanguages",
            "breadcrumbs",
            "resourceTypes",
            "updatedAt",
            "contexts",
            "contextids",
            "language",
            "paths",
        ],
)
open class NodeDTO() {
  @field:Schema(
      description = "Node id",
      example = "urn:topic:234",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  lateinit var id: URI
    private set

  @field:Schema(description = "The stored name of the node", example = "Trigonometry")
  var baseName: String? = null
    private set

  @field:Schema(description = "The possibly translated name of the node", example = "Trigonometry")
  var name: String? = null
    private set

  @field:Schema(
      description =
          "ID of content introducing this node. Must be a valid URI, but preferably not a URL.",
      example = "urn:article:1",
  )
  var contentUri: URI? = null
    private set

  @field:Schema(
      description = "The primary path for this node. Can be empty if no context",
      example = "/subject:1/topic:1",
  )
  var path: String? = null
    private set

  @field:Schema(
      description = "List of all paths to this node",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  var paths: List<String> = listOf()
    private set

  @field:Schema(
      description = "Metadata for entity. Read only.",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  @field:JsonInclude(JsonInclude.Include.NON_NULL)
  lateinit var metadata: MetadataDTO
    private set

  @field:Schema(description = "Relevance id", example = "urn:relevance:core")
  var relevanceId: URI? = null

  @field:Schema(
      description = "All translations of this node",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  var translations: Set<TranslationDTO> = TreeSet()
    private set

  @field:Schema(
      description = "List of language codes supported by translations",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  var supportedLanguages: Set<String> = TreeSet()
    private set

  @field:Schema(
      description = "List of names in the path",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  var breadcrumbs: List<String> = ArrayList()
    private set

  @field:JsonProperty
  @field:Schema(
      description = "Resource type(s)",
      example = "[{\"id\": \"urn:resourcetype:1\",\"name\":\"lecture\"}]",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  var resourceTypes: Set<ResourceTypeWithConnectionDTO> = TreeSet()
    private set

  @field:JsonProperty
  @field:Schema(
      description = "The type of node",
      example = "resource",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  lateinit var nodeType: NodeType

  @field:JsonProperty
  @field:Schema(description = "An id unique for this context.")
  var contextId: String? = null
    private set

  @field:JsonProperty
  @field:Schema(description = "A pretty url based on name and context. Empty if no context.")
  var url: String? = null
    private set

  @field:JsonProperty
  @field:Schema(description = "A pretty url based on the name and context in the default language.")
  var defaultUrl: String? = null
    private set

  @field:JsonProperty
  @field:Schema(
      description = "A list of all contexts this node is part of",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  var contexts: List<TaxonomyContextDTO> = ArrayList()
    private set

  @field:JsonProperty
  @field:Schema(
      description = "A list of all contextids this node has ever had",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  var contextids: Set<String> = HashSet()
    private set

  @field:JsonProperty
  @field:Schema(description = "The context object selected when fetching node")
  var context: TaxonomyContextDTO? = null
    private set

  @field:Schema(
      description = "The language code for which name is returned",
      example = "nb",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  lateinit var language: String
    private set

  @field:JsonProperty
  @field:Schema(description = "Quality evaluation of the article")
  var qualityEvaluation: QualityEvaluationDTO? = null
    private set

  @field:JsonProperty
  @field:Schema(
      description = "A number representing the average grade of all children nodes recursively.")
  var gradeAverage: GradeAverageDTO? = null
    private set

  @field:JsonProperty
  @field:Schema(description = "The technical evaluation of the node.")
  var technicalEvaluation: TechnicalEvaluationDTO? = null
    private set

  @field:JsonProperty
  @field:Schema(
      description = "Url safe names for the node.",
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  var urlName: Set<String> = TreeSet()
    private set

  @field:JsonProperty
  @field:Schema(description = "Url safe name for the node in the default language.")
  var defaultUrlName: String? = null
    private set

  @field:JsonProperty
  @field:Schema(description = "When was this last updated.")
  var updatedAt: Instant? = null
    private set

  @JvmOverloads
  constructor(
      root: Node?,
      parent: Node?,
      entity: Node,
      connectionType: NodeConnectionType,
      languageCode: String,
      contextId: String?,
      includeContexts: Boolean,
      filterProgrammes: Boolean,
      isVisible: Boolean,
      includeParents: Boolean,
      prefetchedParentContexts: Set<TaxonomyContext>? = null,
  ) : this() {
    val contexts = entity.contexts
    val visibleContexts = if (isVisible) contexts.filterTo(HashSet()) { it.isVisible } else contexts
    val filteredContexts =
        visibleContexts.filterTo(HashSet()) { ctx ->
          !filterProgrammes || !ctx.rootId.contains(NodeType.PROGRAMME.typeName)
        }

    this.qualityEvaluation = QualityEvaluationDTO.fromNode(entity)
    this.gradeAverage = GradeAverageDTO.fromNode(entity)
    this.technicalEvaluation = TechnicalEvaluationDTO.fromNode(entity)
    this.id = entity.publicId
    this.contentUri = entity.contentUri

    this.paths = filteredContexts.map { it.path }
    this.path = entity.primaryPath ?: paths.firstOrNull()

    this.translations = entity.translations.mapTo(TreeSet()) { TranslationDTO(it) }
    this.supportedLanguages = this.translations.mapTo(TreeSet()) { it.language }

    this.urlName = entity.translatedPrettyNames()
    this.defaultUrlName = entity.prettyName

    this.language = languageCode // TODO: Must handle programmes and subject better
    // this.language = supportedLanguages.contains(languageCode)
    //        ? languageCode
    //        : supportedLanguages.isEmpty() ? Constants.DefaultLanguage :
    // supportedLanguages.first();

    this.baseName = entity.name

    this.name = entity.getTranslatedName(this.language)

    this.metadata = MetadataDTO(entity.metadata)

    this.resourceTypes =
        entity.resourceTypes.mapTo(TreeSet()) { resourceType ->
          ResourceTypeWithConnectionDTO(entity.publicId, resourceType, this.language)
        }

    this.nodeType = entity.nodeType
    this.contextids = entity.contextIds
    this.updatedAt = entity.getUpdatedAt()

    val parentContexts =
        if (includeParents) prefetchedParentContexts ?: entity.getAllParentContexts() else setOf()
    val selected = entity.pickContext(contextId, parent, root, connectionType, filteredContexts)
    selected?.let { ctx ->
      val contextDto = getTaxonomyContextDTO(entity, ctx, parentContexts)

      // TODO: this changes the content in context breadcrumbs
      val breadcrumbList =
          LanguageField.listFromLists(ctx.breadcrumbs, LanguageField.fromNode(entity))
      this.breadcrumbs = breadcrumbList.fromLanguage(this.language) ?: listOf()

      this.path = contextDto.path
      this.relevanceId = contextDto.relevanceId
      this.contextId = contextDto.contextId
      this.url = contextDto.url
      this.defaultUrl = contextDto.defaultUrl
      this.context = contextDto
    }

    if (includeContexts) {
      this.contexts =
          filteredContexts.map { ctx -> getTaxonomyContextDTO(entity, ctx, parentContexts) }
    }
  }

  private fun getTaxonomyContextDTO(
      entity: Node,
      ctx: TaxonomyContext,
      parentContexts: Collection<TaxonomyContext>,
  ): TaxonomyContextDTO {
    val parents =
        ctx.parentContextIds.mapNotNull { parentCtxId ->
          val p =
              parentContexts.firstOrNull { it.contextId == parentCtxId } ?: return@mapNotNull null
          val url =
              PrettyUrlUtil.createPrettyUrl(
                  ctx.rootName,
                  p.name,
                  this.language,
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
        }

    val relevance = Relevance.getRelevance(URI.create(ctx.relevanceId))
    val url =
        PrettyUrlUtil.createPrettyUrl(
            ctx.rootName,
            LanguageField.fromNode(entity),
            this.language,
            ctx.contextId,
            entity.nodeType,
        ) ?: ctx.path

    val defaultUrl =
        PrettyUrlUtil.createPrettyUrl(
            ctx.rootName,
            LanguageField.fromNode(entity),
            Constants.DefaultLanguage,
            ctx.contextId,
            entity.nodeType,
        ) ?: ctx.path

    return TaxonomyContextDTO(
        entity.publicId,
        entity.publicId,
        URI.create(ctx.rootId),
        LanguageFieldDTO.fromLanguageField(ctx.rootName),
        ctx.path,
        LanguageFieldDTO.fromLanguageFieldList(ctx.breadcrumbs),
        entity.contextType,
        URI.create(ctx.relevanceId),
        LanguageFieldDTO.fromLanguageField(LanguageField.fromRelevance(relevance)),
        entity.resourceTypes
            .sortedWith { o1, o2 ->
              if (o1.parent == null) return@sortedWith -1
              if (o2.parent == null) return@sortedWith 1
              0
            }
            .map(::SearchableTaxonomyResourceType),
        ctx.parentIds.map(URI::create),
        ctx.parentContextIds,
        ctx.isPrimary,
        ctx.isActive,
        ctx.isVisible,
        ctx.isArchived,
        ctx.contextId,
        ctx.rank,
        ctx.connectionId,
        url,
        defaultUrl,
        parents,
    )
  }
}

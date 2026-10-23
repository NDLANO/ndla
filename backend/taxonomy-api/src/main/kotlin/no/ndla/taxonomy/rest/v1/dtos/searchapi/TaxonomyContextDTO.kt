/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1.dtos.searchapi

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import java.io.Serializable
import java.net.URI

// NOTE: This will need to match `SearchableTaxonomyContext` in `search-api`
@Schema(
    name = "TaxonomyContext",
    requiredProperties =
        [
            "id",
            "publicId",
            "rootId",
            "root",
            "path",
            "breadcrumbs",
            "resourceTypes",
            "parentIds",
            "isPrimary",
            "isActive",
            "isVisible",
            "isArchived",
            "contextId",
            "rank",
            "connectionId",
            "url",
            "defaultUrl",
            "parents",
            "parentContextIds",
            "relevanceId",
            "relevance",
        ],
)
@JvmRecord
data class TaxonomyContextDTO(
    @JsonProperty
    @field:Schema(description = "The publicId of the node connected via content-uri")
    val id: URI,
    @JsonProperty
    @field:Schema(
        description = "The publicId of the node connected via content-uri",
        deprecated = true,
    )
    val publicId: URI,
    @JsonProperty
    @field:Schema(description = "The publicId of the root parent of the context")
    val rootId: URI,
    @JsonProperty
    @field:Schema(description = "The name of the root parent of the context", types = ["object"])
    val root: LanguageFieldDTO<String>,
    @JsonProperty @field:Schema(description = "The context path") val path: String,
    @JsonProperty
    @field:Schema(
        description = "A breadcrumb of the names of the context's parents",
        types = ["object"],
    )
    val breadcrumbs: LanguageFieldDTO<List<String>>,
    @JsonProperty
    @field:Schema(
        description = "Whether a 'standard'-article, 'topic-article'-article or a 'learningpath'")
    val contextType: String?,
    @JsonProperty
    @field:Schema(description = "Id of the relevance of the parent connection")
    val relevanceId: URI,
    @JsonProperty
    @field:Schema(
        description = "Name of the relevance of the parent connection",
        types = ["object"],
    )
    val relevance: LanguageFieldDTO<String>,
    @JsonProperty
    @field:Schema(description = "Resource-types of the node")
    val resourceTypes: List<SearchableTaxonomyResourceType>,
    @JsonProperty @field:Schema(description = "List of all parent ids") val parentIds: List<URI>,
    @JsonProperty
    @field:Schema(description = "List of all parent contextIds")
    val parentContextIds: List<String>,
    @JsonProperty
    @field:Schema(description = "Whether the parent connection is primary or not")
    val isPrimary: Boolean,
    @JsonProperty
    @field:Schema(description = "Whether the parent connection is marked as active")
    val isActive: Boolean,
    @JsonProperty
    @field:Schema(description = "Whether the parent connection is visible or not")
    val isVisible: Boolean,
    @JsonProperty
    @field:Schema(description = "Whether the root is marked as archived")
    val isArchived: Boolean,
    @JsonProperty
    @field:Schema(description = "Unique id of context based on root + parent connection")
    val contextId: String,
    @JsonProperty
    @field:Schema(description = "The rank of the parent connection object")
    val rank: Int,
    @JsonProperty
    @field:Schema(description = "The id of the parent connection object")
    val connectionId: String?,
    @JsonProperty
    @field:Schema(description = "Pretty-url of this particular context")
    val url: String,
    @JsonProperty
    @field:Schema(description = "Pretty-url of this particular context in the default language")
    val defaultUrl: String,
    @JsonProperty
    @field:Schema(
        description = "List of all parents to this context. Empty if node is fetched as child")
    val parents: List<TaxonomyCrumbDTO>,
) : Serializable

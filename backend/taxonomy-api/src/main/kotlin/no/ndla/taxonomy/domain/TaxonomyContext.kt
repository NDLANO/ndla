/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import java.io.Serializable

/**
 * Identifies a unique context for any node. A context is a position for a node in the structure,
 * identified by root node and parent-connection
 *
 * @param publicId The publicId of the node.
 * @param name The name of the node.
 * @param nodeType The type of the node.
 * @param rootId The publicId of the node at the root of the context.
 * @param rootName The name of the root.
 * @param path The path for this connection.
 * @param breadcrumbs Breadcrumbs corresponding with the path.
 * @param contextType Type resource. Fetched from node.
 * @param parentIds Parents ids.
 * @param parentContextIds Parents context ids.
 * @param isVisible Metadata from node.
 * @param isActive Metadata from node. True if subjectCategory is active or otherResources.
 * @param isPrimary Is this context marked as primary. From nodeConnection.
 * @param isArchived Metadata from node. True if subjectType is 'archiveSubject'.
 * @param relevanceId ID of relevance. From nodeConnection.
 * @param contextId Hash of root publicId + nodeConnection publicId. Unique for this context.
 * @param rank The rank of the context. From nodeConnection.
 * @param connectionId The id of the connection. From nodeConnection.
 * @param parents
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@JvmRecord
data class TaxonomyContext(
    val publicId: String,
    val name: LanguageField<String>,
    val nodeType: NodeType,
    val rootId: String,
    val rootName: LanguageField<String>,
    val path: String,
    val breadcrumbs: LanguageField<MutableList<String>>,
    val contextType: String?,
    val parentIds: List<String>,
    val parentContextIds: List<String>,
    val isVisible: Boolean,
    val isActive: Boolean,
    val isPrimary: Boolean,
    val isArchived: Boolean,
    val relevanceId: String?,
    val contextId: String,
    val rank: Int,
    val connectionId: String?,
    val parents: List<TaxonomyCrumb>?,
) : Serializable

/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import java.io.Serializable

/**
 * Represents the parents for the contexts of a node.
 *
 * @param id The publicId of the parent.
 * @param nodeType The nodeType of the parent.
 * @param contextId The URN of the parent context.
 * @param name The name of the parent.
 * @param path The path to the parent.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@JvmRecord
data class TaxonomyCrumb(
    val id: String?,
    @Enumerated(EnumType.STRING) val nodeType: NodeType?,
    val contextId: String?,
    val name: LanguageField<String>?,
    val path: String?,
) : Serializable

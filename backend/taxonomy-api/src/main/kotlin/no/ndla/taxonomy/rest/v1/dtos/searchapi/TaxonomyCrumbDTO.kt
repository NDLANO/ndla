/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1.dtos.searchapi

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import java.io.Serializable
import java.net.URI

@Schema(name = "TaxonomyCrumb", requiredProperties = ["id", "contextId", "name", "path", "url"])
@JvmRecord
data class TaxonomyCrumbDTO(
    @JsonProperty @field:Schema(description = "The publicId of the node") val id: URI,
    @JsonProperty
    @field:Schema(description = "Unique id of context based on root + parent connection")
    val contextId: String,
    @JsonProperty
    @field:Schema(description = "The name of the node")
    val name: LanguageFieldDTO<String>,
    @JsonProperty @field:Schema(description = "The context path") val path: String,
    @JsonProperty @field:Schema(description = "The context url") val url: String,
) : Serializable

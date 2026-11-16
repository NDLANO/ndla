/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import java.time.Instant

/** Read-only snapshot of an entity's metadata. Mutate through [EntityWithMetadata]. */
data class Metadata(
    val grepCodes: Set<JsonGrepCode>,
    val customFields: Map<String, String>,
    val isVisible: Boolean,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

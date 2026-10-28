/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import com.fasterxml.jackson.annotation.JsonProperty
import java.io.Serializable
import java.time.Instant

@JvmRecord
data class JsonGrepCode(
    @JsonProperty("code") val code: String?,
    @JsonProperty("created_at") val created_at: String?,
    @JsonProperty("updated_at") val updated_at: String?,
) : Serializable {
  constructor(copy: JsonGrepCode) : this(copy.code, copy.created_at, copy.updated_at)

  constructor(code: String?) : this(code, Instant.now().toString(), Instant.now().toString())
}

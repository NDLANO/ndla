/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.config

import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter
import java.net.URI

/*
 Auto converts URI data types used in domain objects to/from string type used in database
*/
@Suppress("unused")
@Converter(autoApply = true)
class UriTypeConverter : AttributeConverter<URI, String> {
  override fun convertToDatabaseColumn(uri: URI?): String? = uri?.toString()

  override fun convertToEntityAttribute(s: String?): URI? = s?.let { URI.create(it) }
}

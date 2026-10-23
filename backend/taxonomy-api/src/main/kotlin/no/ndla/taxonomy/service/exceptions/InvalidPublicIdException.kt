/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.service.exceptions

class InvalidPublicIdException(publicId: String) : Exception("Invalid publicId $publicId")

/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.security

import java.util.regex.Pattern

class JWTPermission(scope: String) {
  val api: String?
  val permission: String?

  init {
    val parts = COLON.split(scope)
    if (parts.size > 1) {
      this.api = parts[0].trim { it <= ' ' }
      this.permission = parts[1].trim { it <= ' ' }
    } else {
      this.api = null
      this.permission = null
    }
  }

  companion object {
    private val COLON: Pattern = Pattern.compile(":")
  }
}

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
  val environment: String?
  val permission: String?

  init {
    val parts = COLON.split(scope)
    if (parts.size > 1) {
      if (parts[0].contains("-")) {
        this.api = DASH.split(parts[0])[0].trim { it <= ' ' }
        this.environment = COLON.split(DASH.split(parts[0])[1])[0].trim { it <= ' ' }
        this.permission = parts[1].trim { it <= ' ' }
      } else {
        this.api = parts[0].trim { it <= ' ' }
        this.environment = null
        this.permission = parts[1].trim { it <= ' ' }
      }
    } else {
      this.api = null
      this.environment = null
      this.permission = null
    }
  }

  companion object {
    private val COLON: Pattern = Pattern.compile(":")
    private val DASH: Pattern = Pattern.compile("-")
  }
}

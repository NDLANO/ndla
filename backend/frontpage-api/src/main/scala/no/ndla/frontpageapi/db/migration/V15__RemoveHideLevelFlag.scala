/*
 * Part of NDLA frontpage-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.frontpageapi.db.migration

import io.circe.Json
import no.ndla.common.CirceUtil
import no.ndla.database.DocumentMigration

class V15__RemoveHideLevelFlag extends DocumentMigration {
  override val columnName: String = "document"
  override val tableName: String  = "mainfrontpage"

  private def removeHideLevel(json: Json): Json = json.mapObject { obj =>
    val withoutFlag = obj.remove("hideLevel")
    withoutFlag("menu") match {
      case Some(menu) => withoutFlag.add("menu", menu.mapArray(_.map(removeHideLevel)))
      case None       => withoutFlag
    }
  }

  override def convertColumn(value: String): String = {
    val document = CirceUtil.tryParse(value).get
    removeHideLevel(document).noSpaces
  }
}

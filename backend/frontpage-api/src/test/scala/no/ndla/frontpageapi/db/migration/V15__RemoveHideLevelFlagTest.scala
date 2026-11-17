/*
 * Part of NDLA frontpage-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.frontpageapi.db.migration

import no.ndla.frontpageapi.{TestEnvironment, UnitSuite}

class V15__RemoveHideLevelFlagTest extends UnitSuite with TestEnvironment {
  val migration = new V15__RemoveHideLevelFlag

  test("that hideLevel is removed from all menu levels") {
    val before =
      """{"menu":[{"menu":[{"menu":[],"articleId":38259,"hideLevel":false},{"menu":[{"menu":[{"menu":[],"articleId":38207,"hideLevel":true}],"articleId":38041,"hideLevel":false}],"articleId":38260,"hideLevel":false}],"articleId":38262,"hideLevel":false},{"menu":[],"articleId":38254,"hideLevel":true}],"articleId":38255}"""
    val after =
      """{"menu":[{"menu":[{"menu":[],"articleId":38259},{"menu":[{"menu":[{"menu":[],"articleId":38207}],"articleId":38041}],"articleId":38260}],"articleId":38262},{"menu":[],"articleId":38254}],"articleId":38255}"""

    migration.convertColumn(before) should be(after)
  }
}

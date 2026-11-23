/*
 * Part of NDLA search
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.search

import no.ndla.testbase.UnitTestSuiteBase

class IndexNameTest extends UnitTestSuiteBase {
  test("That every default index name is unique") {
    val set = IndexName.values.toSet
    set.size should be(IndexName.values.length)
  }

  test("That every default index name is a valid index name without underscores") {
    // Underscores are reserved as separator between the alias and timestamp of the underlying index, see
    // `BaseIndexService.getNewIndexName`
    val validName = "^[a-z0-9][a-z0-9-]*$".r
    IndexName.values.filterNot(n => validName.matches(n.defaultName)) shouldBe empty
  }
}

/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

data class GradeAverage(val averageSum: Int, val count: Int) {
  val averageValue: Double
    get() = averageSum.toDouble() / count

  companion object {
    fun fromGrades(grades: Collection<Grade?>): GradeAverage {
      val existing = grades.filterNotNull()
      return GradeAverage(existing.sumOf { it.toInt() }, existing.size)
    }
  }
}

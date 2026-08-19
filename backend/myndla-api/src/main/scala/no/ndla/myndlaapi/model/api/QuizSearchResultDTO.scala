/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.api

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import sttp.tapir.Schema.annotations.description

@description("Paginated list of quizzes")
case class QuizSearchResultDTO(
    @description("Total number of quizzes matching the query")
    totalCount: Long,
    @description("Current page number")
    page: Int,
    @description("Number of results per page")
    pageSize: Int,
    @description("Quiz results on this page")
    results: Seq[QuizDTO],
)
object QuizSearchResultDTO {
  implicit val encoder: Encoder[QuizSearchResultDTO] = deriveEncoder
  implicit val decoder: Decoder[QuizSearchResultDTO] = deriveDecoder
}

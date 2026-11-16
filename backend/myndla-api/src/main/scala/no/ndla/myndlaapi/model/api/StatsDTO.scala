/*
 * Part of NDLA myndla-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.api

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import sttp.tapir.Schema.annotations.description

@description("Stats for my-ndla usage")
case class StatsDTO(
    @description("The total number of users registered ")
    numberOfUsers: Long,
    @description("The total number of created folders")
    numberOfFolders: Long,
    @description("The total number of favourited resources ")
    numberOfResources: Long,
    @description("The total number of created tags")
    numberOfTags: Long,
    @description("The total number of favourited subjects")
    numberOfSubjects: Long,
    @description("The total number of shared folders")
    numberOfSharedFolders: Long,
    @description("The total number of learning paths in My NDLA")
    numberOfMyNdlaLearningPaths: Long,
    @description("Stats for type resources")
    favouritedResources: List[ResourceStatsDTO],
    @description("Stats for favourited resources")
    favourited: Map[String, Long],
    @description("Stats for the users")
    users: UserStatsDTO,
    @description("Stats for quizzes")
    quizzes: QuizStatsDTO,
)

object StatsDTO {
  implicit def encoder: Encoder[StatsDTO] = deriveEncoder
  implicit def decoder: Decoder[StatsDTO] = deriveDecoder
}

case class ResourceStatsDTO(
    @description("The type of favourited resouce")
    `type`: String,
    @description("The number of favourited resource")
    number: Long,
)

object ResourceStatsDTO {
  implicit def encoder: Encoder[ResourceStatsDTO] = deriveEncoder
  implicit def decoder: Decoder[ResourceStatsDTO] = deriveDecoder
}

case class UserStatsDTO(
    @description("The total number of users")
    total: Long,
    @description("The number of employees")
    employees: Long,
    @description("The number of students")
    students: Long,
    @description("The number of users with favourites")
    withFavourites: Long,
    @description("The number of users with no favourites")
    noFavourites: Long,
    @description("The number of users with learningpaths")
    withLearningpaths: Long,
    @description("The number of users in the arena")
    arena: Long,
)

object UserStatsDTO {
  implicit def encoder: Encoder[UserStatsDTO] = deriveEncoder
  implicit def decoder: Decoder[UserStatsDTO] = deriveDecoder
}

case class QuizStatsDTO(
    @description("The total number of created quizzes")
    total: Long,
    @description("The number of public quizzes")
    publicQuizzes: Long,
    @description("The total number of saved quizzes")
    saved: Long,
    @description("The number of distinct quizzes that have been saved by at least one user")
    distinctSaved: Long,
    @description("The number of quizzes that have been completed by at least one user")
    completed: Long,
    @description("The total number of completions across all quizzes")
    completions: Long,
    @description("The number of users that have created quizzes")
    usersWithQuizzes: Long,
    @description("The number of users that have saved quizzes")
    usersWithSavedQuizzes: Long,
)

object QuizStatsDTO {
  implicit def encoder: Encoder[QuizStatsDTO] = deriveEncoder
  implicit def decoder: Decoder[QuizStatsDTO] = deriveDecoder
}

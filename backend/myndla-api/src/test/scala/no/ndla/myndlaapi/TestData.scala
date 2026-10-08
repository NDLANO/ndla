/*
 * Part of NDLA myndla-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi

import no.ndla.common.Clock
import no.ndla.common.model.NDLADate
import no.ndla.common.model.api.myndla.MyNDLAUserDTO
import no.ndla.common.model.domain.ResourceType
import no.ndla.common.model.domain.myndla.{FolderStatus, MyNDLAUser, UserRole}
import no.ndla.myndlaapi.model.api
import no.ndla.myndlaapi.model.domain.{
  Alternative,
  DisplaySettings,
  GlossaryPair,
  NewFolderData,
  Question,
  QuestionType,
  Quiz,
  QuizStatus,
  Resource,
  ResourceDocument,
}
import no.ndla.myndlaapi.model.domain
import no.ndla.myndlaapi.service.FolderConverterService

import java.util.UUID

object TestData {
  val folderConverterService = FolderConverterService(using Clock())

  val today: NDLADate = NDLADate.now()

  val emptyDomainResource: Resource = Resource(
    id = UUID.randomUUID(),
    feideId = "",
    resourceType = ResourceType.Article,
    path = "",
    created = NDLADate.now(),
    tags = List.empty,
    resourceId = "1",
    connection = None,
  )

  val emptyDomainFolder: domain.Folder = domain.Folder(
    id = UUID.randomUUID(),
    feideId = "",
    parentId = None,
    name = "",
    status = FolderStatus.PRIVATE,
    subfolders = List.empty,
    resources = List.empty,
    rank = 1,
    created = today,
    updated = today,
    shared = None,
    description = None,
    user = None,
  )

  val baseFolderDocument: NewFolderData =
    NewFolderData(parentId = None, name = "some-name", status = FolderStatus.PRIVATE, rank = 1, description = None)

  val baseResourceDocument: ResourceDocument = ResourceDocument(tags = List.empty, resourceId = "1")

  val emptyApiFolder: api.FolderDTO = api.FolderDTO(
    id = UUID.randomUUID(),
    name = "",
    status = "",
    subfolders = List.empty,
    resources = List.empty,
    breadcrumbs = List.empty,
    parentId = None,
    rank = 1,
    created = today,
    updated = today,
    shared = None,
    description = None,
    owner = None,
  )

  val emptyMyNDLAUser: MyNDLAUser = MyNDLAUser(
    id = 1,
    feideId = "",
    favoriteSubjects = Seq.empty,
    userRole = UserRole.EMPLOYEE,
    lastUpdated = today,
    organization = "",
    groups = Seq.empty,
    username = "",
    displayName = "",
    email = "",
    arenaEnabled = false,
    lastSeen = today,
  )

  val emptyMyNdlaUserDto: MyNDLAUserDTO = folderConverterService.toApiUserData(emptyMyNDLAUser)

  val quizId = UUID.randomUUID()

  val singleChoiceQuestion = Question(
    id = "q1",
    questionType = QuestionType.SINGLE_CHOICE,
    language = "nb",
    title = "Hva er korrekt?",
    alternatives = Seq(
      Alternative("a1", "Feil alternativ", isCorrect = false),
      Alternative("a2", "Riktig alternativ", isCorrect = true),
    ),
    glossaryPairs = Seq.empty,
    created = today,
    updated = today,
  )

  val multiChoiceQuestion = Question(
    id = "q2",
    questionType = QuestionType.MULTI_CHOICE,
    language = "nb",
    title = "Velg alle riktige",
    alternatives = Seq(
      Alternative("b1", "Riktig 1", isCorrect = true),
      Alternative("b2", "Feil", isCorrect = false),
      Alternative("b3", "Riktig 2", isCorrect = true),
    ),
    glossaryPairs = Seq.empty,
    created = today,
    updated = today,
  )

  val matchingQuestion = Question(
    id = "q3",
    questionType = QuestionType.MATCHING,
    language = "nb",
    title = "Match glosene",
    alternatives = Seq.empty,
    glossaryPairs = Seq(GlossaryPair("cat", "katt"), GlossaryPair("dog", "hund")),
    created = today,
    updated = today,
  )

  def publicQuiz(questions: Question*) = Quiz(
    id = quizId,
    ownerId = "owner-feide-id",
    revision = Some(1),
    title = Seq.empty,
    description = Seq.empty,
    questions = questions,
    status = QuizStatus.PUBLIC,
    created = today,
    updated = today,
    updatedBy = "owner-feide-id",
    published = Some(today),
    displaySettings = DisplaySettings.default,
  )

  def privateQuiz = publicQuiz(singleChoiceQuestion).copy(status = QuizStatus.PRIVATE)
}

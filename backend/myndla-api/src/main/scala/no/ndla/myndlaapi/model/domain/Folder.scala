/*
 * Part of NDLA myndla-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import cats.implicits.catsSyntaxOptionId
import no.ndla.common.model.NDLADate
import no.ndla.myndlaapi.Props
import no.ndla.common.model.domain.myndla.{FolderStatus, MyNDLAUser}
import no.ndla.database.{ColumnName, Row}
import no.ndla.network.model.FeideID
import scalikejdbc.*

import java.util.UUID
import scala.util.{Failure, Success, Try}

case class NewFolderData(
    parentId: Option[UUID],
    name: String,
    status: FolderStatus.Value,
    rank: Int,
    description: Option[String],
) {
  def toFullFolder(
      id: UUID,
      feideId: FeideID,
      resources: List[Resource],
      subfolders: List[Folder],
      created: NDLADate,
      updated: NDLADate,
      shared: Option[NDLADate],
      user: Option[MyNDLAUser],
  ): Folder = {
    Folder(
      id = id,
      feideId = feideId,
      parentId = parentId,
      name = name,
      status = status,
      description = description,
      resources = resources,
      subfolders = subfolders,
      rank = rank,
      created = created,
      updated = updated,
      shared = shared,
      user = user,
    )
  }
}

case class Folder(
    id: UUID,
    feideId: FeideID,
    parentId: Option[UUID],
    name: String,
    status: FolderStatus.Value,
    description: Option[String],
    rank: Int,
    created: NDLADate,
    updated: NDLADate,
    resources: List[Resource],
    subfolders: List[Folder],
    shared: Option[NDLADate],
    user: Option[MyNDLAUser],
) extends FeideContent
    with Rankable
    with CopyableFolder {
  override val sortId: UUID          = id
  override val sortRank: Option[Int] = rank.some

  def isPrivate: Boolean = this.status == FolderStatus.PRIVATE
  def isShared: Boolean  = this.status == FolderStatus.SHARED

  def isClonable: Try[Folder] = {
    if (this.isShared || this.feideId.contains(feideId)) Success(this)
    else Failure(InvalidStatusException(s"Only folders with status ${FolderStatus.SHARED.toString} can be cloned"))
  }
}

object Folder {

  def fromResultSet(lp: SyntaxProvider[Folder])(row: Row): Try[Folder] =
    fromResultSet((s: String) => lp.resultName.c(s))(row)

  def fromResultSet(row: Row): Try[Folder] = fromResultSet((s: String) => s)(row)

  def fromResultSet(colNameWrapper: String => ColumnName)(row: Row): Try[Folder] = for {
    id          <- row.required[UUID](colNameWrapper("id"))
    parentId    <- row.optional[UUID](colNameWrapper("parent_id"))
    feideId     <- row.required[String](colNameWrapper("feide_id"))
    name        <- row.required[String](colNameWrapper("name"))
    status      <- row.required[String](colNameWrapper("status")).flatMap(FolderStatus.valueOfOrError)
    description <- row.optional[String](colNameWrapper("description"))
    rank        <- row.required[Int](colNameWrapper("rank"))
    created     <- row.required[NDLADate](colNameWrapper("created"))
    updated     <- row.required[NDLADate](colNameWrapper("updated"))
    shared      <- row.optional[NDLADate](colNameWrapper("shared"))
  } yield Folder(
    id = id,
    parentId = parentId,
    feideId = feideId,
    name = name,
    status = status,
    description = description,
    resources = List.empty,
    subfolders = List.empty,
    rank = rank,
    created = created,
    updated = updated,
    shared = shared,
    user = None,
  )
}

class DBFolder(using props: Props) extends SQLSyntaxSupport[Folder] {
  override def tableName: String          = "folders"
  override def schemaName: Option[String] = Some(props.MetaSchema)
}

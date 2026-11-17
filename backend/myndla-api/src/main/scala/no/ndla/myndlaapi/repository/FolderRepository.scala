/*
 * Part of NDLA myndla-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.repository

import cats.implicits.*
import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.errors.NotFoundException
import no.ndla.common.model.NDLADate
import no.ndla.common.model.domain.ResourceType
import no.ndla.common.model.domain.myndla.{FolderStatus, MyNDLAUser}
import no.ndla.common.{CirceUtil, Clock, UUIDUtil}
import no.ndla.database.{DBUtility, OptionalRow}
import no.ndla.database.implicits.*
import no.ndla.myndlaapi.uuidParameterFactory
import no.ndla.myndlaapi.model.domain.{
  BulkInserts,
  DBMyNDLAUser,
  DBFolder,
  DBResource,
  DBResourceConnection,
  DBSavedSharedFolder,
  Folder,
  ResourceConnection,
  NDLASQLException,
  NewFolderData,
  Resource,
  ResourceDocument,
  SavedSharedFolder,
}
import no.ndla.network.model.FeideID
import org.postgresql.util.PGobject
import scalikejdbc.*
import scalikejdbc.interpolation.SQLSyntax

import java.util.UUID
import scala.collection.IndexedSeq.iterableFactory
import scala.util.{Failure, Success, Try}

class FolderRepository(using
    clock: Clock,
    dbUtility: DBUtility,
    dbMyNDLAUser: DBMyNDLAUser,
    dbFolder: DBFolder,
    dbResourceConnection: DBResourceConnection,
    dbResource: DBResource,
    dbSavedSharedFolder: DBSavedSharedFolder,
) extends StrictLogging {
  def getSession(readOnly: Boolean): DBSession =
    if (readOnly) dbUtility.readOnlySession
    else dbUtility.autoSession

  def withTx[T](func: DBSession => T): T = dbUtility.localTx(func)

  def insertFolder(feideId: FeideID, folderData: NewFolderData)(implicit
      session: DBSession = dbUtility.autoSession
  ): Try[Folder] = Try {
    val newId   = UUIDUtil.randomUUID()
    val created = clock.now()
    val updated = created
    val shared  =
      if (folderData.status == FolderStatus.SHARED) Some(created)
      else None

    val column = dbFolder.column.c
    val _      = withSQL {
      insert
        .into(dbFolder)
        .namedValues(
          column("id")          -> newId,
          column("parent_id")   -> folderData.parentId,
          column("feide_id")    -> feideId,
          column("name")        -> folderData.name,
          column("status")      -> folderData.status.toString,
          column("rank")        -> folderData.rank,
          column("created")     -> created,
          column("updated")     -> updated,
          column("shared")      -> shared,
          column("description") -> folderData.description,
        )
    }.update()

    logger.info(s"Inserted new folder with id: $newId")
    folderData.toFullFolder(
      id = newId,
      feideId = feideId,
      resources = List.empty,
      subfolders = List.empty,
      created = created,
      updated = updated,
      shared = shared,
      user = None,
    )
  }

  def insertResource(
      feideId: FeideID,
      path: String,
      resourceType: ResourceType,
      created: NDLADate,
      document: ResourceDocument,
  )(implicit session: DBSession = dbUtility.autoSession): Try[Resource] = Try {
    val newId  = UUIDUtil.randomUUID()
    val column = dbResource.column.c

    val _ = withSQL {
      insert
        .into(dbResource)
        .namedValues(
          column("id")            -> newId,
          column("feide_id")      -> feideId,
          column("path")          -> path,
          column("resource_type") -> resourceType.entryName,
          column("created")       -> created,
          column("document")      -> dbUtility.asJsonb(document),
        )
    }.update()

    logger.info(s"Inserted new resource with id: $newId")
    document.toFullResource(newId, path, resourceType, feideId, created, None)
  }

  def createResourceConnection(folderId: Option[UUID], resourceId: UUID, rank: Int, favoritedDate: NDLADate)(implicit
      session: DBSession = dbUtility.autoSession
  ): Try[ResourceConnection] = Try {
    val _ = withSQL {
      insert
        .into(dbResourceConnection)
        .namedValues(
          dbResourceConnection.column.folderId      -> folderId,
          dbResourceConnection.column.resourceId    -> resourceId,
          dbResourceConnection.column.rank          -> rank,
          dbResourceConnection.column.favoritedDate -> favoritedDate,
        )
    }.update()
    logger.info(s"Inserted new folder-resource connection with folder id $folderId and resource id $resourceId")

    ResourceConnection(folderId = folderId, resourceId = resourceId, rank = rank, favoritedDate = favoritedDate)
  }

  def updateFolder(id: UUID, feideId: FeideID, folder: Folder)(implicit
      session: DBSession = dbUtility.autoSession
  ): Try[Folder] = Try {
    val column = dbFolder.column.c
    withSQL {
      update(dbFolder)
        .set(
          column("parent_id")   -> folder.parentId,
          column("name")        -> folder.name,
          column("status")      -> folder.status.toString,
          column("shared")      -> folder.shared,
          column("updated")     -> folder.updated,
          column("description") -> folder.description,
        )
        .where
        .eq(column("id"), id)
        .and
        .eq(column("feide_id"), feideId)
    }.update()
  } match {
    case Failure(ex)                  => Failure(ex)
    case Success(count) if count == 1 =>
      logger.info(s"Updated folder with id $id")
      Success(folder)
    case Success(count) =>
      Failure(NDLASQLException(s"This is a Bug! The expected rows count should be 1 and was $count."))
  }

  def updateFolderStatusInBulk(folderIds: List[UUID], newStatus: FolderStatus.Value)(implicit
      session: DBSession = dbUtility.autoSession
  ): Try[List[UUID]] = Try {
    val newSharedValue =
      if (newStatus == FolderStatus.SHARED) Some(clock.now())
      else None
    val column = dbFolder.column.c
    withSQL {
      update(dbFolder)
        .set(column("status") -> newStatus.toString, column("shared") -> newSharedValue)
        .where
        .in(column("id"), folderIds)
    }.update()
  } match {
    case Failure(ex)                                 => Failure(ex)
    case Success(count) if count == folderIds.length =>
      logger.info(s"Updated folders with ids (${folderIds.mkString(", ")})")
      Success(folderIds)
    case Success(count) =>
      Failure(NDLASQLException(s"This is a Bug! The expected rows count should be ${folderIds.length} and was $count."))
  }

  def updateResource(resource: Resource)(implicit session: DBSession = dbUtility.autoSession): Try[Resource] = {
    val dataObject = new PGobject()
    dataObject.setType("jsonb")
    dataObject.setValue(CirceUtil.toJsonString(resource))

    tsql"""
          update ${dbResource.table}
          set document=$dataObject
          where id=${resource.id}
      """.update() match {
      case Failure(ex)                  => Failure(ex)
      case Success(count) if count == 1 =>
        logger.info(s"Updated resource with id ${resource.id}")
        Success(resource)
      case Success(count) =>
        Failure(NDLASQLException(s"This is a Bug! The expected rows count should be 1 and was $count."))
    }
  }

  def resourceConnectionCount(resourceId: UUID)(implicit session: DBSession = dbUtility.autoSession): Try[Long] = {
    tsql"select count(*) from ${dbResourceConnection.table} where resource_id=$resourceId"
      .decode(_.required[Long]("count"))
      .runSingle()
      .map(_.getOrElse(0L))
  }

  def getConnection(folderId: Option[UUID], resourceId: UUID)(implicit
      session: DBSession = dbUtility.autoSession
  ): Try[Option[ResourceConnection]] = {
    val folderClause = folderId match {
      case Some(id) => sqls"folder_id=$id"
      case None     => sqls"folder_id is null"
    }
    tsql"select resource_id, folder_id, rank, favorited_date from ${dbResourceConnection.table} where resource_id=$resourceId and $folderClause"
      .decode(ResourceConnection.fromResultSet((s: String) => s))
      .runSingle()
  }

  def getConnections(folderId: Option[UUID])(implicit
      session: DBSession = dbUtility.autoSession
  ): Try[List[ResourceConnection]] =
    val folderClause = folderId match {
      case Some(id) => sqls"folder_id=$id"
      case None     => sqls"folder_id is null"
    }
    tsql"select resource_id, folder_id, rank, favorited_date from ${dbResourceConnection.table} where $folderClause order by rank ASC"
      .decode(ResourceConnection.fromResultSet((s: String) => s))
      .runList()

  def getConnectionsByPath(path: String, feideId: FeideID)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[List[ResourceConnection]] = {
    val fr = dbResourceConnection.syntax("fr")
    val r  = dbResource.syntax("r")

    tsql"""select ${fr.result.*} from ${dbResourceConnection.as(fr)}
            left join ${dbResource.as(r)}
                on ${fr.resourceId} = ${r.id}
            where ${r.path} = $path and ${r.feideId} = $feideId
            order by favorited_date DESC;
            """.decode(ResourceConnection.fromResultSet(fr)).runList()
  }

  def deleteFolder(id: UUID)(implicit session: DBSession = dbUtility.autoSession): Try[UUID] = {
    tsql"delete from ${dbFolder.table} where id = $id".update() match {
      case Failure(ex)                      => Failure(ex)
      case Success(numRows) if numRows != 1 => Failure(NotFoundException(s"Folder with id $id does not exist"))
      case Success(_)                       =>
        logger.info(s"Deleted folder with id $id")
        Success(id)
    }
  }

  def deleteResource(id: UUID)(implicit session: DBSession = dbUtility.autoSession): Try[UUID] = {
    tsql"delete from ${dbResource.table} where id = $id".update() match {
      case Failure(ex)                      => Failure(ex)
      case Success(numRows) if numRows != 1 => Failure(NotFoundException(s"Resource with id $id does not exist"))
      case Success(_)                       =>
        logger.info(s"Deleted resource with id $id")
        Success(id)
    }
  }

  def moveResourceConnection(resourceId: UUID, fromFolderId: Option[UUID], toFolderId: Option[UUID], newRank: Int)(
      implicit session: DBSession = dbUtility.autoSession
  ): Try[UUID] = {
    val fromFolderClause = fromFolderId match {
      case Some(id) => sqls"folder_id=$id"
      case None     => sqls"folder_id is null"
    }
    val setQuery = toFolderId match {
      case Some(id) => sqls"set folder_id=$id, rank=$newRank"
      case None     => sqls"set folder_id=null, rank=$newRank"
    }

    tsql"""
          update ${dbResourceConnection.table}
          $setQuery
          where $fromFolderClause and resource_id=$resourceId
        """.update() match {
      case Failure(ex)                  => Failure(ex)
      case Success(count) if count != 1 =>
        Failure(
          NotFoundException(
            s"Folder resource connection with folder_id $fromFolderId and resource_id $resourceId does not exist"
          )
        )
      case Success(_) => {
        logger.info(
          s"Moved folder-resource connection with folder_id $fromFolderId and resource_id $resourceId to folder_id $toFolderId"
        )
        Success(resourceId)
      }
    }
  }

  def deleteResourceConnection(folderId: Option[UUID], resourceId: UUID)(implicit
      session: DBSession = dbUtility.autoSession
  ): Try[UUID] =
    val folderClause = folderId match {
      case Some(id) => sqls"folder_id=$id"
      case None     => sqls"folder_id is null"
    }
    tsql"delete from ${dbResourceConnection.table} where $folderClause and resource_id=$resourceId".update() match {
      case Failure(ex)                      => Failure(ex)
      case Success(numRows) if numRows != 1 =>
        Failure(
          NotFoundException(
            s"Folder-Resource connection with folder_id $folderId and resource_id $resourceId does not exist"
          )
        )
      case Success(_) =>
        logger.info(s"Deleted folder-resource connection with folder_id $folderId and resource_id $resourceId")
        Success(resourceId)
    }

  def getAllFavorites(implicit session: DBSession): Try[Map[String, Map[String, Long]]] = tsql"""
          select count(*) as count, document->>'resourceId' as resource_id, resource_type
          from ${dbResourceConnection.table} fr
          inner join ${dbResource.table} r on fr.resource_id = r.id
          group by document->>'resourceId',resource_type
         """
    .decode(row =>
      for {
        count        <- row.required[Long]("count")
        resourceId   <- row.required[String]("resource_id")
        resourceType <- row.required[String]("resource_type")
      } yield (resourceType, resourceId, count)
    )
    .runList()
    .map(_.groupMap(_._1)((_, resourceId, count) => resourceId -> count).view.mapValues(_.toMap).toMap)

  /*
   * Gets the most recently favorited resources, independent from users! Used to display the "recently favorited" in ed.
   */
  def getRecentFavorited(size: Option[Int], excludeResourceTypes: List[ResourceType])(implicit
      session: DBSession = dbUtility.autoSession
  ): Try[List[Resource]] = {
    val fr    = dbResourceConnection.syntax("fr")
    val r     = dbResource.syntax("r")
    val where =
      if (excludeResourceTypes.nonEmpty) {
        sqls"""where ${r.resourceType} not in (${excludeResourceTypes.map(_.entryName)})"""
      } else {
        sqls""
      }
    tsql"""select ${r.result.*}, ${fr.result.*} from ${dbResourceConnection.as(fr)}
            left join ${dbResource.as(r)}
                on ${fr.resourceId} = ${r.id}
            $where
            order by favorited_date DESC
            limit ${size.getOrElse(1)}
           """
      .one(Resource.fromResultSet(r))
      .toMany(OptionalRow.presentWhen(fr.resultName.c("resource_id"))(ResourceConnection.fromResultSet(fr)))
      .map((resource, connections) => resource.copy(connection = connections.find(_.resourceId == resource.id)))
      .runList()
  }

  def numberOfFavouritesForResource(resourceId: String, resourceType: String)(implicit session: DBSession): Try[Long] =
    tsql"""
          select count(*) as count from ${dbResourceConnection.table} fr
          inner join ${dbResource.table} r on fr.resource_id = r.id
          where r.document->>'resourceId' = $resourceId
          and r.resource_type = $resourceType
       """.decode(_.required[Long]("count")).runSingle().map(_.getOrElse(0L))

  def numberOfUsersWithFavourites(implicit session: DBSession = dbUtility.autoSession): Try[Option[Long]] = tsql"""
           select count(distinct feide_id) as count from ${dbResource.table}
         """.decode(_.required[Long]("count")).runSingle()

  def numberOfUsersWithoutFavourites(implicit session: DBSession = dbUtility.autoSession): Try[Option[Long]] = tsql"""
           select count(distinct u.feide_id) as count from ${dbMyNDLAUser.table} u
           left join ${dbResource.table} r on u.feide_id = r.feide_id
           where r.feide_id is null
         """.decode(_.required[Long]("count")).runSingle()

  def folderWithId(id: UUID)(implicit session: DBSession = dbUtility.readOnlySession): Try[Folder] =
    folderWhere(sqls"f.id=$id").flatMap {
      case None         => Failure(NotFoundException(s"Folder with id $id does not exist"))
      case Some(folder) => Success(folder)
    }

  def folderWithFeideId(id: UUID, feideId: FeideID)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[Folder] = folderWhere(sqls"f.id=$id and f.feide_id=$feideId").flatMap {
    case None         => Failure(NotFoundException(s"Folder with id $id does not exist"))
    case Some(folder) => Success(folder)
  }

  def resourceWithId(id: UUID)(implicit session: DBSession = dbUtility.readOnlySession): Try[Resource] =
    resourceWhere(sqls"r.id=$id").flatMap({
      case None           => Failure(NotFoundException(s"Resource with id $id does not exist"))
      case Some(resource) => Success(resource)
    })

  def userResourcesWithIds(ids: List[UUID], feideId: FeideID)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[List[Resource]] = {
    resourcesWhere(sqls"r.feide_id=$feideId and r.id in ($ids)").flatMap({
      case resources if resources.size != ids.size => Failure(NotFoundException("Failed to find requested resources"))
      case resources                               => Success(resources)
    })
  }

  def userResourceWithId(path: String, feideId: FeideID)(implicit session: DBSession): Try[Option[Resource]] =
    resourceWhere(sqls"path=$path and feide_id=$feideId")

  def resourcesWithFeideId(feideId: FeideID, size: Int)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[List[Resource]] = resourcesWhere(sqls"r.feide_id=$feideId order by r.created desc limit $size")

  def resourceWithPathAndTypeAndFeideId(path: String, resourceType: ResourceType, feideId: FeideID)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[Option[Resource]] =
    resourceWhere(sqls"path=$path and resource_type=${resourceType.entryName} and feide_id=$feideId")

  def foldersWithFeideAndParentID(parentId: Option[UUID], feideId: FeideID)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[List[Folder]] = {
    val parentIdClause = parentId match {
      case Some(pid) => sqls"f.parent_id=$pid"
      case None      => sqls"f.parent_id is null"
    }
    foldersWhere(sqls"$parentIdClause and f.feide_id=$feideId order by f.rank ASC")
  }

  def buildTreeStructureFromListOfChildren(baseParentId: UUID, folders: List[Folder]): Option[Folder] = folders match {
    case Nil          => None
    case allTheStuffs => allTheStuffs.find(_.id == baseParentId) match {
        case None             => None
        case Some(mainParent) =>
          val byPid                                              = allTheStuffs.groupBy(_.parentId)
          def injectChildrenRecursively(current: Folder): Folder = byPid.get(current.id.some) match {
            case Some(children) =>
              val childrenWithTheirChildrenFolders = children
                .sortBy(_.rank.toString)
                .map(child => injectChildrenRecursively(child))

              current.copy(subfolders = childrenWithTheirChildrenFolders)
            case None => current
          }
          injectChildrenRecursively(mainParent).some
      }
  }

  def getFolderAndChildrenSubfoldersWithResources(id: UUID)(implicit session: DBSession): Try[Option[Folder]] = {
    getFolderAndChildrenSubfoldersWithResourcesWhere(id, sqls"")
  }

  def getFolderAndChildrenSubfoldersWithResources(id: UUID, status: FolderStatus.Value, feideId: Option[FeideID])(
      implicit session: DBSession
  ): Try[Option[Folder]] = {
    feideId match {
      case None        => getFolderAndChildrenSubfoldersWithResourcesWhere(id, sqls"AND child.status = ${status.toString}")
      case Some(value) => getFolderAndChildrenSubfoldersWithResourcesWhere(
          id,
          sqls"AND (child.status = ${status.toString} OR child.feide_id = $value)",
        )
    }
  }

  /** A flat list of the folder with `id` as well as its children folders. The folders in the list comes with connected
    * resources in the `data` list.
    */
  private[repository] def getFolderAndChildrenSubfoldersWithResourcesWhere(id: UUID, sqlFilterClause: SQLSyntax)(
      implicit session: DBSession
  ): Try[Option[Folder]] = tsql"""-- Big recursive block which fetches the folder with `id` and also its children recursively
            WITH RECURSIVE childs AS (
                SELECT id AS f_id, parent_id AS f_parent_id, feide_id AS f_feide_id, name as f_name, status as f_status, rank AS f_rank, created as f_created, updated as f_updated, shared as f_shared, description as f_description
                FROM ${dbFolder.table} parent
                WHERE id = $id
                UNION ALL
                SELECT child.id AS f_id, child.parent_id AS f_parent_id, child.feide_id AS f_feide_id, child.name AS f_name, child.status as f_status, child.rank AS f_rank, child.created as f_created, child.updated as f_updated, child.shared as f_shared, child.description as f_description
                FROM ${dbFolder.table} child
                JOIN childs AS parent ON parent.f_id = child.parent_id
                $sqlFilterClause
            )
            SELECT * FROM childs
            LEFT JOIN resource_connections fr ON fr.folder_id = f_id
            LEFT JOIN ${dbResource.table} r ON r.id = fr.resource_id;
         """
    // We prefix the `folders` columns with `f_` to separate them
    // from the `resource_connections` columns  (both here and in sql).
    .one(Folder.fromResultSet((s: String) => s"f_$s"))
    .toMany(
      OptionalRow.presentWhen("resource_id")(Resource.fromResultSetWithConnection((s: String) => s, (s: String) => s))
    )
    .map((folder, resources) => folder.copy(resources = resources))
    .runList()
    .map(data => buildTreeStructureFromListOfChildren(id, data))

  def getSharedFolderAndChildrenSubfoldersWithResources(id: UUID, viewer: FeideID)(implicit
      session: DBSession
  ): Try[Option[Folder]] = {
    val u   = dbMyNDLAUser.syntax("u")
    val r   = dbResource.syntax("r")
    val fr  = dbResourceConnection.syntax("fr")
    val sfu = dbSavedSharedFolder.syntax("sfu")

    tsql"""-- Big recursive block which fetches the folder with `id` and also its children recursively
            WITH RECURSIVE childs AS (
                SELECT id AS f_id, parent_id AS f_parent_id, feide_id AS f_feide_id, name as f_name, status as f_status, rank AS f_rank, created as f_created, updated as f_updated, shared as f_shared, description as f_description
                FROM ${dbFolder.table} parent
                WHERE id = $id
                UNION ALL
                SELECT child.id AS f_id, child.parent_id AS f_parent_id, child.feide_id AS f_feide_id, child.name AS f_name, child.status as f_status, child.rank AS f_rank, child.created as f_created, child.updated as f_updated, child.shared as f_shared, child.description as f_description
                FROM ${dbFolder.table} child
                JOIN childs AS parent ON parent.f_id = child.parent_id
                AND child.status = ${FolderStatus.SHARED.toString}
            )
            SELECT childs.*, ${r.resultAll}, ${u.resultAll}, ${fr.resultAll}, ${sfu.resultAll} FROM childs
            LEFT JOIN ${dbResourceConnection.as(fr)} ON ${fr.folderId} = f_id
            LEFT JOIN ${dbResource.as(r)} ON ${r.id} = ${fr.resourceId}
            LEFT JOIN ${dbMyNDLAUser.as(u)} on ${u.feideId} = f_feide_id
            LEFT JOIN ${dbSavedSharedFolder.as(sfu)} on ${sfu.folderId} = f_id AND ${sfu.feideId} = $viewer;
         """
      .one(Folder.fromResultSet((s: String) => s"f_$s"))
      .toManies(
        OptionalRow.presentWhen(fr.resultName.c("resource_id"))(Resource.fromResultSetWithConnection(r, fr)),
        OptionalRow.presentWhen(u.resultName.c("id"))(dbMyNDLAUser.fromResultSet(u)),
        OptionalRow.presentWhen(sfu.resultName.c("folder_id"))(SavedSharedFolder.fromResultSet(sfu)),
      )
      .mapTry(toCompileFolder)
      .runList()
      .map(data => buildTreeStructureFromListOfChildren(id, data))
  }

  private def toCompileFolder(
      folder: Folder,
      resources: List[Resource],
      users: List[MyNDLAUser],
      savedFolders: List[SavedSharedFolder],
  ): Try[Folder] = findUser(folder.feideId, users).map { user =>
    val rank = savedFolders.find(_.folderId == folder.id).map(_.rank).getOrElse(folder.rank)
    folder.copy(rank = rank, resources = resources, user = user)
  }

  private def findUser(feideId: FeideID, users: List[MyNDLAUser]): Try[Option[MyNDLAUser]] =
    users.find(user => feideId == user.feideId) match {
      case Some(u) => Success(Some(u))
      case None    => Failure(NDLASQLException(s"$feideId does not match any users with folder"))
    }

  def getFolderAndChildrenSubfolders(id: UUID)(implicit session: DBSession): Try[Option[Folder]] =
    tsql"""-- Big recursive block which fetches the folder with `id` and also its children recursively
            WITH RECURSIVE childs AS (
                SELECT parent.*
                FROM ${dbFolder.table} parent
                WHERE id = $id
                UNION ALL
                SELECT child.*
                FROM ${dbFolder.table} child
                JOIN childs AS parent ON parent.id = child.parent_id
            )
            SELECT * FROM childs;
         """
      .decode(Folder.fromResultSet((s: String) => s))
      .runList()
      .map(data => buildTreeStructureFromListOfChildren(id, data))

  def getFoldersDepth(parentId: UUID)(implicit session: DBSession = dbUtility.readOnlySession): Try[Long] = tsql"""
           WITH RECURSIVE parents AS (
                SELECT id AS f_id, parent_id AS f_parent_id, 0 dpth
                FROM ${dbFolder.table} child
                WHERE id = $parentId
                UNION ALL
                SELECT parent.id AS f_id, parent.parent_id AS f_parent_id, dpth +1
                FROM ${dbFolder.table} parent
                JOIN parents AS child ON child.f_parent_id = parent.id
            )
            SELECT * FROM parents ORDER BY parents.dpth DESC
         """.decode(_.required[Long]("dpth")).runFirst().map(_.getOrElse(0L))

  def getFoldersAndSubfoldersIds(folderId: UUID)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[List[UUID]] = tsql"""
             WITH RECURSIVE parent (id) as (
                  SELECT id
                  FROM ${dbFolder.table} child
                  WHERE id = $folderId
                  UNION ALL
                  SELECT child.id
                  FROM ${dbFolder.table} child, parent
                  WHERE child.parent_id = parent.id
            )
            SELECT * FROM parent
           """.decode(_.required[UUID]("id")).runList()

  def foldersWithParentID(parentId: Option[UUID])(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[List[Folder]] = foldersWhere(sqls"f.parent_id=$parentId")

  def getRootResources(
      feideId: FeideID
  )(implicit session: DBSession = dbUtility.readOnlySession): Try[List[Resource]] = {
    val fr = dbResourceConnection.syntax("fr")
    val r  = dbResource.syntax("r")
    tsql"""select ${r.result.*}, ${fr.result.*} from ${dbResourceConnection.as(fr)}
            left join ${dbResource.as(r)}
                on ${fr.resourceId} = ${r.id}
            where ${r.feideId} = $feideId and ${fr.folderId} is null 
            order by rank ASC;
           """
      .one(Resource.fromResultSet(r))
      .toOne(ResourceConnection.fromResultSet(fr))
      .map((resource, connection) => resource.copy(connection = Some(connection)))
      .runList()
  }

  def getFolderResources(
      folderId: UUID
  )(implicit session: DBSession = dbUtility.readOnlySession): Try[List[Resource]] = {
    val fr = dbResourceConnection.syntax("fr")
    val r  = dbResource.syntax("r")
    tsql"""select ${r.result.*}, ${fr.result.*} from ${dbResourceConnection.as(fr)}
            left join ${dbResource.as(r)}
                on ${fr.resourceId} = ${r.id}
            where ${fr.folderId} = $folderId;
           """
      .one(Resource.fromResultSet(r))
      .toOne(ResourceConnection.fromResultSet(fr))
      .map((resource, connection) => resource.copy(connection = Some(connection)))
      .runList()
  }

  private def folderWhere(whereClause: SQLSyntax)(implicit session: DBSession): Try[Option[Folder]] = {
    val f = dbFolder.syntax("f")
    tsql"select ${f.result.*} from ${dbFolder.as(f)} where $whereClause".decode(Folder.fromResultSet(f)).runSingle()
  }

  private def foldersWhere(whereClause: SQLSyntax)(implicit session: DBSession): Try[List[Folder]] = {
    val f = dbFolder.syntax("f")
    tsql"select ${f.result.*} from ${dbFolder.as(f)} where $whereClause".decode(Folder.fromResultSet(f)).runList()
  }

  private def resourcesWhere(whereClause: SQLSyntax)(implicit session: DBSession): Try[List[Resource]] = {
    val r = dbResource.syntax("r")
    tsql"select ${r.result.*} from ${dbResource.as(r)} where $whereClause".decode(Resource.fromResultSet(r)).runList()
  }

  private def resourceWhere(whereClause: SQLSyntax)(implicit session: DBSession): Try[Option[Resource]] = {
    val r = dbResource.syntax("r")
    tsql"select ${r.result.*} from ${dbResource.as(r)} where $whereClause".decode(Resource.fromResultSet(r)).runSingle()
  }

  def setFolderRank(folderId: UUID, rank: Int, feideId: FeideID)(implicit session: DBSession): Try[Unit] = tsql"""
          update ${dbFolder.table}
          set rank=$rank
          where id=$folderId and feide_id=$feideId
      """.update() match {
    case Failure(ex)                  => Failure(ex)
    case Success(count) if count == 1 =>
      logger.info(s"Updated rank for folder with id $folderId")
      Success(())
    case Success(count) =>
      Failure(NDLASQLException(s"This is a Bug! The expected rows count should be 1 and was $count."))
  }

  def setSharedFolderRank(folderId: UUID, rank: Int, feideId: FeideID)(implicit session: DBSession): Try[Unit] = tsql"""
          update ${dbSavedSharedFolder.table}
          set rank=$rank
          where folder_id=$folderId and feide_id=$feideId
      """.update() match {
    case Failure(ex)                  => Failure(ex)
    case Success(count) if count == 1 =>
      logger.info(s"Updated rank for shared folder with id $folderId and feideId $feideId")
      Success(())
    case Success(count) =>
      Failure(NDLASQLException(s"This is a Bug! The expected rows count should be 1 and was $count."))
  }

  def setResourceConnectionRank(folderId: Option[UUID], resourceId: UUID, rank: Int)(implicit
      session: DBSession
  ): Try[Unit] =
    val folderClause = folderId match {
      case Some(id) => sqls"folder_id=$id"
      case None     => sqls"folder_id is null"
    }
    tsql"""
          update ${dbResourceConnection.table}
          set rank=$rank
          where $folderClause and resource_id=$resourceId
      """.update() match {
      case Failure(ex)                  => Failure(ex)
      case Success(count) if count == 1 =>
        logger.info(s"Updated rank for folder-resource connection with folderId $folderId and resourceId $resourceId")
        Success(())
      case Success(count) =>
        Failure(NDLASQLException(s"This is a Bug! The expected rows count should be 1 and was $count."))
    }

  def getDistinctTags(feideId: String)(implicit session: DBSession = dbUtility.readOnlySession): Try[List[String]] = {
    tsql"select distinct jsonb_array_elements_text(document->'tags') as tag from ${dbResource.table} where feide_id = $feideId"
      .decode(_.required[String]("tag"))
      .runList()
  }

  def numberOfTags()(implicit session: DBSession = dbUtility.readOnlySession): Try[Option[Long]] =
    tsql"select count(tag) from (select distinct jsonb_array_elements_text(document->'tags') from ${dbResource.table}) as tag"
      .decode(_.required[Long]("count"))
      .runSingle()

  def insertResourcesInBulk(bulk: BulkInserts)(implicit session: DBSession): Try[Unit] = {
    Try {
      val insertSql = tsql"""
          insert into ${dbResource.table} (id, feide_id, path, resource_type, created, document)
          values (?, ?, ?, ?, ? ,?)
          on conflict (feide_id, path, resource_type) do nothing
       """.underlying

      val batchParams = bulk
        .resources
        .map { resource =>
          val document = dbUtility.asJsonb(ResourceDocument(resource.tags, resource.resourceId))
          Seq[Any](
            resource.id,
            resource.feideId,
            resource.path,
            resource.resourceType.entryName,
            resource.created,
            document,
          )
        }

      val _ = insertSql.batch(batchParams*).apply()
    }
  }

  def insertResourceConnectionInBulk(bulkInserts: BulkInserts)(implicit session: DBSession): Try[Unit] = {
    Try {
      val insertSql = tsql"""
        with rid as (
          select id from resources r
          where r.feide_id = ?
          and r.resource_type = ?
          and r.path = ?
        )
        insert into ${dbResourceConnection.table} (folder_id, resource_id, rank, favorited_date)
        select ?, id, ?, ? from rid
      """.underlying

      val batchParams = {
        bulkInserts
          .connections
          .traverse { c =>
            bulkInserts.resources.find(_.id == c.resourceId) match {
              case Some(resource) => Success(
                  Seq[Any](
                    resource.feideId,
                    resource.resourceType.entryName,
                    resource.path,
                    c.folderId,
                    c.rank,
                    c.favoritedDate,
                  )
                )

              case None =>
                logger.error("Something went wrong when generating parameters for batch inserting resource_connections")
                Failure(
                  new RuntimeException(
                    "Something went wrong when generating parameters for batch inserting resource_connections"
                  )
                )
            }
          }
      }

      batchParams.map { params =>
        val _ = insertSql.batch(params*).apply()
      }
    }.flatten
  }

  def insertFolderInBulk(bulk: BulkInserts)(implicit session: DBSession): Try[Unit] = Try {
    val insertSql = tsql"""
        insert into ${dbFolder.table} (id, parent_id, feide_id, name, status, rank, created, updated, shared, description)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      """.underlying

    val batchParams = bulk
      .folders
      .map { folder =>
        Seq[Any](
          folder.id,
          folder.parentId,
          folder.feideId,
          folder.name,
          folder.status.toString,
          folder.rank,
          folder.created,
          folder.updated,
          folder.shared,
          folder.description,
        )
      }

    val _ = insertSql.batch(batchParams*).apply()
  }

  def numberOfResources()(implicit session: DBSession = dbUtility.readOnlySession): Try[Option[Long]] =
    tsql"select count(*) from ${dbResource.table}".decode(_.required[Long]("count")).runSingle()

  def numberOfFolders()(implicit session: DBSession = dbUtility.readOnlySession): Try[Option[Long]] =
    tsql"select count(*) from ${dbFolder.table}".decode(_.required[Long]("count")).runSingle()

  def numberOfSharedFolders()(implicit session: DBSession = dbUtility.readOnlySession): Try[Option[Long]] =
    tsql"select count(*) from ${dbFolder.table} where status = ${FolderStatus.SHARED.toString}"
      .decode(_.required[Long]("count"))
      .runSingle()

  def numberOfResourcesGrouped()(implicit session: DBSession = dbUtility.readOnlySession): Try[List[(Long, String)]] =
    tsql"select count(*) as antall, resource_type from ${dbResource.table} group by resource_type"
      .decode(row => (row.required[Long]("antall"), row.required[String]("resource_type")).tupled)
      .runList()

  def createFolderUserConnection(folderId: UUID, feideId: FeideID, rank: Int)(implicit
      session: DBSession = dbUtility.autoSession
  ): Try[SavedSharedFolder] = Try {
    val _ = withSQL {
      insert
        .into(dbSavedSharedFolder)
        .namedValues(
          dbSavedSharedFolder.column.folderId -> folderId,
          dbSavedSharedFolder.column.feideId  -> feideId,
          dbSavedSharedFolder.column.rank     -> rank,
        )
    }.update()
    logger.info(s"Inserted new sharedFolder-user connection with folder id $folderId and feide id $feideId")

    SavedSharedFolder(folderId = folderId, feideId = feideId, rank = rank)
  }

  def deleteFolderUserConnections(
      folderIds: List[UUID]
  )(implicit session: DBSession = dbUtility.autoSession): Try[List[UUID]] = Try {
    val column = dbSavedSharedFolder.column.c
    withSQL {
      delete.from(dbSavedSharedFolder).where.in(column("folder_id"), folderIds)
    }.update()
  } match {
    case Failure(ex)      => Failure(ex)
    case Success(numRows) =>
      logger.info(s"Deleted $numRows shared folder user connections with folder ids (${folderIds.mkString(", ")})")
      Success(folderIds)
  }

  def deleteFolderUserConnection(folderId: Option[UUID], feideId: Option[FeideID])(implicit
      session: DBSession = dbUtility.autoSession
  ): Try[Int] = Try {
    (folderId, feideId) match {
      case (Some(folderId), Some(feideId)) =>
        deleteFolderUserConnectionWhere(sqls"folder_id = $folderId AND feide_id = $feideId")
      case (Some(folderId), None) => deleteFolderUserConnectionWhere(sqls"folder_id = $folderId ")
      case (None, Some(feideId))  => deleteFolderUserConnectionWhere(sqls"feide_id = $feideId")
      case (None, None)           => Failure(NDLASQLException("No feide id or folder id provided"))
    }
  }.flatMap {
    case Failure(ex)     => Failure(ex)
    case Success(numRow) => Success(numRow)
  }

  private def deleteFolderUserConnectionWhere(whereClause: SQLSyntax)(implicit session: DBSession): Try[Int] = {
    val f = dbSavedSharedFolder.syntax("f")
    tsql"DELETE FROM ${dbSavedSharedFolder.as(f)} WHERE $whereClause".update() match {
      case Failure(ex)      => Failure(ex)
      case Success(numRows) =>
        logger.info(s"Deleted $numRows from shared folder user connections")
        Success(numRows)
    }
  }

  def getSavedSharedFolders(
      feideId: FeideID
  )(implicit session: DBSession = dbUtility.autoSession): Try[List[Folder]] = {
    val f   = dbFolder.syntax("f")
    val sfu = dbSavedSharedFolder.syntax("sfu")
    tsql"""
          SELECT ${f.result.*}, ${sfu.result.*}
          FROM ${dbFolder.as(f)}
          LEFT JOIN ${dbSavedSharedFolder.as(sfu)} on sfu.folder_id = f.id
          WHERE sfu.feide_id = $feideId
        """
      .decode(row =>
        for {
          folder <- Folder.fromResultSet(f)(row)
          rank   <- row.required[Int](sfu.resultName.rank)
        } yield folder.copy(rank = rank)
      )
      .runList()
  }
}

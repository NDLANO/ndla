/*
 * Part of NDLA learningpath-api
 * Copyright (C) 2016 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.learningpathapi.repository

import cats.implicits.*
import no.ndla.database.{ColumnDecoder, DBUtility, Row}
import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.CirceUtil
import no.ndla.common.model.domain.{Author, Tag}
import no.ndla.common.model.domain.learningpath.{LearningPath, LearningPathStatus, LearningStep, LearningpathCopyright}
import no.ndla.learningpathapi.model.domain.*
import org.postgresql.util.PGobject
import scalikejdbc.*
import no.ndla.database.implicits.*

import java.util.UUID
import scala.util.{Failure, Success, Try}

class LearningPathRepository(using dbUtility: DBUtility, dbLearningPath: DBLearningPath) extends StrictLogging {

  def inTransaction[A](work: DBSession => Try[A])(implicit session: DBSession | Null = null): Try[A] = {
    Option(session) match {
      case Some(x) => work(x)
      case None    => dbUtility.rollbackOnFailure { implicit newSession =>
          work(newSession)
        }
    }
  }

  def withId(id: Long)(implicit session: DBSession = dbUtility.autoSession): Try[Option[LearningPath]] = {
    learningPathWhere(sqls"lp.id = $id AND lp.document->>'status' <> ${LearningPathStatus.DELETED.toString}")
  }

  def withIdIncludingDeleted(
      id: Long
  )(implicit session: DBSession = dbUtility.autoSession): Try[Option[LearningPath]] = {
    learningPathWhere(sqls"lp.id = $id")
  }

  def withExternalId(externalId: String): Try[Option[LearningPath]] = {
    learningPathWhere(sqls"lp.external_id = $externalId")
  }

  def withOwner(owner: String): Try[List[LearningPath]] = {
    learningPathsWhere(
      sqls"lp.document->>'owner' = $owner AND lp.document->>'status' <> ${LearningPathStatus.DELETED.toString} order by lp.document->>'created' DESC"
    )
  }

  def getIdFromExternalId(
      externalId: String
  )(implicit session: DBSession = dbUtility.autoSession): Try[Option[Long]] = {
    tsql"select id from learningpaths where external_id = $externalId".decode(_.required[Long]("id")).runSingle()
  }

  def learningPathsWithIsBasedOn(isBasedOnId: Long): Try[List[LearningPath]] = {
    learningPathsWhere(sqls"lp.document->>'isBasedOn' = ${isBasedOnId.toString}")
  }

  def learningPathsWithIsBasedOnRaw(isBasedOnId: Long): Try[List[LearningPath]] = {
    learningPathsWhereWithInactive(sqls"lp.document->>'isBasedOn' = ${isBasedOnId.toString}")
  }

  def learningStepsFor(
      learningPathId: Long
  )(implicit session: DBSession = dbUtility.readOnlySession): Try[Seq[LearningStep]] = {
    val lp = dbLearningPath.syntax("lp")
    tsql"select ${lp.result.*} from ${dbLearningPath.as(lp)} where ${lp.id} = $learningPathId"
      .decode(row => dbLearningPath.fromResultSet(lp.resultName)(row).map(_.learningsteps))
      .runSingle()
      .map(_.getOrElse(Seq.empty))
  }

  def learningStepWithId(learningPathId: Long, learningStepId: Long)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[Option[LearningStep]] = {
    learningStepsFor(learningPathId).map(_.find(_.id.contains(learningStepId)))
  }

  def insert(learningpath: LearningPath)(implicit session: DBSession = dbUtility.autoSession): Try[LearningPath] = {
    val startRevision = 1
    generateLearningPathId().flatMap { learningPathId =>
      withStepIdsForInsert(learningpath, learningPathId, startRevision).flatMap { toInsert =>
        val dataObject = new PGobject()
        dataObject.setType("jsonb")
        dataObject.setValue(CirceUtil.toJsonString(toInsert))
        tsql"""insert into learningpaths(id, external_id, document, revision)
           values($learningPathId, ${learningpath.externalId}, $dataObject, $startRevision)
        """.update() match {
          case Success(1) =>
            logger.info(s"Inserted learningpath with id $learningPathId")
            Success(toInsert)
          case Success(_)  => Failure(new RuntimeException(s"Failed to insert learningpath with id $learningPathId"))
          case Failure(ex) => Failure(ex)
        }
      }
    }
  }

  def update(learningpath: LearningPath)(implicit session: DBSession = dbUtility.autoSession): Try[LearningPath] = {
    if (learningpath.id.isEmpty) {
      Failure(new RuntimeException("A non-persisted learningpath cannot be updated without being saved first."))
    } else {
      val dataObject = new PGobject()
      dataObject.setType("jsonb")
      dataObject.setValue(CirceUtil.toJsonString(learningpath))

      val newRevision = learningpath.revision.getOrElse(0) + 1
      tsql"update learningpaths set document = $dataObject, revision = $newRevision where id = ${learningpath.id} and revision = ${learningpath.revision}"
        .update()
        .flatMap(count => withNewRevision(learningpath, newRevision, count))
    }
  }

  def updateWithImportId(learningpath: LearningPath, importId: String)(implicit
      session: DBSession = dbUtility.autoSession
  ): Try[LearningPath] = {
    if (learningpath.id.isEmpty) {
      Failure(new RuntimeException("A non-persisted learningpath cannot be updated without being saved first."))
    } else {
      val dataObject = new PGobject()
      dataObject.setType("jsonb")
      dataObject.setValue(CirceUtil.toJsonString(learningpath))

      val importIdUUID = Try(UUID.fromString(importId)).toOption
      val newRevision  = learningpath.revision.getOrElse(0) + 1
      tsql"update learningpaths set document = $dataObject, revision = $newRevision, import_id = $importIdUUID where id = ${learningpath.id} and revision = ${learningpath.revision}"
        .update()
        .flatMap(count => withNewRevision(learningpath, newRevision, count))
    }
  }

  private def withNewRevision(learningpath: LearningPath, newRevision: Int, updatedCount: Int): Try[LearningPath] = {
    if (updatedCount != 1) {
      val msg =
        s"Conflicting revision is detected for learningPath with id = ${learningpath.id} and revision = ${learningpath.revision}"
      logger.warn(msg)
      Failure(new OptimisticLockException(msg))
    } else {
      logger.info(s"Updated learningpath with id ${learningpath.id}")
      Success(learningpath.copy(revision = Some(newRevision)))
    }
  }

  def deletePath(learningPathId: Long)(implicit session: DBSession = dbUtility.autoSession): Try[Int] = {
    tsql"delete from learningpaths where id = $learningPathId".update()
  }

  def deleteAllPaths(implicit session: DBSession): Try[Unit] = for {
    _ <- tsql"delete from learningpaths".update()
  } yield ()

  def learningPathsWithIdBetween(min: Long, max: Long)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[List[LearningPath]] = {
    val lp     = dbLearningPath.syntax("lp")
    val status = LearningPathStatus.PUBLISHED.toString

    tsql"""select ${lp.result.*}
               from ${dbLearningPath.as(lp)}
               where lp.document->>'status' = $status
               and lp.id between $min and $max
        """.decode(dbLearningPath.fromResultSet(lp.resultName)).runList()
  }

  def minMaxId(implicit session: DBSession = dbUtility.readOnlySession): Try[(Long, Long)] = {
    tsql"select coalesce(MIN(id),0) as mi, coalesce(MAX(id),0) as ma from learningpaths"
      .decode(row => (row.required[Long]("mi"), row.required[Long]("ma")).tupled)
      .runSingle()
      .map(_.getOrElse((0L, 0L)))
  }

  def allPublishedTags(implicit session: DBSession = dbUtility.readOnlySession): Try[List[Tag]] = {
    tsql"""select document->>'tags' as tags from learningpaths where document->>'status' = ${LearningPathStatus.PUBLISHED.toString}"""
      .decode(_.required[List[Tag]]("tags")(using ColumnDecoder.json))
      .runList()
      .map(allTags =>
        allTags.flatten.groupBy(_.language).map(entry => Tag(entry._2.flatMap(_.tags).distinct.sorted, entry._1)).toList
      )
  }

  def allPublishedContributors(implicit session: DBSession = dbUtility.readOnlySession): Try[List[Author]] = {
    tsql"""select document->>'copyright' as copyright from learningpaths where document->>'status' = ${LearningPathStatus.PUBLISHED.toString}"""
      .decode(_.required[LearningpathCopyright]("copyright")(using ColumnDecoder.json))
      .runList()
      .map(_.flatMap(_.contributors).distinct.sortBy(_.name))
  }

  private def learningPathsWhere(
      whereClause: SQLSyntax
  )(implicit session: DBSession = dbUtility.readOnlySession): Try[List[LearningPath]] = {
    val lp = dbLearningPath.syntax("lp")
    tsql"select ${lp.result.*} from ${dbLearningPath.as(lp)} where $whereClause"
      .decode(activeStepsOnly(lp.resultName))
      .runList()
  }

  private def learningPathsWhereWithInactive(
      whereClause: SQLSyntax
  )(implicit session: DBSession = dbUtility.readOnlySession): Try[List[LearningPath]] = {
    val lp = dbLearningPath.syntax("lp")
    tsql"select ${lp.result.*} from ${dbLearningPath.as(lp)} where $whereClause"
      .decode(dbLearningPath.fromResultSet(lp.resultName))
      .runList()
  }

  private def learningPathWhere(
      whereClause: SQLSyntax
  )(implicit session: DBSession = dbUtility.readOnlySession): Try[Option[LearningPath]] = {
    val lp = dbLearningPath.syntax("lp")
    tsql"select ${lp.result.*} from ${dbLearningPath.as(lp)} where $whereClause"
      .decode(activeStepsOnly(lp.resultName))
      .runSingle()
  }

  private def activeStepsOnly(lp: ResultName[LearningPath])(row: Row): Try[LearningPath] = dbLearningPath
    .fromResultSet(lp)(row)
    .map(_.withOnlyActiveSteps)

  def pageWithIds(ids: Seq[Long], pageSize: Int, offset: Int)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[List[LearningPath]] = {
    val lp = dbLearningPath.syntax("lp")
    tsql"""
            select ${lp.resultAll}
            from ${dbLearningPath.as(lp)}
            where ${lp.c("id")} in ($ids)
            order by ${lp.id}
            limit $pageSize
            offset $offset
      """.decode(activeStepsOnly(lp.resultName)).runList()
  }

  def getAllLearningPathsByPage(pageSize: Int, offset: Int)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[List[LearningPath]] = {
    val lp = dbLearningPath.syntax("lp")
    tsql"""
            select ${lp.resultAll}, ${lp.id} as row_id
            from ${dbLearningPath.as(lp)}
            order by row_id
            limit $pageSize
            offset $offset
      """.decode(activeStepsOnly(lp.resultName)).runList()
  }

  def getExternalLinkStepSamples()(implicit session: DBSession = dbUtility.readOnlySession): Try[List[LearningPath]] = {
    val lp = dbLearningPath.syntax("lp")
    tsql"""
      WITH candidates AS (
          SELECT DISTINCT clp.id
          FROM learningpaths clp
          WHERE
            clp."document"->>'isMyNDLAOwner' = 'true'
            AND clp."document"->>'status' = 'UNLISTED'
            AND EXISTS (
              SELECT 1
              FROM jsonb_array_elements(clp.document->'learningsteps') AS step
              WHERE step->>'status' = 'ACTIVE'
                AND jsonb_array_length(step->'embedUrl') > 0
            )
      ),
      matched_ids AS (
          SELECT id
          FROM candidates
          ORDER BY random()
          LIMIT 5
      )
      SELECT ${lp.result.*}
      FROM matched_ids ids
      JOIN ${dbLearningPath.as(lp)} ON ${lp.id} = ids.id
    """.decode(activeStepsOnly(lp.resultName)).runList()

  }

  def getPublishedLearningPathByPage(pageSize: Int, offset: Int)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[List[LearningPath]] = {
    val lp  = dbLearningPath.syntax("lp")
    val lps = SubQuery.syntax("lps").include(lp)
    tsql"""
            select ${lps.resultAll} from (select ${lp.resultAll}, ${lp.id} as row_id
                                          from ${dbLearningPath.as(lp)}
                                          where document#>>'{status}' = ${LearningPathStatus.PUBLISHED.toString}
                                          order by ${lp.id}
                                          limit $pageSize
                                          offset $offset) lps
            order by row_id
      """.decode(activeStepsOnly(lps(lp).resultName)).runList()
  }

  def learningPathsWithStatus(
      status: LearningPathStatus
  )(implicit session: DBSession = dbUtility.readOnlySession): Try[List[LearningPath]] = {
    learningPathsWhere(sqls"lp.document#>>'{status}' = ${status.toString}")
  }

  def publishedLearningPathCount(implicit session: DBSession = dbUtility.readOnlySession): Try[Long] = {
    val lp = dbLearningPath.syntax("lp")
    tsql"select count(*) from ${dbLearningPath.as(lp)} where document#>>'{status}' = ${LearningPathStatus.PUBLISHED.toString}"
      .decode(_.required[Long]("count"))
      .runSingle()
      .map(_.getOrElse(0L))
  }

  def learningPathCount(implicit session: DBSession = dbUtility.readOnlySession): Try[Long] = {
    val lp = dbLearningPath.syntax("lp")
    tsql"select count(*) from ${dbLearningPath.as(lp)}"
      .decode(_.required[Long]("count"))
      .runSingle()
      .map(_.getOrElse(0L))
  }

  def myNdlaLearningPathCount(implicit session: DBSession = dbUtility.readOnlySession): Try[Long] = {
    val lp = dbLearningPath.syntax("lp")
    tsql"""
           select count(*) from ${dbLearningPath.as(lp)}
           where document@>'{"isMyNDLAOwner": true}' and document->>'status' != ${LearningPathStatus.DELETED.toString}
         """.decode(_.required[Long]("count")).runSingle().map(_.getOrElse(0L))
  }

  def myNdlaLearningPathOwnerCount(implicit session: DBSession = dbUtility.readOnlySession): Try[Long] = {
    val lp = dbLearningPath.syntax("lp")
    tsql"""
           select count(distinct document ->> 'owner') from ${dbLearningPath.as(lp)}
           where document@>'{"isMyNDLAOwner": true}' and document->>'status' != ${LearningPathStatus.DELETED.toString}
         """.decode(_.required[Long]("count")).runSingle().map(_.getOrElse(0L))
  }

  def generateStepId()(implicit session: DBSession): Try[Long] = {
    tsql"select nextval('learningsteps_id_seq')"
      .decode(_.required[Long]("nextval"))
      .runSingleTry(new RuntimeException("Could not generate learning step id."))
  }

  def generateLearningPathId()(implicit session: DBSession): Try[Long] = {
    tsql"select nextval('learningpaths_id_seq')"
      .decode(_.required[Long]("nextval"))
      .runSingleTry(new RuntimeException("Could not generate learning path id."))
  }

  private def withStepIdsForInsert(learningpath: LearningPath, learningPathId: Long, startRevision: Int)(implicit
      session: DBSession
  ): Try[LearningPath] = {
    learningpath
      .learningsteps
      .traverse { step =>
        generateStepId().map { stepId =>
          val stepRevision = step.revision.orElse(Some(startRevision))
          step.copy(id = Some(stepId), revision = stepRevision, learningPathId = Some(learningPathId))
        }
      }
      .map(updatedSteps =>
        learningpath.copy(id = Some(learningPathId), revision = Some(startRevision), learningsteps = updatedSteps)
      )
  }

  def withIdWithInactiveSteps(id: Long, includeDeleted: Boolean = false)(implicit
      session: DBSession = AutoSession
  ): Try[Option[LearningPath]] = {
    if (includeDeleted) {
      learningPathWhereWithInactiveSteps(sqls"lp.id = $id")
    } else {
      learningPathWhereWithInactiveSteps(
        sqls"lp.id = $id AND lp.document->>'status' <> ${LearningPathStatus.DELETED.toString}"
      )
    }
  }

  private[repository] def learningPathWhereWithInactiveSteps(
      whereClause: SQLSyntax
  )(implicit session: DBSession = ReadOnlyAutoSession): Try[Option[LearningPath]] = {
    val lp = dbLearningPath.syntax("lp")
    tsql"select ${lp.result.*} from ${dbLearningPath.as(lp)} where $whereClause"
      .decode(dbLearningPath.fromResultSet(lp.resultName))
      .runSingle()
  }
}

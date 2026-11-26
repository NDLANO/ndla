/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.repository

import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.CirceUtil
import no.ndla.database.implicits.*
import no.ndla.myndlaapi.model.api.QuizStatsDTO
import no.ndla.myndlaapi.model.domain.{DBQuiz, DBSavedQuiz, Quiz, QuizErrors, QuizSort, QuizStatus}
import no.ndla.network.model.{CombinedUser, FeideID}
import org.postgresql.util.PGobject
import scalikejdbc.*

import java.util.UUID
import scala.util.{Failure, Success, Try}

class QuizRepository(using dbQuiz: DBQuiz, dbSavedQuiz: DBSavedQuiz) extends StrictLogging {

  private def ownerIds(user: CombinedUser): Seq[FeideID] = user.tokenUser.map(_.id).toSeq ++
    user.myndlaUser.map(_.user.feideId)
  def isOwner(quiz: Quiz, user: CombinedUser): Boolean       = ownerIds(user).exists(quiz.isOwner)
  def canView(quiz: Quiz, user: CombinedUser): Boolean       = quiz.isPublic || isOwner(quiz, user)
  def canSeeAnswers(quiz: Quiz, user: CombinedUser): Boolean = isOwner(quiz, user) || user.isEmployee

  def insert(ownerId: String, quiz: Quiz)(using session: DBSession): Try[Quiz] = {
    val dataObject = new PGobject()
    dataObject.setType("jsonb")
    dataObject.setValue(CirceUtil.toJsonString(quiz))

    tsql"""
      insert into ${dbQuiz.table} (id, owner_id, document, revision)
      values (${quiz.id}, $ownerId, $dataObject, 1)
    """
      .update()
      .map { _ =>
        logger.info(s"Inserted new quiz with id ${quiz.id}")
        quiz.copy(ownerId = ownerId, revision = Some(1))
      }
  }

  def update(quiz: Quiz)(using session: DBSession): Try[Quiz] = {
    val dataObject = new PGobject()
    dataObject.setType("jsonb")
    dataObject.setValue(CirceUtil.toJsonString(quiz))
    val oldRevision = quiz.revision.getOrElse(1)
    val newRevision = oldRevision + 1

    tsql"""
      update ${dbQuiz.table}
      set document = $dataObject, revision = $newRevision
      where id = ${quiz.id} and revision = $oldRevision
    """
      .update()
      .flatMap {
        case 1 => Success(quiz.copy(revision = Some(newRevision)))
        case _ => Failure(QuizErrors.revisionMismatch(quiz.id))
      }
  }

  def incrementCompletedCount(id: UUID)(using session: DBSession): Try[Unit] = tsql"""
      update ${dbQuiz.table}
      set completed_count = completed_count + 1
      where id = $id
    """
    .update()
    .flatMap {
      case 1 => Success(())
      case _ => Failure(QuizErrors.quizNotFound(id))
    }

  def withId(id: UUID)(using session: DBSession): Try[Option[Quiz]] = {
    val qz = dbQuiz.syntax("qz")
    tsql"""
      select ${qz.result.*}
      from ${dbQuiz.as(qz)}
      where qz.id = $id
    """.decode(dbQuiz.fromResultSet(qz)).runSingle()
  }

  def withIdOrError(id: UUID)(using session: DBSession): Try[Quiz] = withId(id).flatMap {
    case Some(quiz) => Success(quiz)
    case None       => Failure(QuizErrors.quizNotFound(id))
  }

  def delete(id: UUID)(using session: DBSession): Try[UUID] = {
    tsql"delete from ${dbQuiz.table} where id = $id"
      .update()
      .flatMap {
        case 1 => Success(id)
        case _ => Failure(QuizErrors.quizNotFound(id))
      }
  }

  def getByOwner(
      ownerId: String,
      pageSize: Int,
      page: Int,
      sort: QuizSort,
  )(using session: DBSession): Try[List[Quiz]] = {
    val qz        = dbQuiz.syntax("qz")
    val offset    = (page - 1) * pageSize
    val direction = sortDirection(sort)
    tsql"""
      select ${qz.result.*}
      from ${dbQuiz.as(qz)}
      where qz.owner_id = $ownerId
      order by qz.document->>'created' $direction, qz.id $direction
      limit $pageSize offset $offset
    """.decode(dbQuiz.fromResultSet(qz)).runList()
  }

  def countByOwner(ownerId: String)(using session: DBSession): Try[Long] = tsql"""
      select count(*) as count from ${dbQuiz.table} where owner_id = $ownerId
    """.decode(_.required[Long]("count")).runSingle().map(_.getOrElse(0L))

  def saveQuiz(quizId: UUID, feideId: FeideID)(using session: DBSession): Try[Unit] = tsql"""
      insert into ${dbSavedQuiz.table} (quiz_id, feide_id)
      values ($quizId, $feideId)
      on conflict do nothing
    """.update().map(_ => logger.info(s"Saved quiz $quizId for user $feideId"))

  def unsaveQuiz(quizId: UUID, feideId: FeideID)(using session: DBSession): Try[Unit] = tsql"""
      delete from ${dbSavedQuiz.table} where quiz_id = $quizId and feide_id = $feideId
    """.update().map(_ => ())

  def getSavedByUser(feideId: FeideID, sort: QuizSort)(using session: DBSession): Try[List[Quiz]] = {
    val qz        = dbQuiz.syntax("qz")
    val sq        = dbSavedQuiz.syntax("sq")
    val direction = sortDirection(sort)
    tsql"""
      select ${qz.result.*}
      from ${dbQuiz.as(qz)}
      join ${dbSavedQuiz.as(sq)} on sq.quiz_id = qz.id
      where sq.feide_id = $feideId
      order by sq.created $direction, qz.id $direction
    """.decode(dbQuiz.fromResultSet(qz)).runList()
  }

  private def sortDirection(sort: QuizSort): SQLSyntax = sort match {
    case QuizSort.ByCreatedDesc => sqls"desc"
    case QuizSort.ByCreatedAsc  => sqls"asc"
  }

  def getStats(using session: DBSession): Try[QuizStatsDTO] = tsql"""
      select
        (select count(*) from ${dbQuiz.table}) as total,
        (select count(*) from ${dbQuiz.table} where document->>'status' = ${QuizStatus.PUBLIC.entryName}) as public_quizzes,
        (select count(*) from ${dbSavedQuiz.table}) as saved,
        (select count(*) from ${dbQuiz.table} where completed_count > 0) as completed,
        (select coalesce(sum(completed_count), 0) from ${dbQuiz.table}) as completions,
        (select count(distinct quiz_id) from ${dbSavedQuiz.table}) as distinct_saved,
        (select count(distinct owner_id) from ${dbQuiz.table}) as users_with_quizzes,
        (select count(distinct feide_id) from ${dbSavedQuiz.table}) as users_with_saved_quizzes
    """
    .decode(row =>
      for {
        total                 <- row.required[Long]("total")
        publicQuizzes         <- row.required[Long]("public_quizzes")
        saved                 <- row.required[Long]("saved")
        completed             <- row.required[Long]("completed")
        completions           <- row.required[Long]("completions")
        distinctSaved         <- row.required[Long]("distinct_saved")
        usersWithQuizzes      <- row.required[Long]("users_with_quizzes")
        usersWithSavedQuizzes <- row.required[Long]("users_with_saved_quizzes")
      } yield QuizStatsDTO(
        total = total,
        publicQuizzes = publicQuizzes,
        saved = saved,
        completed = completed,
        completions = completions,
        distinctSaved = distinctSaved,
        usersWithQuizzes = usersWithQuizzes,
        usersWithSavedQuizzes = usersWithSavedQuizzes,
      )
    )
    .runSingle()
    .map(_.getOrElse(QuizStatsDTO(0, 0, 0, 0, 0, 0, 0, 0)))
}

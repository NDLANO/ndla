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
import no.ndla.myndlaapi.model.domain.{DBQuiz, Quiz, QuizErrors}
import no.ndla.network.model.FeideID
import org.postgresql.util.PGobject
import scalikejdbc.*

import java.util.UUID
import scala.util.{Failure, Success, Try}

class QuizRepository(using dbQuiz: DBQuiz) extends StrictLogging {

  def insert(ownerId: FeideID, quiz: Quiz)(using session: DBSession): Try[Quiz] = {
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

  def withId(id: UUID)(using session: DBSession): Try[Option[Quiz]] = {
    val qz = dbQuiz.syntax("qz")
    tsql"""
      select ${qz.result.*}
      from ${dbQuiz.as(qz)}
      where qz.id = $id
    """.map(dbQuiz.fromResultSet(qz)).runSingle()
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

  def getByOwner(ownerId: FeideID, pageSize: Int, page: Int)(using session: DBSession): Try[List[Quiz]] = {
    val qz     = dbQuiz.syntax("qz")
    val offset = (page - 1) * pageSize
    tsql"""
      select ${qz.result.*}
      from ${dbQuiz.as(qz)}
      where qz.owner_id = $ownerId
      order by qz.id desc
      limit $pageSize offset $offset
    """.map(dbQuiz.fromResultSet(qz)).runList()
  }

  def countByOwner(ownerId: FeideID)(using session: DBSession): Long = tsql"""
      select count(*) as count from ${dbQuiz.table} where owner_id = $ownerId
    """.map(rs => rs.long("count")).runSingle().get.getOrElse(0L)
}

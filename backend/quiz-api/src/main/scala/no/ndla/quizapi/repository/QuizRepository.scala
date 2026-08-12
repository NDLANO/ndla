/*
 * Part of NDLA quiz-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.quizapi.repository

import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.CirceUtil
import no.ndla.database.DBUtility
import no.ndla.database.implicits.*
import no.ndla.quizapi.model.domain.{DBQuiz, NDLAErrors, Quiz}
import org.postgresql.util.PGobject
import scalikejdbc.*

import scala.util.{Failure, Success, Try}

class QuizRepository(using dbQuiz: DBQuiz, dbUtil: DBUtility) extends StrictLogging {

  def insert(quiz: Quiz)(using session: DBSession): Try[Quiz] = {
    val dataObject = new PGobject()
    dataObject.setType("jsonb")
    dataObject.setValue(CirceUtil.toJsonString(quiz))

    tsql"""
      insert into ${dbQuiz.table} (document, revision)
      values ($dataObject, 1)
    """
      .updateAndReturnGeneratedKey()
      .map { id =>
        logger.info(s"Inserted new quiz with id $id")
        quiz.copy(id = Some(id), revision = Some(1))
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
        case _ => Failure(NDLAErrors.revisionMismatch(quiz.id.getOrElse(-1)))
      }
  }

  def withId(id: Long)(using session: DBSession): Try[Option[Quiz]] = {
    val qz = dbQuiz.syntax("qz")
    tsql"""
      select ${qz.result.*}
      from ${dbQuiz.as(qz)}
      where qz.id = $id
    """
      .map(dbQuiz.fromResultSet(qz))
      .runSingle()
  }

  def withIdOrError(id: Long)(using session: DBSession): Try[Quiz] =
    withId(id).flatMap {
      case Some(quiz) => Success(quiz)
      case None       => Failure(NDLAErrors.quizNotFound(id))
    }

  def delete(id: Long)(using session: DBSession): Try[Long] = {
    tsql"delete from ${dbQuiz.table} where id = $id"
      .update()
      .flatMap {
        case 1 => Success(id)
        case _ => Failure(NDLAErrors.quizNotFound(id))
      }
  }
}

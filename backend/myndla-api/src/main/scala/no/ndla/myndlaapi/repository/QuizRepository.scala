/*
 * Part of NDLA myndla-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.repository

import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.errors.NotFoundException
import no.ndla.database.DBUtility
import no.ndla.database.implicits.*
import no.ndla.myndlaapi.model.domain.{DBQuiz, Quiz}
import no.ndla.network.model.FeideID
import scalikejdbc.*

import java.util.UUID
import scala.util.{Failure, Success, Try}

class QuizRepository(using dbUtility: DBUtility, dbQuiz: DBQuiz) extends StrictLogging {

  def insert(quiz: Quiz)(implicit session: DBSession = dbUtility.autoSession): Try[Quiz] = {
    val document = dbUtility.asJsonb(quiz)
    tsql"""
          insert into ${dbQuiz.table} (id, owner_id, document)
          values (${quiz.id}, ${quiz.ownerId}, $document)
       """.update() match {
      case Failure(ex) => Failure(ex)
      case Success(_)  =>
        logger.info(s"Inserted new quiz with id ${quiz.id}")
        Success(quiz)
    }
  }

  def update(quiz: Quiz)(implicit session: DBSession = dbUtility.autoSession): Try[Quiz] = {
    val document = dbUtility.asJsonb(quiz)
    tsql"""
          update ${dbQuiz.table}
          set owner_id=${quiz.ownerId}, document=$document
          where id=${quiz.id}
       """.update() match {
      case Failure(ex)                  => Failure(ex)
      case Success(count) if count == 1 =>
        logger.info(s"Updated quiz with id ${quiz.id}")
        Success(quiz)
      case Success(_) => Failure(NotFoundException(s"Quiz with id ${quiz.id} does not exist"))
    }
  }

  def withId(id: UUID)(implicit session: DBSession = dbUtility.readOnlySession): Try[Option[Quiz]] =
    tsql"select document from ${dbQuiz.table} where id=$id".map(Quiz.fromResultSet).runSingleFlat()

  def deleteById(id: UUID)(implicit session: DBSession = dbUtility.autoSession): Try[UUID] =
    tsql"delete from ${dbQuiz.table} where id=$id".update() match {
      case Failure(ex)                  => Failure(ex)
      case Success(count) if count == 1 =>
        logger.info(s"Deleted quiz with id $id")
        Success(id)
      case Success(_) => Failure(NotFoundException(s"Quiz with id $id does not exist"))
    }

  def listByOwner(ownerId: FeideID)(implicit session: DBSession = dbUtility.readOnlySession): Try[List[Quiz]] = tsql"""
          select document from ${dbQuiz.table}
          where owner_id=$ownerId
          order by document->>'created' desc
       """.map(Quiz.fromResultSet).runListFlat()
}

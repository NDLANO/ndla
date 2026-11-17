/*
 * Part of NDLA concept-api
 * Copyright (C) 2019 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.conceptapi.repository

import cats.implicits.*
import no.ndla.database.{ColumnDecoder, DBUtility}
import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.CirceUtil
import no.ndla.common.model.domain.Tag
import no.ndla.common.model.domain.concept.Concept
import no.ndla.conceptapi.model.api.NotFoundException
import no.ndla.conceptapi.model.domain.{DBConcept, DBPublishedConcept}
import org.postgresql.util.PGobject
import scalikejdbc.*
import no.ndla.database.implicits.*

import scala.util.{Failure, Success, Try}

class PublishedConceptRepository(using dbUtility: DBUtility, dbConcept: DBConcept, publishedConcept: DBPublishedConcept)
    extends StrictLogging
    with Repository[Concept] {

  def insertOrUpdate(concept: Concept)(implicit session: DBSession = dbUtility.autoSession): Try[Concept] = {
    val dataObject = new PGobject()
    dataObject.setType("jsonb")
    dataObject.setValue(CirceUtil.toJsonString(concept))

    tsql"""update ${publishedConcept.table}
              set
                document=$dataObject,
                revision=${concept.revision}
              where id=${concept.id}
          """.update() match {
      case Success(count) if count == 1 =>
        logger.info(s"Updated published concept ${concept.id}")
        Success(concept)
      case Success(_) =>
        logger.info(s"No published concept with id ${concept.id} exists, creating...")
        tsql"""
                  insert into ${publishedConcept.table} (id, document, revision)
                  values (${concept.id}, $dataObject, ${concept.revision})
              """.updateAndReturnGeneratedKey().map(_ => concept)
      case Failure(ex) => Failure(ex)
    }
  }

  def delete(id: Long)(implicit session: DBSession = dbUtility.autoSession): Try[?] = {
    tsql"""
            delete from ${publishedConcept.table}
            where id=$id
         """.update() match {
      case Success(count) if count > 0 => Success(id)
      case Failure(ex)                 => Failure(ex)
      case _                           => Failure(NotFoundException("Could not find concept to delete from Published concepts table."))
    }
  }

  def withId(id: Long): Try[Option[Concept]] = conceptWhere(sqls"co.id=${id.toInt}")

  def everyTagFromEveryConcept(implicit session: DBSession = dbUtility.readOnlySession): Try[List[List[Tag]]] = {
    tsql"""
           select distinct id, document#>'{tags}' as tags
           from ${publishedConcept.table}
           where jsonb_array_length(document#>'{tags}') > 0
           order by id
         """.decode(_.required[List[Tag]]("tags")(using ColumnDecoder.json)).runList()
  }

  private def conceptWhere(
      whereClause: SQLSyntax
  )(implicit session: DBSession = dbUtility.readOnlySession): Try[Option[Concept]] = {
    val co = publishedConcept.syntax("co")
    tsql"select ${co.result.*} from ${publishedConcept.as(co)} where co.document is not NULL and $whereClause"
      .decode(dbConcept.fromResultSet(co))
      .runSingle()
  }

  def conceptCount(implicit session: DBSession = dbUtility.readOnlySession): Try[Long] =
    tsql"select count(*) from ${publishedConcept.table}"
      .decode(_.required[Long]("count"))
      .runSingle()
      .map(_.getOrElse(0L))

  override def documentsWithIdBetween(min: Long, max: Long): Try[List[Concept]] =
    conceptsWhere(sqls"co.id between $min and $max")

  override def minMaxId(implicit session: DBSession = dbUtility.autoSession): Try[(Long, Long)] = {
    tsql"select coalesce(MIN(id),0) as mi, coalesce(MAX(id),0) as ma from ${publishedConcept.table}"
      .decode(row => (row.required[Long]("mi"), row.required[Long]("ma")).tupled)
      .runSingle()
      .map(_.getOrElse((0L, 0L)))
  }

  private def conceptsWhere(
      whereClause: SQLSyntax
  )(implicit session: DBSession = dbUtility.readOnlySession): Try[List[Concept]] = {
    val co = publishedConcept.syntax("co")
    tsql"select ${co.result.*} from ${publishedConcept.as(co)} where co.document is not NULL and $whereClause"
      .decode(dbConcept.fromResultSet(co))
      .runList()
  }

  def getByPage(pageSize: Int, offset: Int)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[List[Concept]] = {
    val co = publishedConcept.syntax("co")
    tsql"""
           select ${co.result.*}
           from ${publishedConcept.as(co)}
           where document is not null
           order by ${co.id}
           offset $offset
           limit $pageSize
      """.decode(dbConcept.fromResultSet(co)).runList()
  }
}

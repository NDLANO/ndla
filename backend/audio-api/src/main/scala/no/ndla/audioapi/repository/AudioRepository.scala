/*
 * Part of NDLA audio-api
 * Copyright (C) 2016 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.audioapi.repository

import com.typesafe.scalalogging.StrictLogging
import no.ndla.audioapi.model.api.OptimisticLockException
import no.ndla.audioapi.model.domain.{AudioMetaInformation, DBAudioMetaInformation, DBSeries, Series}
import no.ndla.common.CirceUtil
import no.ndla.network.tapir.ErrorHelpers
import org.postgresql.util.PGobject
import scalikejdbc.*
import cats.implicits.*
import no.ndla.database.{DBUtility, OptionalRow, Row}
import no.ndla.database.implicits.*

import scala.util.{Failure, Success, Try}

class AudioRepository(using
    errorHelpers: ErrorHelpers,
    dbUtility: DBUtility,
    dbAudioMetaInformation: DBAudioMetaInformation,
    dbSeries: DBSeries,
) extends StrictLogging
    with Repository[AudioMetaInformation] {
  def audioCount(implicit session: DBSession = dbUtility.readOnlySession): Try[Long] =
    tsql"select count(*) from ${dbAudioMetaInformation.table}"
      .decode(_.required[Long]("count"))
      .runSingle()
      .map(_.getOrElse(0L))

  def withId(id: Long): Try[Option[AudioMetaInformation]] = {
    dbUtility.readOnly { implicit session =>
      audioMetaInformationWhere(sqls"au.id = $id")
    }
  }

  def withIds(ids: List[Long]): Try[List[AudioMetaInformation]] = {
    dbUtility.readOnly { implicit session =>
      audioMetaInformationsWhere(sqls"au.id in ($ids)")
    }
  }

  def withExternalId(externalId: String): Try[Option[AudioMetaInformation]] = {
    dbUtility.readOnly { implicit session =>
      audioMetaInformationWhere(sqls"au.external_id = $externalId")
    }
  }

  def insert(
      audioMetaInformation: AudioMetaInformation
  )(implicit session: DBSession = dbUtility.autoSession): Try[AudioMetaInformation] = {
    val dataObject = new PGobject()
    dataObject.setType("jsonb")
    dataObject.setValue(CirceUtil.toJsonString(audioMetaInformation))

    val startRevision = 1
    tsql"insert into audiodata (document, revision) values ($dataObject, $startRevision)"
      .updateAndReturnGeneratedKey()
      .map(audioId => audioMetaInformation.copy(id = Some(audioId), revision = Some(startRevision)))
  }

  def insertFromImport(audioMetaInformation: AudioMetaInformation, externalId: String): Try[AudioMetaInformation] = {
    val dataObject = new PGobject()
    dataObject.setType("jsonb")
    dataObject.setValue(CirceUtil.toJsonString(audioMetaInformation))

    dbUtility.localTx { implicit session =>
      val startRevision = 1
      tsql"insert into audiodata(external_id, document, revision) values($externalId, $dataObject, $startRevision)"
        .updateAndReturnGeneratedKey()
        .map(id => audioMetaInformation.copy(id = Some(id), revision = Some(startRevision)))
    }
  }

  def update(audioMetaInformation: AudioMetaInformation, id: Long): Try[AudioMetaInformation] = {
    val dataObject = new PGobject()
    dataObject.setType("jsonb")
    dataObject.setValue(CirceUtil.toJsonString(audioMetaInformation))

    dbUtility.localTx { implicit session =>
      val newRevision = audioMetaInformation.revision.getOrElse(0) + 1

      tsql"""
             update audiodata
             set document = $dataObject, revision = $newRevision
             where id = $id and revision = ${audioMetaInformation.revision}
             """
        .update()
        .flatMap {
          case count if count != 1 =>
            val message = s"Found revision mismatch when attempting to update audio with id $id"
            logger.info(message)
            Failure(OptimisticLockException.default)
          case _ =>
            logger.info(s"Updated audio with id $id")
            Success(audioMetaInformation.copy(id = Some(id), revision = Some(newRevision)))
        }
    }
  }

  def setSeriesId(audioMetaId: Long, seriesId: Option[Long])(implicit
      session: DBSession = dbUtility.autoSession
  ): Try[Long] = {
    tsql"""
           update ${dbAudioMetaInformation.table}
           set series_id = $seriesId
           where id = $audioMetaId
           """.update().map(_ => audioMetaId)
  }

  def numElements: Try[Int] = {
    dbUtility.readOnly { implicit session =>
      tsql"select count(*) from audiodata".decode(_.required[Int]("count")).runSingle().map(_.getOrElse(0))
    }
  }

  override def minMaxId(implicit session: DBSession = dbUtility.readOnlySession): Try[(Long, Long)] = {
    tsql"select coalesce(MIN(id),0) as mi, coalesce(MAX(id),0) as ma from audiodata"
      .decode(row => (row.required[Long]("mi"), row.required[Long]("ma")).tupled)
      .runSingle()
      .map(_.getOrElse((0L, 0L)))
  }

  def deleteAudio(audioId: Long)(implicit session: DBSession = dbUtility.autoSession): Try[Int] = {
    tsql"delete from ${dbAudioMetaInformation.table} where id=$audioId".update()
  }

  override def documentsWithIdBetween(min: Long, max: Long): Try[List[AudioMetaInformation]] = {
    audioMetaInformationsWhere(sqls"au.id between $min and $max")
  }

  private def audioMetaInformationWhere(
      whereClause: SQLSyntax
  )(implicit session: DBSession): Try[Option[AudioMetaInformation]] = {
    val au = dbAudioMetaInformation.syntax("au")
    val se = dbSeries.syntax("se")
    tsql"""
           select ${au.result.*}, ${se.result.*}
           from ${dbAudioMetaInformation.as(au)}
           left join ${dbSeries.as(se)} on ${au.seriesId} = ${se.id}
           where $whereClause
         """.decode(withSeries(au, se)).runFirst()
  }

  private def audioMetaInformationsWhere(
      whereClause: SQLSyntax
  )(implicit session: DBSession = dbUtility.readOnlySession): Try[List[AudioMetaInformation]] = {
    val au = dbAudioMetaInformation.syntax("au")
    val se = dbSeries.syntax("se")
    tsql"""
           select ${au.result.*}, ${se.result.*}
           from ${dbAudioMetaInformation.as(au)}
           left join ${dbSeries.as(se)} on ${au.seriesId} = ${se.id}
           where $whereClause
         """.decode(withSeries(au, se)).runList()
  }

  private def withSeries(au: SyntaxProvider[AudioMetaInformation], se: SyntaxProvider[Series])(
      row: Row
  ): Try[AudioMetaInformation] = for {
    audio  <- AudioMetaInformation.fromResultSet(au)(row)
    series <- OptionalRow.presentWhen(se.resultName.c("id"))(Series.fromResultSet(se)).decode(row)
  } yield audio.copy(series = series)

  def getRandomAudio()(implicit session: DBSession = dbUtility.readOnlySession): Try[Option[AudioMetaInformation]] = {
    val au = dbAudioMetaInformation.syntax("au")
    tsql"select ${au.result.*} from ${dbAudioMetaInformation.as(au)} tablesample public.system_rows(1)"
      .decode(AudioMetaInformation.fromResultSet(au))
      .runSingle()
  }

  def getByPage(pageSize: Int, offset: Int)(implicit
      session: DBSession = dbUtility.readOnlySession
  ): Try[Seq[AudioMetaInformation]] = {
    val au = dbAudioMetaInformation.syntax("au")
    tsql"""
           select ${au.result.*}
           from ${dbAudioMetaInformation.as(au)}
           where document is not null
           order by id
           offset $offset
           limit $pageSize
      """.decode(AudioMetaInformation.fromResultSet(au)).runList()
  }

}

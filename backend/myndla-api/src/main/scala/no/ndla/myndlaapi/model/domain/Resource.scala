/*
 * Part of NDLA myndla-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.model.domain

import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.{Decoder, Encoder}
import no.ndla.common.implicits.*
import no.ndla.common.model.NDLADate
import no.ndla.database.{ColumnDecoder, ColumnName, Row}
import no.ndla.myndlaapi.Props
import no.ndla.common.model.domain.ResourceType
import no.ndla.network.model.FeideID
import scalikejdbc.*

import java.util.UUID
import scala.util.Try

case class ResourceDocument(tags: List[String], resourceId: String) {
  def toFullResource(
      id: UUID,
      path: String,
      resourceType: ResourceType,
      feideId: String,
      created: NDLADate,
      connection: Option[ResourceConnection],
  ): Resource = Resource(
    id = id,
    feideId = feideId,
    path = path,
    resourceType = resourceType,
    tags = tags,
    created = created,
    resourceId = resourceId,
    connection = connection,
  )
}

object ResourceDocument {
  implicit val encoder: Encoder[ResourceDocument] = deriveEncoder
  implicit val decoder: Decoder[ResourceDocument] = deriveDecoder
}

case class Resource(
    id: UUID,
    feideId: FeideID,
    created: NDLADate,
    path: String,
    resourceType: ResourceType,
    tags: List[String],
    resourceId: String,
    connection: Option[ResourceConnection],
) extends FeideContent
    with Rankable
    with CopyableResource {
  override val sortId: UUID          = id
  override val sortRank: Option[Int] = connection.map(_.rank)
  override val rank: Option[Int]     = sortRank
}

object Resource {

  implicit val encoder: Encoder[Resource] = deriveEncoder
  implicit val decoder: Decoder[Resource] = deriveDecoder

  def fromResultSet(lp: SyntaxProvider[Resource])(row: Row): Try[Resource] =
    fromResultSet((s: String) => lp.resultName.c(s))(row)

  def fromResultSet(colNameWrapper: String => ColumnName)(row: Row): Try[Resource] = for {
    id           <- row.required[UUID](colNameWrapper("id"))
    feideId      <- row.required[String](colNameWrapper("feide_id"))
    created      <- row.required[NDLADate](colNameWrapper("created"))
    path         <- row.required[String](colNameWrapper("path"))
    resourceType <- row
      .required[String](colNameWrapper("resource_type"))
      .flatMap(rt => ResourceType.withNameOption(rt).toTry(NDLASQLException(s"Invalid resource type '$rt'")))
    document <- row.required[ResourceDocument](colNameWrapper("document"))(using ColumnDecoder.json)
  } yield document.toFullResource(id, path, resourceType, feideId, created, None)

  def fromResultSetWithConnection(lp: SyntaxProvider[Resource], cp: SyntaxProvider[ResourceConnection])(
      row: Row
  ): Try[Resource] =
    fromResultSetWithConnection((s: String) => lp.resultName.c(s), (s: String) => cp.resultName.c(s))(row)

  def fromResultSetWithConnection(resourceColumn: String => ColumnName, connectionColumn: String => ColumnName)(
      row: Row
  ): Try[Resource] = for {
    resource   <- fromResultSet(resourceColumn)(row)
    connection <- ResourceConnection.fromResultSet(connectionColumn)(row)
  } yield resource.copy(connection = Some(connection))
}

class DBResource(using props: Props) extends SQLSyntaxSupport[Resource] {
  override def tableName: String          = "resources"
  override def schemaName: Option[String] = Some(props.MetaSchema)
}

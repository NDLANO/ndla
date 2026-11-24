/*
 * Part of NDLA myndla-api
 * Copyright (C) 2024 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.myndlaapi.db.migrationwithdependencies

import no.ndla.database.{Row, TableIdType, TableMigration}
import no.ndla.myndlaapi.integration.TaxonomyApiClient
import scalikejdbc.{DBSession, scalikejdbcSQLInterpolationImplicitDef}

import java.util.UUID
import scala.util.Try

class V16__MigrateResourcePaths(using taxonomyApiClient: TaxonomyApiClient) extends TableMigration[ResourceRow] {
  override val tableName: String                       = "resources"
  override lazy val whereClause: scalikejdbc.SQLSyntax = sqls"path is not null"
  override val chunkSize: Int                          = 1000
  override val tableIdType: TableIdType                = TableIdType.UUID

  override def extractRowData(row: Row): Try[ResourceRow] = for {
    id           <- row.required[UUID]("id")
    resourceType <- row.required[String]("resource_type")
    path         <- row.required[String]("path")
  } yield ResourceRow(id, resourceType, path)
  override def updateRow(rowData: ResourceRow)(implicit session: DBSession): Int = {
    rowData.resourceType match {
      case "article" | "learningpath" | "multidisciplinary" | "topic" => taxonomyApiClient
          .resolveUrl(rowData.path)
          .map { path =>
            sql"update resources set path=$path where id = ${rowData.id}".update()
          }
          .get
      case _ => 0
    }
  }
}

case class ResourceRow(id: UUID, resourceType: String, path: String)

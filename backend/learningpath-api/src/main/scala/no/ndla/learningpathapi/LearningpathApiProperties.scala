/*
 * Part of NDLA learningpath-api
 * Copyright (C) 2016 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.learningpathapi

import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.auth.Permission
import no.ndla.common.configuration.BaseProps
import no.ndla.database.DatabaseProps
import no.ndla.network.Domains

import scala.util.Properties.*

type Props = LearningpathApiProperties

class LearningpathApiProperties extends BaseProps with DatabaseProps with StrictLogging {
  def ApplicationName = "learningpath-api"

  def ApplicationPort: Int    = propOrElse("APPLICATION_PORT", "80").toInt
  def DefaultLanguage: String = propOrElse("DEFAULT_LANGUAGE", "nb")

  def Domain: String = propOrElse("BACKEND_API_DOMAIN", Domains.get(Environment))

  def LearningpathControllerPath = "/learningpath-api/v2/learningpaths/"

  def SearchIndex: String = propOrElse("SEARCH_INDEX_NAME", "learningpaths")
  def SearchDocument      = "learningpath"
  def DefaultPageSize     = 10
  def MaxPageSize         = 10000
  def IndexBulkSize       = 1000

  object ExternalApiUrls {
    def ImageApiUrl            = s"$Domain/image-api/v3/images"
    def ImageApiRawUrl: String = propOrElse("IMAGE_API_CLOUDFRONT_DOMAIN", s"$Domain/image-api/raw")
  }

  def NdlaFrontendHostNames: Set[String] = Set("ndla.no", s"$Environment.ndla.no", "localhost")

  def ElasticSearchIndexMaxResultWindow          = 10000
  def ElasticSearchScrollKeepAlive               = "1m"
  def InitialScrollContextKeywords: List[String] = List("0", "initial", "start", "first")

  def AllowedHtmlTags: List[String] = List(
    "a",
    "b",
    "blockquote",
    "br",
    "cite",
    "code",
    "dd",
    "dl",
    "dt",
    "em",
    "i",
    "li",
    "ol",
    "p",
    "pre",
    "q",
    "section",
    "small",
    "strike",
    "strong",
    "sub",
    "sup",
    "u",
    "ul",
  )

  def SearchServer: String = propOrElse("SEARCH_SERVER", "http://search-learningpath-api.ndla-local")

  override def MetaMigrationLocation: String      = "no/ndla/learningpathapi/db/migration"
  override def MetaMigrationTable: Option[String] = Some("schema_version")

  override val ndlaAuth0Scopes: Seq[Permission] = Permission.thatStartsWith("learningpath")
}

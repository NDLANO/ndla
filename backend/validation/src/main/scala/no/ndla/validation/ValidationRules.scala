/*
 * Part of NDLA validation
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.validation

import no.ndla.common.CirceUtil
import no.ndla.common.implicits.*
import no.ndla.validation.model.{HtmlRulesFile, MathMLRulesFile}

import scala.io.Source
import scala.util.Try

object ValidationRules {

  private[validation] def readResource(resourceName: String): Try[String] = getClass
    .getClassLoader
    .toOption
    .toTry(new ConfigurationException(s"Unable to find class loader for reading resource '$resourceName'"))
    .map(classLoader => Source.fromResource(resourceName, classLoader).mkString)

  def embedTagRulesJson: HtmlRulesFile = {
    val jsonStr = readResource("embed-tag-rules.json")
    val parsed  = jsonStr.flatMap(CirceUtil.tryParseAs[HtmlRulesFile])
    parsed.get
  }
  def htmlRulesJson: HtmlRulesFile = {
    val jsonStr = readResource("html-rules.json")
    val parsed  = jsonStr.flatMap(CirceUtil.tryParseAs[HtmlRulesFile])
    parsed.get
  }
  def mathMLRulesJson: MathMLRulesFile = {
    val jsonStr = readResource("mathml-rules.json")
    val parsed  = jsonStr.flatMap(CirceUtil.tryParseAs[MathMLRulesFile])
    parsed.get
  }
}

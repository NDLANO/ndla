/*
 * Part of NDLA validation
 * Copyright (C) 2017 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.validation

import no.ndla.common.model.{EmbedType, TagAttribute}

import scala.language.postfixOps

object EmbedTagRules {
  private[validation] lazy val attributeRules: Map[EmbedType, TagRules.TagAttributeRules] = embedRulesToJson

  lazy val allEmbedTagAttributes: Set[TagAttribute] = attributeRules.flatMap { case (_, attrRules) =>
    attrRules.all
  } toSet

  def attributesForResourceType(resourceType: EmbedType): TagRules.TagAttributeRules = attributeRules(resourceType)

  private def embedRulesToJson: Map[EmbedType, TagRules.TagAttributeRules] = {
    val attrs = ValidationRules.readResource("embed-tag-rules.json").map(TagRules.convertJsonStrToAttributeRules).get

    def strToResourceType(str: String): EmbedType = EmbedType
      .withNameOption(str)
      .getOrElse(throw new ConfigurationException(s"Missing declaration of resource type '$str' in EmbedType enum"))

    attrs.map { case (resourceType, attrRules) =>
      strToResourceType(resourceType) -> attrRules
    }
  }
}

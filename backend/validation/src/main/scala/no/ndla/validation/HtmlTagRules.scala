/*
 * Part of NDLA validation
 * Copyright (C) 2017 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.validation

import no.ndla.common.configuration.Constants.EmbedTagName
import no.ndla.common.implicits.toOption
import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import org.jsoup.nodes.Entities.EscapeMode

import scala.jdk.CollectionConverters.*

object HtmlTagRules {

  private[validation] lazy val attributeRules: Map[String, TagRules.TagAttributeRules] = tagRulesToJson

  private def tagRulesToJson: Map[String, TagRules.TagAttributeRules] = {
    val attrs = ValidationRules.readResource("html-rules.json").map(TagRules.convertJsonStrToAttributeRules).get

    attrs.map { case (tagType, attrRules) =>
      tagType -> attrRules
    }
  }

  def stringToJsoupDocument(htmlString: String): Option[Element] = Jsoup
    .parseBodyFragment(htmlString)
    .toOption
    .flatMap { document =>
      document.outputSettings().toOption.flatMap(_.escapeMode(EscapeMode.xhtml).toOption).foreach(_.prettyPrint(false))
      document.select("body").toOption.flatMap(_.first().toOption)
    }

  def jsoupDocumentToString(element: Element): String = {
    element.select("body").toOption.flatMap(_.html().toOption).getOrElse("")
  }

  object PermittedHTML {
    val tags: Set[String]                         = readTags
    lazy val attributes: Map[String, Seq[String]] = readAttributes

    private def readTags: Set[String] = {
      val htmlJson   = ValidationRules.htmlRulesJson
      val mathMlJson = ValidationRules.mathMLRulesJson

      val htmlTags   = htmlJson.tags
      val mathMlTags = mathMlJson.attributes.keys

      htmlTags.toSet ++ mathMlTags ++ attributes.keys
    }

    private def readAttributes: Map[String, Seq[String]] = {
      val mathMlJson = ValidationRules.mathMLRulesJson

      val htmlAttrs = HtmlTagRules
        .attributeRules
        .map { case (tagType, attrs) =>
          tagType -> attrs.all.map(_.toString).toSeq
        }
      val mathMlAttrs = mathMlJson
        .attributes
        .map { case (k, v) =>
          k -> v.map(_.toString)
        }
      val embedAttrs = EmbedTagRules.allEmbedTagAttributes.map(_.toString).toSeq
      htmlAttrs ++ mathMlAttrs ++ Map(EmbedTagName -> embedAttrs)
    }
  }

  def isAttributeKeyValid(attributeKey: String, tagName: String): Boolean = {
    val legalAttrs = legalAttributesForTag(tagName)
    legalAttrs.contains(attributeKey)
  }

  def isTagValid(tagName: String): Boolean = PermittedHTML.tags.contains(tagName)

  def allLegalTags: Set[String] = PermittedHTML.tags

  private def attributesForTagType(tagType: String): Seq[String] = PermittedHTML
    .attributes
    .getOrElse(tagType, Seq.empty)

  def tagAttributesForTagType(tagType: String): Option[TagRules.TagAttributeRules] = attributeRules.get(tagType)

  def legalAttributesForTag(tagName: String): Set[String] = attributesForTagType(tagName).toSet

  def tagMustContainAtLeastOneOptionalAttribute(tagName: String): Boolean =
    tagAttributesForTagType(tagName).exists(_.mustContainAtLeastOneOptionalAttribute.getOrElse(false))

  def removeIllegalAttributes(el: Element, legalAttributes: Set[String]): Seq[String] = {
    el.attributes()
      .toOption
      .toList
      .flatMap(_.asScala)
      .flatMap(_.getKey.toOption)
      .filter(key => !legalAttributes.contains(key))
      .map(keyName => {
        el.removeAttr(keyName)
        keyName
      })
  }
}

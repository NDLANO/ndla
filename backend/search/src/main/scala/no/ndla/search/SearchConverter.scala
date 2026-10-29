/*
 * Part of NDLA search
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.search

import no.ndla.common.configuration.Constants.EmbedTagName
import no.ndla.common.implicits.toOption
import no.ndla.common.model.{EmbedType, TagAttribute}
import no.ndla.search.model.domain.EmbedValues
import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import org.jsoup.nodes.Entities.EscapeMode

import scala.jdk.CollectionConverters.CollectionHasAsScala

object SearchConverter {
  private def parseHtml(html: String): Option[Element] = {
    Jsoup
      .parseBodyFragment(html)
      .toOption
      .flatMap { document =>
        document
          .outputSettings()
          .toOption
          .flatMap(_.escapeMode(EscapeMode.xhtml).toOption)
          .foreach(_.prettyPrint(false))
        document.body().toOption
      }
  }

  def getEmbedValues(html: String, language: String): List[EmbedValues] = {
    parseHtml(html)
      .flatMap(_.select(EmbedTagName).toOption)
      .map(_.asScala.flatMap(_.toOption).map(embed => getEmbedValuesFromEmbed(embed, language)).toList)
      .getOrElse(List.empty)
  }

  private def getEmbedValuesFromEmbed(embed: Element, language: String): EmbedValues =
    EmbedValues(resource = getEmbedResource(embed), id = getEmbedIds(embed), language = language)

  private def getEmbedResource(embed: Element): Option[EmbedType] = {
    embed.attr(TagAttribute.DataResource.toString).toOption.filter(_.nonEmpty).flatMap(EmbedType.valueOf)
  }

  private val AttributesToKeep = List(
    TagAttribute.DataVideoId,
    TagAttribute.DataUrl,
    TagAttribute.DataResource_Id,
    TagAttribute.DataContentId,
    TagAttribute.DataArticleId,
    TagAttribute.DataImageId,
  )

  private def stripIdPostfix(str: String): String = {
    // NOTE: Some video ids can contain data like timestamp (`&t=123`)
    //       Stripping that for better search results
    str.takeWhile(_ != '&')
  }

  // If the string contains an '=' character, return the substring after the last '=';
  private def substringAfterEquals(str: String): String = {
    val idx = str.lastIndexOf('=')
    if (idx >= 0 && idx < str.length - 1) str.drop(idx + 1)
    else str
  }

  private def extractIdFromUrl(resourceUrl: String): List[String] = {
    if (resourceUrl.startsWith("http://") || resourceUrl.startsWith("https://")) {
      resourceUrl.split('/').filter(_.nonEmpty).lastOption match {
        case Some(last) => List(resourceUrl, substringAfterEquals(last))
        case None       => List(resourceUrl)
      }
    } else List(resourceUrl)
  }

  private def addTypeDiscriminator(embed: Element, value: String): List[String] = {
    val contentType = embed.attr(TagAttribute.DataContentType.toString)
    getEmbedResource(embed) match {
      case Some(EmbedType.ContentLink)    => List(value, s"$contentType:$value")
      case Some(EmbedType.RelatedContent) => List(value, s"article:$value")
      case _                              => List(value)
    }
  }

  private def getEmbedIds(embed: Element): List[String] = {
    AttributesToKeep.flatMap(attr =>
      embed.attr(attr.toString).toOption match {
        case None | Some("") => None
        case Some(value)     => attr match {
            case TagAttribute.DataArticleId   => addTypeDiscriminator(embed, value)
            case TagAttribute.DataContentId   => addTypeDiscriminator(embed, value)
            case TagAttribute.DataImageId     => List(value)
            case TagAttribute.DataUrl         => extractIdFromUrl(value)
            case TagAttribute.DataVideoId     => List(stripIdPostfix(value))
            case TagAttribute.DataResource_Id => List(value)
            case _                            => None
          }
      }
    )
  }

}

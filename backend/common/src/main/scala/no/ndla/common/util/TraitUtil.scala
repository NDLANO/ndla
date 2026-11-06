/*
 * Part of NDLA common
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.util

import cats.syntax.option.catsSyntaxOptionId
import no.ndla.common.implicits.toOption
import no.ndla.common.configuration.Constants.EmbedTagName
import no.ndla.common.model.TagAttribute
import no.ndla.common.model.api.search.ArticleTrait
import no.ndla.common.model.api.search.ArticleTrait.{Audio, Interactive, Podcast, Video}
import no.ndla.common.model.domain.ArticleContent
import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import org.jsoup.nodes.Entities.EscapeMode

import scala.jdk.CollectionConverters.*

class TraitUtil {
  private def parseHtml(html: String): Option[Element] = for {
    document <- Jsoup.parseBodyFragment(html).toOption
    settings <- document.outputSettings().toOption
    _        <- settings.escapeMode(EscapeMode.xhtml).toOption.flatMap(_.prettyPrint(false).toOption)
    body     <- document.body().toOption
  } yield body

  private def selectEmbeds(html: String): List[Element] = parseHtml(html)
    .flatMap(_.select(EmbedTagName).toOption)
    .toList
    .flatMap(_.asScala)

  def getArticleTraits(contents: Seq[ArticleContent]): List[ArticleTrait] = contents
    .flatMap { content =>
      val embedTags = selectEmbeds(content.content)
      val init      = List.empty[ArticleTrait]
      embedTags.foldLeft(init)((acc, embed) => acc ++ embedToMaybeTrait(embed))
    }
    .toList
    .distinct

  private val videoUrl = List(
    "elevkanalen.no",
    "filmiundervisning.no",
    "imdb.com",
    "khanacademy",
    "nrk",
    "qbrick",
    "ted.com",
    "tv2skole",
    "uio.no",
    "vimeo",
    "youtu",
  )
  private val interactiveUrl = List(
    "3dwarehouse.sketchup.com",
    "arcg.is",
    "arcgis.com",
    "codepen.io",
    "flo.uri.sh",
    "gapminder.org",
    "geogebra.org",
    "ggbm.at",
    "kartiskolen.no",
    "lab.concord.org",
    "miljodirektoratet.no",
    "miljostatus.no",
    "molview.org",
    "norgeibilder.no",
    "norgeskart.no",
    "norskpetroleum.no",
    "ourworldindata.org",
    "phet.colorado.edu",
    "prezi.com",
    "public.flourish.studio",
    "scribd.com",
    "sketchfab.com",
    "slideshare.net",
    "statisk",
    "trinket.io",
    "pickcode.io",
    "worldbank.org",
  )
  private def embedToMaybeTrait(embed: Element): Option[ArticleTrait] = {
    val dataResource = embed.attr(TagAttribute.DataResource.toString)
    val dataUrl      = embed.attr(TagAttribute.DataUrl.toString).toOption
    val dataType     = embed.attr(TagAttribute.DataType.toString)
    dataResource match {
      case "brightcove" | "nrk"                                                                => Video.some
      case "external" | "iframe" if dataUrl.exists(url => videoUrl.exists(url.contains))       => Video.some
      case "external" | "iframe" if dataUrl.exists(url => interactiveUrl.exists(url.contains)) => Interactive.some
      case "h5p"                                                                               => Interactive.some
      case "audio" if dataType == "podcast"                                                    => Podcast.some
      case "audio"                                                                             => Audio.some
      case _                                                                                   => None
    }
  }

  def getAttributes(html: String): List[String] = {
    selectEmbeds(html).flatMap(getAttributes)
  }

  private def getAttributes(embed: Element): List[String] = {
    val attributesToKeep = List(
      TagAttribute.DataAlt,
      TagAttribute.DataAuthors,
      TagAttribute.DataCaption,
      TagAttribute.DataDescription,
      TagAttribute.DataDisclaimer,
      TagAttribute.DataEdition,
      TagAttribute.DataLinkText,
      TagAttribute.DataPublisher,
      TagAttribute.DataSubtitle,
      TagAttribute.DataText,
      TagAttribute.DataTitle,
    )

    attributesToKeep.flatMap(attr =>
      embed.attr(attr.toString) match {
        case "" => None
        case a  => a.toOption
      }
    )
  }

}

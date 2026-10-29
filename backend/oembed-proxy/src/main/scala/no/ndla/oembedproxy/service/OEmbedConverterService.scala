/*
 * Part of NDLA oembed-proxy
 * Copyright (C) 2018 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.oembedproxy.service

import io.lemonlabs.uri.Url
import no.ndla.common.implicits.toOption
import no.ndla.oembedproxy.model.OEmbedDTO
import io.lemonlabs.uri.typesafe.dsl.*
import org.jsoup.Jsoup

object OEmbedConverterService {

  def addYoutubeTimestampIfdefinedInRequest(requestUrl: String, oembed: OEmbedDTO): OEmbedDTO = {
    val paramTypesToTransfer  = List("start", "time_continue", "t", "end", "rel")
    val queryParamsToTransfer = requestUrl.query.filterNames(pn => paramTypesToTransfer.contains(pn)).params

    queryParamsToTransfer match {
      case Vector() => oembed
      case _        =>
        val newHtml = oembed
          .html
          .flatMap(Jsoup.parseBodyFragment(_).toOption)
          .flatMap(document => {
            for {
              iframes <- document.select("iframe[src]").toOption
              element <- iframes.first.toOption
              src     <- element.attr("src").toOption
            } element.attr("src", src.addParams(queryParamsToTransfer).toString)
            document
              .body()
              .toOption
              .flatMap(_.html().toOption)
              .map(
                "&amp;".r.replaceAllIn(_, "&")
              ) // JSoup escapes & - even in attributes, and there is no way to disable it
          })
        oembed.copy(html = newHtml)
    }
  }

  def handleYoutubeRequestUrl(url: String): String = {
    val filtered = filterQueryNames("&amp;".r.replaceAllIn(url, "&"), Set("v", "list"))

    filtered.path.parts.toList match {
      case "embed" :: videoId :: _ => idToYoutubeUrl(videoId)
      case "v" :: videoId :: _     => idToYoutubeUrl(videoId)
      case _                       => filtered
    }
  }

  def idToYoutubeUrl(videoId: String): String = s"https://youtu.be/$videoId"

  def removeQueryString(url: String): String = Url.parse(url).removeQueryString().toString

  def removeQueryStringAndFragment(url: String): String = Url.parse(removeQueryString(url)).withFragment(None).toString

  private def filterQueryNames(url: String, allowedQueryParamNames: Set[String]): String = Url
    .parse(url)
    .filterQueryNames(allowedQueryParamNames.contains)
    .toString
}

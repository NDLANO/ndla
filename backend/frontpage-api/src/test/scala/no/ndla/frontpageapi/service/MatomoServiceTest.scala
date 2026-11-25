/*
 * Part of NDLA frontpage-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.frontpageapi.service

import no.ndla.common.model.domain.frontpage.PopularArticle
import no.ndla.frontpageapi.{TestEnvironment, UnitSuite}
import no.ndla.network.clients.matomo.model.MatomoPageUrlResult

class MatomoServiceTest extends UnitSuite with TestEnvironment {
  override implicit lazy val matomoService: MatomoService = new MatomoService

  test("taxonomy context id should be extracted from url") {
    val ctxIds = List("f009643d3a", "223342990757")
    ctxIds.foreach { ctxId =>
      val toExtract = List(
        s"https://ndla.no/r/verktoykassa---for-larere/planlegg-en-laringssti/$ctxId/6924",
        s"https://ndla.no/nn/r/verktoykassa---for-larere/planlegg-en-laringssti/$ctxId/6924",
        s"ndla.no/nn/r/verktoykassa---for-larere/planlegg-en-laringssti/$ctxId/6924",
        s"https://ndla.no/r/verktoykassa---for-larere/planlegg-en-laringssti/$ctxId",
        s"https://ndla.no/nb/r/verktoykassa---for-larere/planlegg-en-laringssti/$ctxId",
      )

      val toFail = List(
        s"https://ndla.no/nb/utdanning/bygg--og-anleggsteknikk/$ctxId",
        s"https://ndla.no/utdanning/bygg--og-anleggsteknikk/$ctxId",
        s"https://ndla.no/f/praktisk-yrkesutovelse-ba-bat-vg1/$ctxId",
        s"https://ndla.no/e/praktisk-yrkesutovelse-ba-bat-vg1/emne/$ctxId",
        s"https://ndla.no/nn/f/praktisk-yrkesutovelse-ba-bat-vg1/$ctxId",
      )

      toExtract.foreach { url =>
        val res = matomoService.extractContextId(url)
        if (!res.contains(ctxId)) fail(s"Failed to extract context id from url: $url, got: $res\n")
      }

      toFail.foreach { url =>
        val res = matomoService.extractContextId(url)
        if (res.nonEmpty) fail(s"Should not have extracted context id from url: $url, got: $res\n")
      }
    }
  }

  test("learningpath steps should be merged into a single popular article with the highest hit count") {
    val topPages = List(
      MatomoPageUrlResult("https://ndla.no/r/fag/laringssti/f009643d3a/222", 10, 5),
      MatomoPageUrlResult("https://ndla.no/r/fag/artikkel/223342990757", 60, 40),
      MatomoPageUrlResult("https://ndla.no/r/fag/laringssti/f009643d3a", 50, 30),
      MatomoPageUrlResult("https://ndla.no/f/fag/a1b2c3d4e5", 100, 90),
      MatomoPageUrlResult("https://ndla.no/r/fag/laringssti/f009643d3a/111", 80, 50),
    )

    matomoService.toPopularArticles(topPages) should
      be(List(PopularArticle("f009643d3a", 80), PopularArticle("223342990757", 60)))
  }

  test("popular articles should be limited to 20 distinct context ids") {
    val topPages = (1 to 30)
      .toList
      .map { i =>
        MatomoPageUrlResult(f"https://ndla.no/r/fag/ressurs/$i%010x", i.toLong, i.toLong)
      }

    val result = matomoService.toPopularArticles(topPages)
    result.size should be(20)
    result.head should be(PopularArticle("000000001e", 30))
  }

}

/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir.interceptors

import no.ndla.network.UnitSuite
import no.ndla.network.tapir.Vary
import no.ndla.network.tapir.Vary.varyByDefaultOn
import sttp.model.{Header, StatusCode}
import sttp.tapir.*
import sttp.tapir.server.model.ServerResponse

class VaryInterceptorTest extends UnitSuite {
  private val feideEndpoint = endpoint.get.varyByDefaultOn("FeideAuthorization")

  private def responseWith(headers: Header*): ServerResponse[String] =
    ServerResponse(StatusCode.Ok, headers.toList, None, None)

  private def headersOf(response: ServerResponse[String]): Seq[(String, String)] = response
    .headers
    .map(h => h.name -> h.value)

  test("That the endpoint default is added when the response doesn't override it") {
    val response = VaryInterceptor.withVary(feideEndpoint, responseWith(Header("Cache-Control", "private")))
    headersOf(response) should be(Seq("Cache-Control" -> "private", "Vary" -> "FeideAuthorization"))
  }

  test("That defaults from several auth helpers are combined") {
    val combined = endpoint.get.varyByDefaultOn("FeideAuthorization").varyByDefaultOn("Authorization")
    headersOf(VaryInterceptor.withVary(combined, responseWith())) should
      be(Seq("Vary" -> "FeideAuthorization, Authorization"))
  }

  test("That vary headers set by the response are combined with the default") {
    val response = VaryInterceptor.withVary(feideEndpoint, responseWith(Header("Vary", "Accept-Language")))
    headersOf(response) should be(Seq("Vary" -> "Accept-Language, FeideAuthorization"))
  }

  test("That an override replaces the default and the marker is removed") {
    val overridden =
      VaryInterceptor.withVary(feideEndpoint, responseWith(Vary(List("Authorization"), false).toHeaders*))
    headersOf(overridden) should be(Seq("Vary" -> "Authorization"))

    val sameForAll = VaryInterceptor.withVary(feideEndpoint, responseWith(Vary.SameForAllUsers.toHeaders*))
    headersOf(sameForAll) should be(Seq.empty)
  }

  test("That endpoints without auth get no vary header") {
    headersOf(VaryInterceptor.withVary(endpoint.get, responseWith())) should be(Seq.empty)
    headersOf(VaryInterceptor.withVary(endpoint.get, responseWith(Vary.SameForAllUsers.toHeaders*))) should
      be(Seq.empty)
  }
}

/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir

import sttp.model.{Header, HeaderNames}
import sttp.tapir.{AttributeKey, Endpoint}

/** Request headers a response varies on. Unless `includeEndpointDefault` is turned off, the headers the endpoint's auth
  * reads are added by [[no.ndla.network.tapir.interceptors.VaryInterceptor]].
  */
case class Vary(headers: List[String], includeEndpointDefault: Boolean) {
  def ++(other: Vary): Vary =
    Vary((headers ++ other.headers).distinct, includeEndpointDefault || other.includeEndpointDefault)

  def toHeaders: List[Header] = {
    val varyHeader     = Option.when(headers.nonEmpty)(Header(HeaderNames.Vary, headers.mkString(", ")))
    val overrideHeader = Option.when(!includeEndpointDefault)(Header(Vary.OverrideHeader, "true"))
    varyHeader.toList ++ overrideHeader.toList
  }
}

object Vary {
  val EndpointDefault: Vary = Vary(List.empty, includeEndpointDefault = true)
  val SameForAllUsers: Vary = Vary(List.empty, includeEndpointDefault = false)

  val OverrideHeader = "Ndla-Vary-Override"

  case class Default(headers: List[String])
  val defaultKey: AttributeKey[Default] = AttributeKey[Default]

  extension [A, I, E, O, R](endpoint: Endpoint[A, I, E, O, R]) {
    def varyByDefaultOn(headers: String*): Endpoint[A, I, E, O, R] = {
      val existing = endpoint.attribute(defaultKey).map(_.headers).getOrElse(List.empty)
      endpoint.attribute(defaultKey, Default((existing ++ headers).distinct))
    }
  }
}

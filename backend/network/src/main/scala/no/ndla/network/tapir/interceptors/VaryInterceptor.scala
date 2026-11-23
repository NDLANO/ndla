/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir.interceptors

import no.ndla.network.tapir.Vary
import sttp.model.{Header, HeaderNames}
import sttp.monad.MonadError
import sttp.shared.Identity
import sttp.tapir.AnyEndpoint
import sttp.tapir.server.interceptor.{
  DecodeFailureContext,
  DecodeSuccessContext,
  EndpointHandler,
  EndpointInterceptor,
  Responder,
  SecurityFailureContext,
}
import sttp.tapir.server.interpreter.BodyListener
import sttp.tapir.server.model.ServerResponse

/** Adds the `Vary` headers an endpoint's auth reads (see [[Vary.varyByDefaultOn]]) to its responses, unless the
  * response overrides them with [[Vary.OverrideHeader]], which is removed before the response is sent.
  */
object VaryInterceptor extends EndpointInterceptor[Identity] {
  override def apply[B](
      responder: Responder[Identity, B],
      endpointHandler: EndpointHandler[Identity, B],
  ): EndpointHandler[Identity, B] = new EndpointHandler[Identity, B] {
    override def onDecodeSuccess[A, U, I](
        ctx: DecodeSuccessContext[Identity, A, U, I]
    )(implicit monad: MonadError[Identity], bodyListener: BodyListener[Identity, B]): ServerResponse[B] =
      withVary(ctx.endpoint, endpointHandler.onDecodeSuccess(ctx))

    override def onSecurityFailure[A](
        ctx: SecurityFailureContext[Identity, A]
    )(implicit monad: MonadError[Identity], bodyListener: BodyListener[Identity, B]): ServerResponse[B] =
      withVary(ctx.endpoint, endpointHandler.onSecurityFailure(ctx))

    override def onDecodeFailure(
        ctx: DecodeFailureContext
    )(implicit monad: MonadError[Identity], bodyListener: BodyListener[Identity, B]): Option[ServerResponse[B]] =
      endpointHandler.onDecodeFailure(ctx)
  }

  def withVary[B](endpoint: AnyEndpoint, response: ServerResponse[B]): ServerResponse[B] = {
    val (overrides, headers)        = response.headers.partition(_.is(Vary.OverrideHeader))
    val (varyHeaders, otherHeaders) = headers.partition(_.is(HeaderNames.Vary))
    val defaults                    =
      if (overrides.nonEmpty) List.empty
      else endpoint.attribute(Vary.defaultKey).map(_.headers).getOrElse(List.empty)
    val names = (varyHeaders.flatMap(_.value.split(',').map(_.trim.nn).filter(_.nonEmpty)) ++ defaults).distinct
    response.copy(headers = otherHeaders ++ Option.when(names.nonEmpty)(Header(HeaderNames.Vary, names.mkString(", "))))
  }
}

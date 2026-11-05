/*
 * Part of NDLA network
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir.interceptors

import sttp.monad.MonadError
import sttp.shared.Identity
import sttp.tapir.model.ServerRequest
import sttp.tapir.server.ServerEndpoint
import sttp.tapir.server.interceptor.{EndpointInterceptor, RequestHandler, RequestInterceptor, RequestResult, Responder}

/** Base class for request interceptors that run code both before and after the rest of the request handling, like
  * [[ContextInterceptor]] and [[LogInterceptor]].
  *
  * Implement [[around]] and call `next` with the request to continue: code before `next` runs before the inner
  * interceptors and the endpoint, and code after it can inspect the result. Pass a modified request to `next` to change
  * what the inner interceptors see. Interceptors run in the order they are passed to `prependInterceptor`, so the first
  * one wraps all the others.
  *
  * Usage:
  * {{{
  * object TimingInterceptor extends AroundRequestInterceptor, StrictLogging {
  *   override def around[B](req: ServerRequest, next: ServerRequest => RequestResult[B]): RequestResult[B] = {
  *     val start = System.currentTimeMillis()
  *     try next(req)
  *     finally logger.info(s"${req.method} ${req.uri} took ${System.currentTimeMillis() - start}ms")
  *   }
  * }
  * }}}
  */
abstract class AroundRequestInterceptor extends RequestInterceptor[Identity] {
  def around[B](request: ServerRequest, next: ServerRequest => RequestResult[B]): RequestResult[B]

  override def apply[R, B](
      responder: Responder[Identity, B],
      requestHandler: EndpointInterceptor[Identity] => RequestHandler[Identity, R, B],
  ): RequestHandler[Identity, R, B] = new RequestHandler[Identity, R, B] {
    override def apply(request: ServerRequest, endpoints: List[ServerEndpoint[R, Identity]])(implicit
        monad: MonadError[Identity]
    ): RequestResult[B] = around(request, req => requestHandler(EndpointInterceptor.noop)(req, endpoints))
  }
}

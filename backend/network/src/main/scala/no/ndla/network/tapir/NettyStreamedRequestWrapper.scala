/*
 * Part of NDLA network
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir

import io.netty.handler.codec.DecoderResult
import io.netty.handler.codec.http.*
import no.ndla.common.implicits.toOption
import org.playframework.netty.http.StreamedHttpRequest
import org.reactivestreams.{Subscriber, Subscription}

import scala.annotation.nowarn

case class NettyStreamedRequestWrapper(request: StreamedHttpRequest, bodyCapture: RequestBodyCapture)
    extends StreamedHttpRequest {

  override def subscribe(s: Subscriber[? >: HttpContent] | Null): Unit = {
    val wrappedSubscriber = s
      .toOption
      .map { subscriber =>
        new Subscriber[HttpContent] {
          override def onNext(t: HttpContent | Null): Unit = {
            t.toOption.flatMap(_.content().toOption).foreach(bodyCapture.append)
            subscriber.onNext(t)
          }

          override def onComplete(): Unit = subscriber.onComplete()

          override def onError(t: Throwable | Null): Unit = subscriber.onError(t)

          override def onSubscribe(sub: Subscription | Null): Unit = subscriber.onSubscribe(sub)
        }
      }

    request.subscribe(wrappedSubscriber.orNull)
  }

  @nowarn("cat=deprecation")
  override def getMethod: HttpMethod | Null = request.getMethod

  override def method(): HttpMethod | Null = request.method

  override def setMethod(method: HttpMethod | Null): HttpRequest | Null = request.setMethod(method)

  @nowarn("cat=deprecation")
  override def getUri: String | Null = request.getUri

  override def uri(): String | Null = request.uri

  override def setUri(uri: String | Null): HttpRequest | Null = request.setUri(uri)

  override def setProtocolVersion(version: HttpVersion | Null): HttpRequest | Null = request.setProtocolVersion(version)

  @nowarn("cat=deprecation")
  override def getProtocolVersion: HttpVersion | Null = request.getProtocolVersion

  override def protocolVersion(): HttpVersion | Null = request.protocolVersion

  override def headers(): HttpHeaders | Null = request.headers

  @nowarn("cat=deprecation")
  override def getDecoderResult: DecoderResult | Null = request.getDecoderResult

  override def decoderResult(): DecoderResult | Null = request.decoderResult

  override def setDecoderResult(result: DecoderResult | Null): Unit = request.setDecoderResult(result)
}

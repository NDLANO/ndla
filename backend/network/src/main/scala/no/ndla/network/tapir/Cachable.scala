/*
 * Part of NDLA network
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir

import sttp.model.Header
import sttp.model.headers.CacheDirective

import scala.util.Try

/** Wrapper class for content that can have different cachability attributes based on the content Useful for Articles
  * that require login
  *
  * One would use the class by using `Cachable.yes(value)` (Or `Cachable.no(value)`) for values that can be cached and
  * then use `returnValue.Ok()` in the controller to get the resutling type with headers in a tuple.
  */
case class Cachable[T](value: T, canBeCached: Boolean, vary: Vary = Vary.EndpointDefault) {

  /** Return a tuple of [[T]] and [[DynamicHeaders]] type with the value as jsonbody and correct 'cache-control' and
    * 'vary' headers applied.
    */
  def Ok(headers: List[Header] = List.empty): (T, DynamicHeaders) = {
    val cacheHeaders =
      if (canBeCached) List.empty
      else List(Header.cacheControl(CacheDirective.Private))
    value -> DynamicHeaders(headers ++ cacheHeaders ++ vary.toHeaders)
  }

  /** Vary on exactly these headers instead of the ones the endpoint's auth reads. */
  def varyOnlyOn(header: String, more: String*): Cachable[T] =
    copy(vary = Vary((header :: more.toList).distinct, includeEndpointDefault = false))

  def sameForAllUsers: Cachable[T] = copy(vary = Vary.SameForAllUsers)

  /** Return a [[Cachable]] object with the function applied to value Example:
    * ```
    * val a = Cachable.yes("TestString")
    * val b = a.map(s => s.toLowerCase())
    *
    * // a.value = "TestString"
    * // b.value = "teststring"
    * ```
    */
  def map[U](f: T => U): Cachable[U] = {
    copy(value = f(value))
  }

  def flatMap[U](f: T => Cachable[U]): Cachable[U] = {
    val next = f(value)
    next.copy(canBeCached = canBeCached && next.canBeCached, vary = vary ++ next.vary)
  }
}

object Cachable {
  def merge[T](cachables: List[Cachable[T]]): Cachable[List[T]] = {
    val canBeCached = cachables.forall(_.canBeCached)
    val vary        = cachables.map(_.vary).reduceOption(_ ++ _).getOrElse(Vary.EndpointDefault)
    Cachable(cachables.map(_.value), canBeCached, vary)
  }

  def yes[T <: Try[U], U](value: T): Try[Cachable[U]] = value.map(v => Cachable.yes(v))

  def no[T <: Try[U], U](value: T): Try[Cachable[U]] = value.map(v => Cachable.no(v))

  def yes[T](value: T): Cachable[T] = new Cachable(value = value, canBeCached = true)

  def no[T](value: T): Cachable[T] = new Cachable(value = value, canBeCached = false)
}

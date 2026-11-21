/*
 * Part of NDLA network
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.tapir

import sttp.model.{Header, HeaderNames}
import sttp.model.headers.CacheDirective

import scala.util.Try

/** Wrapper class for content that can have different cachability attributes based on the content Useful for Articles
  * that require login
  *
  * One would use the class by using `Cachable.yes(value)` (Or `Cachable.no(value)`) for values that can be cached and
  * then use `returnValue.Ok()` in the controller to get the resutling type with headers in a tuple.
  */
case class Cachable[T](value: T, canBeCached: Boolean, vary: List[String] = List.empty) {

  /** Return a tuple of [[T]] and [[DynamicHeaders]] type with the value as jsonbody and correct 'cache-control' and
    * 'vary' headers applied.
    */
  def Ok(headers: List[Header] = List.empty): (T, DynamicHeaders) = {
    val cacheHeaders =
      if (canBeCached) List.empty
      else List(Header.cacheControl(CacheDirective.Private))
    val varyHeader = Option.when(vary.nonEmpty)(Header(HeaderNames.Vary, vary.mkString(", ")))
    value -> DynamicHeaders(headers ++ cacheHeaders ++ varyHeader)
  }

  def varyOn(headers: String*): Cachable[T] = copy(vary = (vary ++ headers).distinct)

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
    next.copy(canBeCached = canBeCached && next.canBeCached, vary = (vary ++ next.vary).distinct)
  }
}

object Cachable {
  def merge[T](cachables: List[Cachable[T]]): Cachable[List[T]] = {
    val canBeCached = cachables.forall(_.canBeCached)
    Cachable(cachables.map(_.value), canBeCached, cachables.flatMap(_.vary).distinct)
  }

  def yes[T <: Try[U], U](value: T): Try[Cachable[U]] = value.map(v => Cachable.yes(v))

  def no[T <: Try[U], U](value: T): Try[Cachable[U]] = value.map(v => Cachable.no(v))

  def yes[T](value: T): Cachable[T] = new Cachable(value = value, canBeCached = true)

  def no[T](value: T): Cachable[T] = new Cachable(value = value, canBeCached = false)
}

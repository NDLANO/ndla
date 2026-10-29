/*
 * Part of NDLA network
 * Copyright (C) 2022 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.network.clients.rediscache

import com.typesafe.scalalogging.StrictLogging
import no.ndla.common.implicits.*
import no.ndla.network.clients.rediscache.RedisStoredType
import redis.clients.jedis.RedisClient as JedisClient

import scala.jdk.CollectionConverters.*
import scala.util.Try

case class RedisConnectionFailureException(cause: Throwable)
    extends RuntimeException("Could not connect to Redis", cause)

class ScalaJedis(host: String, port: Int) extends StrictLogging {
  private val jedis = JedisClient.create(host, port).toOption

  def hexpire(prefix: RedisStoredType, key: String, field: String, seconds: Long): Try[Long] =
    doSafe(_.hexpire(prefix.getKey(key), seconds, field)).flatMap(_.toSingleScalaLong)
  def hexpireAt(prefix: RedisStoredType, key: String, field: String, unixTime: Long): Try[Long] =
    doSafe(_.hexpireAt(prefix.getKey(key), unixTime, field)).flatMap(_.toSingleScalaLong)
  def hget(prefix: RedisStoredType, key: String, field: String): Try[Option[String]] =
    doSafeOpt(_.hget(prefix.getKey(key), field))
  def hset(prefix: RedisStoredType, key: String, field: String, value: String): Try[Long] =
    doSafe(_.hset(prefix.getKey(key), field, value))
  def httl(prefix: RedisStoredType, key: String, field: String): Try[Long] = doSafe(_.httl(prefix.getKey(key), field))
    .flatMap(_.toSingleScalaLong)

  def ping(): Try[Unit] = doSafe(_.ping: Unit)

  def getFieldNewTtl(redisType: RedisStoredType, key: String, field: String): Try[Long] = for {
    existingExpireTime <- httl(redisType, key, field)
    keepExistingTTL     = existingExpireTime > 0 && !redisType.refreshTTL
    newExpireTime       = Option.when(keepExistingTTL)(existingExpireTime)
  } yield newExpireTime.getOrElse(redisType.cacheTime.toSeconds)

  private def client: Try[JedisClient] =
    jedis.toTry(new IllegalStateException(s"Could not create Redis client for $host:$port"))
  private def doSafe[T](f: JedisClient => T): Try[T]                   = client.flatMap(c => Try(f(c)))
  private def doSafeOpt[T](f: JedisClient => T | Null): Try[Option[T]] = client.flatMap(c => Try(f(c).toOption))

  extension (javaLongList: java.util.List[java.lang.Long] | Null) {
    def toSingleScalaLong: Try[Long] = javaLongList
      .toOption
      .flatMap(_.asScala.headOption)
      .map(_.longValue)
      .toTry(new NoSuchElementException("Expected a single value in Redis response"))
  }
}

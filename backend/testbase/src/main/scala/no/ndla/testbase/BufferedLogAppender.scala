/*
 * Part of NDLA testbase
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.testbase

import org.apache.logging.log4j.core.LogEvent
import org.apache.logging.log4j.core.appender.AbstractAppender
import org.apache.logging.log4j.core.layout.PatternLayout

import scala.collection.mutable.ListBuffer

object Layout {
  lazy val prebuiltLayout: PatternLayout = PatternLayout
    .newBuilder()
    .nn
    .setPattern("[%level] (%X{correlationID}) %C.%M#%L: %msg%n")
    .nn
    .build()
    .nn
}

class BufferedLogAppender
    extends AbstractAppender("BufferedAppender", null, Layout.prebuiltLayout, false, Array.empty) {
  private val logQueue              = ListBuffer.empty[String]
  def clear(): Unit                 = logQueue.clear()
  def printLogs(): Unit             = logQueue.foreach(print)
  def getAndClearLogs: List[String] = {
    val toReturn = logQueue.toList
    logQueue.clear()
    toReturn
  }

  override def append(event: LogEvent | Null): Unit = {
    // Calling `toSerializable` through the generic `Layout` is erased to a non-existent `Object`-returning method
    // under -Yno-flexible-types, so it must go through the concrete `PatternLayout`.
    val layout = getLayout match {
      case patternLayout: PatternLayout => patternLayout
      case other                        =>
        throw new IllegalStateException(s"Appender '$getName' needs a PatternLayout to format log events, got: $other")
    }
    val logString = layout.toSerializable(event).toString
    logQueue.append(logString)
  }
}

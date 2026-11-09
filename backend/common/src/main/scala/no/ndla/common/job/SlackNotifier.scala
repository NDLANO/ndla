/*
 * Part of NDLA common
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.job

import com.typesafe.scalalogging.StrictLogging
import io.circe.Encoder
import io.circe.generic.semiauto.deriveEncoder
import no.ndla.common.CirceUtil
import no.ndla.common.Environment.{booleanPropOrFalse, unsafeProp}
import sttp.client4.quick.*

import scala.util.Properties.propOrElse
import scala.util.{Failure, Success, Try}

/** Sends error messages to Slack if `SLACK_ERROR_ENABLED` is set. Requires `SLACK_TOKEN` to be set when enabled. */
object SlackNotifier extends StrictLogging {
  private val EnabledFlag = "SLACK_ERROR_ENABLED"

  private case class SlackAttachment(title: String, color: String, ts: String, text: String)
  private case class SlackPayload(channel: String, username: String, attachments: Seq[SlackAttachment])

  private given Encoder[SlackAttachment] = deriveEncoder
  private given Encoder[SlackPayload]    = deriveEncoder

  def sendError(title: String, text: String): Unit = {
    if (!booleanPropOrFalse(EnabledFlag)) {
      logger.info(s"Skipping sending message to Slack because $EnabledFlag is not enabled")
      return
    }

    logger.info("Sending message to Slack...")
    val payload = SlackPayload(
      channel = propOrElse("SLACK_CHANNEL", "ndla-indexing-errors"),
      username = propOrElse("SLACK_USERNAME", "indexbot"),
      attachments = Seq(
        SlackAttachment(
          title = title,
          color = "#ff0000",
          ts = (System.currentTimeMillis() / 1000).toString,
          text = text,
        )
      ),
    )
    val url = propOrElse("SLACK_URL", "https://slack.com/api/chat.postMessage")

    Try {
      quickRequest
        .post(uri"$url")
        .body(CirceUtil.toJsonString(payload))
        .header("Content-Type", "application/json")
        .header("Authorization", s"Bearer ${unsafeProp("SLACK_TOKEN")}")
        .send()
    } match {
      case Success(response) if response.isSuccess => ()
      case Success(response)                       => logger.warn(s"Failed to send message to Slack (${response.code}): ${response.body}")
      case Failure(ex)                             => logger.warn("Failed to send message to Slack", ex)
    }
  }
}

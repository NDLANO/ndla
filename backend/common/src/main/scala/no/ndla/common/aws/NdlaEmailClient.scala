/*
 * Part of NDLA common
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common.aws

import no.ndla.common.TryUtil.throwIfInterrupted
import no.ndla.common.implicits.*
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.sesv2.SesV2Client
import software.amazon.awssdk.services.sesv2.model.*

import scala.util.Try

class NdlaEmailClient(senderEmail: String, senderName: String, region: Option[String]) {
  lazy val client: Option[SesV2Client] = SesV2Client
    .builder()
    .toOption
    .flatMap { builder =>
      region match {
        case Some(value) => builder.region(Region.of(value)).toOption.flatMap(_.build().toOption)
        case None        => builder.build().toOption
      }
    }

  def sendEmail(to: String, subject: String, bodyStr: String): Try[Boolean] = {
    Try
      .throwIfInterrupted {
        for {
          destination      <- Destination.builder().toOption
          destination      <- destination.toAddresses(to).toOption
          destination      <- destination.build().toOption
          content          <- Content.builder().toOption
          content          <- content.data(bodyStr).toOption
          content          <- content.build().toOption
          sub              <- Content.builder().toOption
          sub              <- sub.data(subject).toOption
          sub              <- sub.build().toOption
          body             <- Body.builder().toOption
          body             <- body.html(content).toOption
          body             <- body.build().toOption
          msg              <- Message.builder().toOption
          msg              <- msg.subject(sub).toOption
          msg              <- msg.body(body).toOption
          msg              <- msg.build().toOption
          bodyEmailContent <- EmailContent.builder().toOption
          bodyEmailContent <- bodyEmailContent.simple(msg).toOption
          bodyEmailContent <- bodyEmailContent.build().toOption
          emailRequest     <- SendEmailRequest.builder().toOption
          emailRequest     <- emailRequest.destination(destination).toOption
          emailRequest     <- emailRequest.fromEmailAddress(s"$senderName <$senderEmail>").toOption
          emailRequest     <- emailRequest.content(bodyEmailContent).toOption
          emailRequest     <- emailRequest.build().toOption
          ses              <- client
          response         <- ses.sendEmail(emailRequest).toOption
        } yield Option(response.messageId()).exists(_.nonEmpty)
      }
      .flatMap(_.toTry(new NullPointerException("Got unexpected null value from SES client during 'sendEmail'")))
  }

}

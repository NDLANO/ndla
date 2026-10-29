/*
 * Part of NDLA learningpath-api
 * Copyright (C) 2016 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.learningpathapi.validation

import no.ndla.common.errors.ValidationMessage
import no.ndla.common.implicits.toOption
import no.ndla.learningpathapi.Props
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist

class TextValidator(allowHtml: Boolean)(using props: Props) {
  val IllegalContentInBasicText: String =
    s"The content contains illegal html-characters. Allowed characters are ${props.AllowedHtmlTags.mkString(", ")}"

  val IllegalContentInPlainText = "The content contains illegal html-characters. No HTML is allowed."
  private val FieldEmpty        = "Required field is empty."

  def validate(fieldPath: String, text: String): Option[ValidationMessage] = {
    if (allowHtml) {
      validateOnlyAllowedHtmlTags(fieldPath, text)
    } else {
      validateNoHtmlTags(fieldPath, text)
    }
  }

  private def validateOnlyAllowedHtmlTags(fieldPath: String, text: String): Option[ValidationMessage] = {
    if (text.isEmpty) {
      Some(ValidationMessage(fieldPath, FieldEmpty))
    } else {
      val safelist = Safelist
        .basic()
        .toOption
        .flatMap(_.addTags("section", "h2", "h3").toOption)
        .flatMap(_.addAttributes("a", "target", "rel").toOption)
        .flatMap(_.addAttributes("span", "lang", "dir").toOption)
      if (safelist.exists(Jsoup.isValid(text, _))) {
        None
      } else {
        Some(ValidationMessage(fieldPath, IllegalContentInBasicText))
      }
    }
  }

  private def validateNoHtmlTags(fieldPath: String, text: String): Option[ValidationMessage] = {
    if (Jsoup.isValid(text, Safelist.none())) {
      None
    } else {
      Some(ValidationMessage(fieldPath, IllegalContentInPlainText))
    }
  }
}

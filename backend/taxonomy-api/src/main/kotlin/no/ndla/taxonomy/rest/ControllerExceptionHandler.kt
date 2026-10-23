/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest

import com.auth0.jwt.exceptions.JWTVerificationException
import no.ndla.taxonomy.domain.exceptions.ChildNotFoundException
import no.ndla.taxonomy.domain.exceptions.DuplicateIdException
import no.ndla.taxonomy.domain.exceptions.IdFormatException
import no.ndla.taxonomy.domain.exceptions.NotFoundException
import no.ndla.taxonomy.domain.exceptions.PrimaryParentRequiredException
import no.ndla.taxonomy.service.exceptions.DuplicateConnectionException
import no.ndla.taxonomy.service.exceptions.InvalidArgumentServiceException
import no.ndla.taxonomy.service.exceptions.NotFoundServiceException
import no.ndla.taxonomy.service.exceptions.ServiceUnavailableException
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.client.RestClientException
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler
import tools.jackson.databind.node.JsonNodeFactory

@ControllerAdvice
class ControllerExceptionHandler : ResponseEntityExceptionHandler() {
  private fun createErrorBody(exception: RuntimeException): String =
      try {
        val jsonObject = JsonNodeFactory.instance.objectNode()
        jsonObject.put("error", exception.message)
        jsonObject.toString()
      } catch (jsonException: Exception) {
        throw RuntimeException(jsonException)
      }

  private fun createHeaders(): HttpHeaders {
    val headers = HttpHeaders()
    headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
    return headers
  }

  @ExceptionHandler(JWTVerificationException::class, AccessDeniedException::class)
  protected fun handleAuthenticationExceptions(
      exception: RuntimeException
  ): ResponseEntity<String> =
      ResponseEntity(createErrorBody(exception), createHeaders(), HttpStatus.UNAUTHORIZED)

  @ExceptionHandler(ServiceUnavailableException::class)
  protected fun handleServiceUnavailableException(
      exception: RuntimeException
  ): ResponseEntity<String> =
      ResponseEntity(createErrorBody(exception), createHeaders(), HttpStatus.SERVICE_UNAVAILABLE)

  @ExceptionHandler(
      ChildNotFoundException::class,
      NotFoundException::class,
      NotFoundServiceException::class,
      NotFoundHttpResponseException::class,
  )
  protected fun handleNotFoundServiceException(
      exception: RuntimeException
  ): ResponseEntity<String> =
      ResponseEntity(createErrorBody(exception), createHeaders(), HttpStatus.NOT_FOUND)

  @ExceptionHandler(DuplicateIdException::class, DuplicateConnectionException::class)
  protected fun handleConflictExceptions(exception: RuntimeException): ResponseEntity<String> =
      ResponseEntity(createErrorBody(exception), createHeaders(), HttpStatus.CONFLICT)

  @ExceptionHandler(UnsupportedOperationException::class)
  protected fun handleUnsupportedExceptions(exception: RuntimeException): ResponseEntity<String> =
      ResponseEntity(createErrorBody(exception), createHeaders(), HttpStatus.GONE)

  @ExceptionHandler(
      IdFormatException::class,
      InvalidArgumentServiceException::class,
      IllegalArgumentException::class,
      PrimaryParentRequiredException::class,
  )
  protected fun handleInvalidArgumentExceptions(
      exception: RuntimeException
  ): ResponseEntity<String> =
      ResponseEntity(createErrorBody(exception), createHeaders(), HttpStatus.BAD_REQUEST)

  @ExceptionHandler(NullPointerException::class, RestClientException::class)
  protected fun handleRestOfExceptions(exception: RuntimeException): ResponseEntity<String> =
      ResponseEntity(createErrorBody(exception), createHeaders(), HttpStatus.INTERNAL_SERVER_ERROR)
}

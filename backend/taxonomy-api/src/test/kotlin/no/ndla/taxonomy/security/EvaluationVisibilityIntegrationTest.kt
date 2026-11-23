/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.security

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.exceptions.JWTVerificationException
import jakarta.servlet.Filter
import jakarta.servlet.http.HttpServlet
import java.security.KeyPairGenerator
import java.security.interfaces.RSAPrivateKey
import java.util.UUID
import no.ndla.taxonomy.service.AbstractIntegrationTest
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.hasItem
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.HttpHeaders.AUTHORIZATION
import org.springframework.http.HttpHeaders.VARY
import org.springframework.http.MediaType.APPLICATION_JSON
import org.springframework.mock.web.MockFilterChain
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.util.ReflectionTestUtils
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActions
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest(
    properties =
        [
            "auth0.audience=$AUDIENCE",
            "auth0.issuer=http://localhost:1/",
            "auth0.jwks.kid=test",
        ])
@AutoConfigureMockMvc
@ActiveProfiles("junit", "auth")
class EvaluationVisibilityIntegrationTest : AbstractIntegrationTest() {

  @Autowired private lateinit var mockMvc: MockMvc
  @Autowired private lateinit var authFilter: AuthFilter
  @Autowired private lateinit var filters: List<Filter>

  private val suffix = UUID.randomUUID().toString()
  private val topicId = "urn:topic:$suffix"
  private val resourceId = "urn:resource:$suffix"

  @BeforeEach
  fun setUp() {
    ReflectionTestUtils.setField(authFilter, "publicKey", keyPair.public)

    write(
        post("/v1/nodes"),
        """{"nodeType":"TOPIC","nodeId":"$suffix","name":"topic"}""",
    )
    write(
        post("/v1/nodes"),
        """{"nodeType":"RESOURCE","nodeId":"$suffix","name":"resource",""" +
            """"qualityEvaluation":{"grade":4,"note":"Needs work"},""" +
            """"technicalEvaluation":{"requiresEvaluation":true,"comment":"Check video"}}""",
    )
    write(
        post("/v1/node-connections"),
        """{"parentId":"$topicId","childId":"$resourceId"}""",
    )
  }

  @AfterEach
  fun tearDown() {
    mockMvc.perform(delete("/v1/nodes/$resourceId").auth("taxonomy:write"))
    mockMvc.perform(delete("/v1/nodes/$topicId").auth("taxonomy:write"))
  }

  private fun token(vararg permissions: String): String =
      JWT.create()
          .withAudience(AUDIENCE)
          .withArrayClaim("permissions", permissions)
          .sign(Algorithm.RSA256(null, keyPair.private as RSAPrivateKey))

  private fun MockHttpServletRequestBuilder.auth(vararg permissions: String) =
      if (permissions.isEmpty()) this else header("Authorization", "Bearer ${token(*permissions)}")

  private fun write(request: MockHttpServletRequestBuilder, body: String) {
    mockMvc
        .perform(request.auth("taxonomy:write").contentType(APPLICATION_JSON).content(body))
        .andExpect(status().isCreated)
  }

  private fun getNode(id: String, vararg permissions: String): ResultActions =
      mockMvc.perform(get("/v1/nodes/$id").auth(*permissions)).andExpect(status().isOk)

  private fun ResultActions.expectHidden(prefix: String = "$"): ResultActions =
      andExpect(jsonPath("$prefix.qualityEvaluation").doesNotExist())
          .andExpect(jsonPath("$prefix.gradeAverage").doesNotExist())
          .andExpect(jsonPath("$prefix.technicalEvaluation").doesNotExist())

  private fun ResultActions.expectResourceEvaluations(prefix: String = "$"): ResultActions =
      andExpect(jsonPath("$prefix.qualityEvaluation.grade").value(4))
          .andExpect(jsonPath("$prefix.qualityEvaluation.note").value("Needs work"))
          .andExpect(jsonPath("$prefix.technicalEvaluation.requiresEvaluation").value(true))
          .andExpect(jsonPath("$prefix.technicalEvaluation.comment").value("Check video"))

  @Test
  fun anonymous_caller_does_not_see_evaluations() {
    getNode(resourceId).expectHidden()
    getNode(topicId).expectHidden()
  }

  @Test
  fun caller_without_write_permission_does_not_see_evaluations() {
    getNode(resourceId, "concept:write").expectHidden()
    getNode(topicId, "concept:write").expectHidden()
  }

  @Test
  fun taxonomy_writer_sees_evaluations() {
    getNode(resourceId, "taxonomy:write").expectResourceEvaluations()
    getNode(topicId, "taxonomy:write")
        .andExpect(jsonPath("$.gradeAverage.averageValue").value(4.0))
        .andExpect(jsonPath("$.gradeAverage.count").value(1))
  }

  @Test
  fun taxonomy_admin_sees_evaluations() {
    getNode(resourceId, "taxonomy:admin").expectResourceEvaluations()
  }

  @Test
  fun drafts_writer_sees_evaluations() {
    getNode(resourceId, "drafts:write").expectResourceEvaluations()
  }

  @Test
  fun drafts_publisher_sees_evaluations() {
    getNode(resourceId, "drafts:publish").expectResourceEvaluations()
  }

  @Test
  fun child_listing_follows_the_same_rule() {
    val children = "/v1/nodes/$topicId/nodes?nodeType=RESOURCE"
    mockMvc
        .perform(get(children))
        .andExpect(status().isOk)
        .andExpect(jsonPath("$[0].id").value(resourceId))
        .expectHidden("$[0]")

    mockMvc
        .perform(get(children).auth("taxonomy:write"))
        .andExpect(status().isOk)
        .expectResourceEvaluations("$[0]")
  }

  @Test
  fun responses_vary_on_authorization() {
    getNode(resourceId).andExpect(header().stringValues(VARY, hasItem(AUTHORIZATION)))
    getNode(resourceId, "taxonomy:write")
        .andExpect(header().stringValues(VARY, hasItem(AUTHORIZATION)))
  }

  @Test
  fun responses_vary_on_authorization_when_token_is_rejected() {
    val chain =
        filters.filter { it is AuthFilter || it is VaryOnAuthorizationFilter }.toTypedArray()
    val request =
        MockHttpServletRequest("GET", "/v1/nodes/$resourceId").apply {
          addHeader(AUTHORIZATION, "Bearer invalid")
        }
    val response = MockHttpServletResponse()

    assertThrows<JWTVerificationException> {
      MockFilterChain(object : HttpServlet() {}, *chain).doFilter(request, response)
    }
    assertThat(response.getHeaders(VARY), hasItem(AUTHORIZATION))
  }

  companion object {
    private val keyPair =
        KeyPairGenerator.getInstance("RSA").apply { initialize(2048) }.genKeyPair()
  }
}

private const val AUDIENCE = "taxonomy-test"

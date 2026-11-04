/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.security

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import java.security.KeyPairGenerator
import java.security.interfaces.RSAPrivateKey
import no.ndla.taxonomy.domain.Version
import no.ndla.taxonomy.rest.v1.commands.VersionPost
import no.ndla.taxonomy.service.AbstractIntegrationTest
import no.ndla.taxonomy.service.VersionService
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType.APPLICATION_JSON
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.util.ReflectionTestUtils
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

/**
 * Runs the full request pipeline with the auth profile, so it fails if VersionWriteInterceptor is
 * no longer registered when auth is enabled.
 */
@SpringBootTest(
    properties =
        [
            "auth0.audience=$AUDIENCE",
            "auth0.issuer=http://localhost:1/",
            "auth0.jwks.kid=test",
        ])
@AutoConfigureMockMvc
@ActiveProfiles("junit", "auth")
class VersionWriteAccessIntegrationTest : AbstractIntegrationTest() {

  @Autowired private lateinit var mockMvc: MockMvc
  @Autowired private lateinit var versionService: VersionService
  @Autowired private lateinit var authFilter: AuthFilter

  private lateinit var version: Version

  @BeforeEach
  fun setUp() {
    ReflectionTestUtils.setField(authFilter, "publicKey", keyPair.public)
    version = versionService.createNewVersion(null, VersionPost(name = "Beta"))
  }

  @AfterEach
  fun tearDown() {
    versionService.delete(version.publicId)
  }

  private fun token(vararg permissions: String): String =
      JWT.create()
          .withAudience(AUDIENCE)
          .withArrayClaim("permissions", permissions)
          .sign(Algorithm.RSA256(null, keyPair.private as RSAPrivateKey))

  private fun createNode(versionHash: String?, vararg permissions: String) =
      post("/v1/nodes")
          .header("Authorization", "Bearer ${token(*permissions)}")
          .contentType(APPLICATION_JSON)
          .content("""{"nodeType":"NODE","name":"node"}""")
          .withVersion(versionHash)

  private fun MockHttpServletRequestBuilder.withVersion(versionHash: String?) =
      versionHash?.let { header("VersionHash", it) } ?: this

  @Test
  fun writer_cannot_write_to_non_default_version() {
    mockMvc
        .perform(createNode(version.hash, "taxonomy:write"))
        .andExpect(status().isUnauthorized)
        .andExpect(
            jsonPath("$.error").value("Only taxonomy admins can modify non-default versions"))
  }

  @Test
  fun admin_can_write_to_non_default_version() {
    mockMvc
        .perform(createNode(version.hash, "taxonomy:write", "taxonomy:admin"))
        .andExpect(status().isCreated)
  }

  @Test
  fun writer_can_write_to_default_version() {
    mockMvc.perform(createNode(null, "taxonomy:write")).andExpect(status().isCreated)
  }

  @Test
  fun writer_can_read_non_default_version() {
    mockMvc
        .perform(
            get("/v1/nodes")
                .header("Authorization", "Bearer ${token("taxonomy:write")}")
                .withVersion(version.hash))
        .andExpect(status().isOk)
  }

  companion object {
    private val keyPair =
        KeyPairGenerator.getInstance("RSA").apply { initialize(2048) }.genKeyPair()
  }
}

private const val AUDIENCE = "taxonomy-test"

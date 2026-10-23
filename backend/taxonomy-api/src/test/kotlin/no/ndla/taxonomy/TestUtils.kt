/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy

import jakarta.persistence.EntityManager
import java.net.URI
import java.util.function.Predicate
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.fail
import org.springframework.http.MediaType.APPLICATION_JSON
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultMatcher
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup
import org.springframework.web.context.WebApplicationContext
import tools.jackson.core.type.TypeReference
import tools.jackson.databind.json.JsonMapper

@Component
class TestUtils(
    private val jsonMapper: JsonMapper,
    webApplicationContext: WebApplicationContext,
    private val entityManager: EntityManager,
) {
  private val mockMvc: MockMvc = webAppContextSetup(webApplicationContext).build()

  fun json(o: Any?): String = jsonMapper.writeValueAsString(o)

  @JvmOverloads
  fun createResource(
      path: String,
      command: Any?,
      resultMatcher: ResultMatcher = status().isCreated(),
  ): MockHttpServletResponse {
    entityManager.flush()
    return mockMvc
        .perform(post(path).contentType(APPLICATION_JSON).content(json(command)))
        .andExpect(resultMatcher)
        .andReturn()
        .response
  }

  fun createResource(path: String): MockHttpServletResponse {
    entityManager.flush()
    return mockMvc.perform(post(path)).andReturn().response
  }

  @JvmOverloads
  fun getResource(
      path: String,
      resultMatcher: ResultMatcher = status().isOk(),
  ): MockHttpServletResponse {
    entityManager.flush()
    return mockMvc
        .perform(get(path).accept(APPLICATION_JSON))
        .andExpect(resultMatcher)
        .andReturn()
        .response
  }

  @JvmOverloads
  fun deleteResource(
      path: String,
      resultMatcher: ResultMatcher = status().isNoContent(),
  ): MockHttpServletResponse {
    entityManager.flush()
    return mockMvc.perform(delete(path)).andExpect(resultMatcher).andReturn().response
  }

  @JvmOverloads
  fun updateResourceRawInput(
      path: String,
      rawInput: String,
      resultMatcher: ResultMatcher = status().isNoContent(),
  ): MockHttpServletResponse =
      mockMvc
          .perform(put(path).contentType(APPLICATION_JSON).content(rawInput))
          .andExpect(resultMatcher)
          .andReturn()
          .response

  @JvmOverloads
  fun updateResource(
      path: String,
      command: Any? = null,
      resultMatcher: ResultMatcher = status().isNoContent(),
  ): MockHttpServletResponse {
    entityManager.flush()
    return if (command == null)
        mockMvc
            .perform(put(path).contentType(APPLICATION_JSON))
            .andExpect(resultMatcher)
            .andReturn()
            .response
    else
        mockMvc
            .perform(put(path).contentType(APPLICATION_JSON).content(json(command)))
            .andExpect(resultMatcher)
            .andReturn()
            .response
  }

  fun <V> getObject(theClass: Class<V>, response: MockHttpServletResponse): V =
      jsonMapper.readValue(response.contentAsByteArray, theClass)

  fun <V> getObject(typeReference: TypeReference<V>, response: MockHttpServletResponse): V =
      jsonMapper.readValue(response.contentAsByteArray, typeReference)

  companion object {
    @JvmStatic
    fun getId(response: MockHttpServletResponse): URI {
      val location = response.getHeader("Location")!!
      return URI.create(location.substringAfterLast('/'))
    }

    @JvmStatic
    fun <V : Any> assertAnyTrue(objects: Array<V>, predicate: Predicate<V>) {
      assertTrue(objects.isNotEmpty(), "Array was empty")
      val className = objects[0].javaClass.simpleName
      assertTrue(objects.any(predicate::test), "No $className matching predicate found.")
    }

    @JvmStatic
    fun <V : Any> assertAnyTrue(objects: Iterable<V>, predicate: Predicate<V>) {
      assertAnyTrue(objects.iterator(), predicate)
    }

    @JvmStatic
    fun <V : Any> assertAnyTrue(objects: Iterator<V>, predicate: Predicate<V>) {
      assertTrue(objects.hasNext())

      var className: String? = null
      while (objects.hasNext()) {
        val next = objects.next()
        className = next.javaClass.simpleName
        if (predicate.test(next)) return
      }

      if (className == null) fail("Empty collection")
      fail("No $className matching predicate found.")
    }

    @JvmStatic
    fun <V> assertAllTrue(objects: Array<V>, predicate: Predicate<V>) {
      assertTrue(objects.all(predicate::test))
    }

    fun <T> first(iterable: Iterable<T>): T = iterable.iterator().next()

    @JvmStatic fun isValidId(id: URI?): Boolean = id != null && id.toString().contains("urn")
  }
}

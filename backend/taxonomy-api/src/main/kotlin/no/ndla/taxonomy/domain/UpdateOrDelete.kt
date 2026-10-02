/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2026 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import tools.jackson.core.JsonGenerator
import tools.jackson.core.JsonParser
import tools.jackson.databind.BeanProperty
import tools.jackson.databind.DatabindException
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.JavaType
import tools.jackson.databind.JsonNode
import tools.jackson.databind.SerializationContext
import tools.jackson.databind.ValueDeserializer
import tools.jackson.databind.ValueSerializer

sealed class UpdateOrDelete<out T> {
  data object Default : UpdateOrDelete<Nothing>()

  data class Update<T>(val value: T) : UpdateOrDelete<T>()

  data object Delete : UpdateOrDelete<Nothing>()

  class Serializer : ValueSerializer<UpdateOrDelete<*>>() {
    override fun isEmpty(ctxt: SerializationContext, value: UpdateOrDelete<*>) = value is Default

    override fun serialize(
        value: UpdateOrDelete<*>,
        gen: JsonGenerator,
        ctxt: SerializationContext,
    ) {
      when (value) {
        is Delete -> gen.writeNull()
        is Update<*> -> gen.writePOJO(value.value)
        is Default -> {}
      }
    }
  }

  class Deserializer(private val innerType: JavaType? = null) :
      ValueDeserializer<UpdateOrDelete<*>>() {
    override fun createContextual(
        ctxt: DeserializationContext,
        property: BeanProperty?,
    ): ValueDeserializer<*> =
        Deserializer(property?.type?.containedType(0) ?: ctxt.contextualType?.containedType(0))

    override fun getNullValue(ctxt: DeserializationContext?) = Delete

    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): UpdateOrDelete<*> {
      val node: JsonNode = ctxt.readTree(p)
      return when {
        node.isMissingNode -> Default
        node.isNull -> Delete
        else ->
            Update(
                ctxt.readTreeAsValue<Any>(
                    node,
                    innerType
                        ?: throw DatabindException.from(
                            ctxt,
                            "UpdateOrDelete deserializer used without createContextual",
                        ),
                ))
      }
    }
  }
}

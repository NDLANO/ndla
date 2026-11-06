/*
 * Part of NDLA common
 * Copyright (C) 2025 NDLA
 *
 * See LICENSE
 *
 */

package no.ndla.common

import no.ndla.common.implicits.toOption
import sttp.tapir.Schema.SName
import sttp.tapir.{FieldName, Schema, SchemaAnnotations, SchemaType, Validator}

import scala.reflect.ClassTag

object TapirUtil {
  def withDiscriminator[T](schema: Schema[T])(implicit ct: ClassTag[T]): Schema[T] = {
    val schemaType: SchemaType[T] = schema.schemaType match {
      case st: SchemaType.SProduct[T] => ct
          .runtimeClass
          .getSimpleName
          .toOption
          .fold(st) { simpleName =>
            val newField = SchemaType.SProductField[T, String](
              FieldName("typename"),
              stringLiteralSchema(simpleName),
              _ => throwNewError(schema),
            )
            st.copy(fields = st.fields :+ newField)
          }
      case x => x
    }
    schema.copy(schemaType = schemaType)
  }

  def stringLiteralSchema[T <: String](value: T)(implicit annotations: SchemaAnnotations[T]): Schema[T] = {
    annotations.enrich(
      Schema[T](SchemaType.SString()).validate(Validator.enumeration(List(value), v => Some(v), Some(SName(value))))
    )
  }

  def throwNewError[T](schema: Schema[T]): Nothing = {
    throw new RuntimeException(s"Attempted to get typename from a value of type $schema")
  }

}

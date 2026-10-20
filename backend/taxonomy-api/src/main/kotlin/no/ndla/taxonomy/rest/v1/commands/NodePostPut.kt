/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2021 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.rest.v1.commands

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonInclude
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import java.net.URI
import java.util.UUID
import no.ndla.taxonomy.config.Constants
import no.ndla.taxonomy.domain.JsonTranslation
import no.ndla.taxonomy.domain.Node
import no.ndla.taxonomy.domain.NodeType
import no.ndla.taxonomy.domain.ResourceType
import no.ndla.taxonomy.domain.UpdateOrDelete
import no.ndla.taxonomy.service.UpdatableDto
import no.ndla.taxonomy.service.dtos.QualityEvaluationDTO
import no.ndla.taxonomy.service.dtos.TechnicalEvaluationDTO
import no.ndla.taxonomy.service.dtos.TranslationDTO
import no.ndla.taxonomy.service.exceptions.InvalidArgumentServiceException

@Schema(name = "NodePostPut")
class NodePostPut : UpdatableDto<Node> {
  @field:Schema(
      description =
          "If specified, set the node_id to this value. If omitted, an uuid will be assigned automatically.")
  var nodeId: String? = null

  @field:Enumerated(EnumType.STRING)
  @field:Schema(description = "Type of node.", example = "topic")
  var nodeType: NodeType? = null

  @field:Schema(
      description =
          "ID of content introducing this node. Must be a valid URI, but preferably not a URL.",
      example = "urn:article:1",
  )
  var contentUri: URI? = null

  @field:Schema(description = "The name of the node. Required on create.", example = "Trigonometry")
  var name: String? = null

  @Deprecated("Use context")
  @field:Schema(description = "The node is a root node. Default is false. Only used if present.")
  var root: Boolean? = null

  @field:Schema(
      description = "The node is the root in a context. Default is false. Only used if present.")
  var context: Boolean? = null

  @field:Schema(description = "The node is visible. Default is true.") var visible: Boolean? = null

  @field:Schema(
      description =
          "ResourceType public ids to assign to the node. Only works for nodes of type RESOURCE")
  var resourceTypes: List<URI>? = null

  @field:Schema(
      description = "The language used at create time. Used to set default translation.",
      example = "nb",
  )
  var language: String? = Constants.DefaultLanguage

  @field:Schema(
      implementation = QualityEvaluationDTO::class,
      description =
          "The quality evaluation of the node. Consist of a score from 1 to 5 and a comment. Can be null to remove existing evaluation.",
      types = ["object", "null"],
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  @field:JsonInclude(JsonInclude.Include.NON_EMPTY)
  var qualityEvaluation: UpdateOrDelete<QualityEvaluationDTO> = UpdateOrDelete.Default

  @field:Schema(
      implementation = TechnicalEvaluationDTO::class,
      description =
          "The technical evaluation of the node. Contains a flag and an optional comment. Can be null to remove existing evaluation.",
      types = ["object", "null"],
      requiredMode = Schema.RequiredMode.NOT_REQUIRED,
  )
  @field:JsonInclude(JsonInclude.Include.NON_EMPTY)
  var technicalEvaluation: UpdateOrDelete<TechnicalEvaluationDTO> = UpdateOrDelete.Default

  @field:Schema(
      description =
          "The translations for the node. Contains an array of translations in different languages")
  var translations: List<TranslationDTO>? = null

  @get:JsonIgnore
  val publicId: URI
    get() = URI.create("urn:" + nodeType!!.typeName + ":" + nodeId!!)

  override fun apply(entity: Node) {
    if (entity.ident == null) {
      entity.ident = UUID.randomUUID().toString()
    }
    if (nodeId != null) {
      entity.publicId = publicId
    }
    nodeType?.let { entity.nodeType = it }

    when (val qualityEvaluation = this.qualityEvaluation) {
      is UpdateOrDelete.Delete -> {
        entity.setQualityEvaluation(null)
        entity.qualityEvaluationComment = null
      }
      is UpdateOrDelete.Update -> {
        val qe = qualityEvaluation.value
        entity.setQualityEvaluation(qe.grade)
        entity.qualityEvaluationComment = qe.note
      }
      else -> {}
    }

    when (val technicalEvaluation = this.technicalEvaluation) {
      is UpdateOrDelete.Delete -> {
        entity.requiresTechnicalEvaluation = null
        entity.technicalEvaluationComment = null
      }
      is UpdateOrDelete.Update -> {
        val te = technicalEvaluation.value
        entity.requiresTechnicalEvaluation = te.requiresEvaluation
        entity.technicalEvaluationComment = if (te.requiresEvaluation) te.comment else null
      }
      else -> {}
    }

    translations?.let { ts ->
      entity.translations = ts.mapTo(mutableListOf()) { JsonTranslation(it.name, it.language) }
    }

    if (entity.nodeType == NodeType.RESOURCE) {
      resourceTypes?.let { rts ->
        entity.clearResourceTypes()
        rts.forEach { rt ->
          val resourceType =
              ResourceType.findByPublicId(rt)
                  ?: throw InvalidArgumentServiceException("Unknown resource type:$rt")
          entity.addResourceType(resourceType)
        }
      }
    }

    @Suppress("DEPRECATION") root?.let { entity.isContext = it }
    context?.let { entity.isContext = it }
    name?.let { entity.name = it }
    contentUri?.let { entity.contentUri = it }
    visible?.let { entity.setVisible(it) }
    // Add translation only on post
    name?.let { name ->
      if (entity.id == null && translations == null) {
        entity.addTranslation(name, language ?: Constants.DefaultLanguage)
      }
    }
  }
}

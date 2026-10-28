/*
 * Part of NDLA taxonomy-api
 * Copyright (C) 2023 NDLA
 *
 * See LICENSE
 */

package no.ndla.taxonomy.domain

import no.ndla.taxonomy.config.Constants
import org.apache.commons.lang3.SerializationUtils

class LanguageField<V> : HashMap<String, V>() {

  fun fromLanguage(language: String): V? =
      if (containsKey(language)) this[language] else this[Constants.DefaultLanguage]

  companion object {
    @JvmStatic
    fun fromNode(node: DomainObject): LanguageField<String> {
      val languageField = LanguageField<String>()
      val defaultName = node.name ?: ""
      languageField[Constants.DefaultLanguage] = defaultName

      for (nt in node.translations) {
        val languageCode = nt.languageCode ?: continue
        val name = nt.name ?: continue
        languageField[languageCode] = name
      }

      return languageField
    }

    @JvmStatic
    fun fromRelevance(relevance: Relevance): LanguageField<String> {
      val languageField = LanguageField<String>()
      val defaultName = relevance.translations.firstOrNull { it.languageCode == "nb" }?.name ?: ""
      languageField[Constants.DefaultLanguage] = defaultName

      for (nt in relevance.translations) {
        val languageCode = nt.languageCode ?: continue
        val name = nt.name ?: continue
        languageField[languageCode] = name
      }

      return languageField
    }

    @JvmStatic
    fun listFromNode(node: DomainObject): LanguageField<MutableList<String>> {
      val breadcrumbs = LanguageField<MutableList<String>>()
      val langs = node.translations.mapNotNullTo(HashSet()) { it.languageCode }
      langs.add(Constants.DefaultLanguage)
      for (lang in langs) {
        val crumbs = ArrayList<String>()
        crumbs.add(node.getTranslatedName(lang) ?: "")
        breadcrumbs[lang] = crumbs
      }
      return breadcrumbs
    }

    /**
     * Returns accumulated set of language fields. All additional languages from languageField are
     * appended so all languageLists have the same number of elements. If a language variant is not
     * present, default value is used.
     */
    @JvmStatic
    fun listFromLists(
        listLanguageField: LanguageField<MutableList<String>>,
        languageField: LanguageField<String>,
    ): LanguageField<MutableList<String>> {
      val breadcrumbs = SerializationUtils.clone(listLanguageField)
      val languages = HashSet<String>()
      languages.addAll(listLanguageField.keys)
      languages.addAll(languageField.keys)
      val defaultValue = languageField[Constants.DefaultLanguage] ?: ""
      languages.forEach { lang ->
        val crumbs =
            breadcrumbs.computeIfAbsent(lang) {
              listLanguageField.getOrDefault(Constants.DefaultLanguage, ArrayList())
            }
        crumbs.add(languageField.getOrDefault(lang, defaultValue))
      }
      return breadcrumbs
    }
  }
}

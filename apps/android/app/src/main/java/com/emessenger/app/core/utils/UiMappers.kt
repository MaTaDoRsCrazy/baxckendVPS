package com.emessenger.app.core.utils

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val ruLocale = Locale("ru")
private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm", ruLocale)
private val dateFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy", ruLocale)
private val weekdayFormatter = DateTimeFormatter.ofPattern("EEE", ruLocale)

fun translateError(message: String?): String {
    return when (message?.trim()) {
        null, "" -> "Р§С‚Рѕ-С‚Рѕ РїРѕС€Р»Рѕ РЅРµ С‚Р°Рє"
        "Invalid email" -> "РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ email"
        "Password is required" -> "Р’РІРµРґРёС‚Рµ РїР°СЂРѕР»СЊ"
        "User not found" -> "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ"
        "Invalid credentials" -> "РќРµРІРµСЂРЅС‹Р№ Р»РѕРіРёРЅ РёР»Рё РїР°СЂРѕР»СЊ"
        "Network error" -> "РћС€РёР±РєР° СЃРµС‚Рё"
        "Access denied" -> "Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ"
        "Message body or attachment is required" -> "РЎРѕРѕР±С‰РµРЅРёРµ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ РїСѓСЃС‚С‹Рј"
        "Call failed" -> "РќРµ СѓРґР°Р»РѕСЃСЊ РЅР°С‡Р°С‚СЊ Р·РІРѕРЅРѕРє"
        "Unsupported file type" -> "Р­С‚РѕС‚ С‚РёРї С„Р°Р№Р»Р° РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ"
        "File is required" -> "Р’С‹Р±РµСЂРёС‚Рµ С„Р°Р№Р»"
        "File exceeds 15MB limit" -> "Р¤Р°Р№Р» РїСЂРµРІС‹С€Р°РµС‚ Р»РёРјРёС‚ 15 РњР‘"
        "User with provided username or email already exists" -> "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃ С‚Р°РєРёРј РёРјРµРЅРµРј РёР»Рё email СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚"
        "User is not a conversation member" -> "РЈ РІР°СЃ РЅРµС‚ РґРѕСЃС‚СѓРїР° Рє СЌС‚РѕРјСѓ С‡Р°С‚Сѓ"
        "User is not a call participant", "User is not allowed to join this call" -> "РЈ РІР°СЃ РЅРµС‚ РґРѕСЃС‚СѓРїР° Рє СЌС‚РѕРјСѓ Р·РІРѕРЅРєСѓ"
        "Call not found" -> "Р—РІРѕРЅРѕРє РЅРµ РЅР°Р№РґРµРЅ"
        else -> message
    }
}

fun formatMessageTime(value: String?): String {
    return runCatching {
        value
            ?.takeUnless { it.isBlank() }
            ?.let { Instant.parse(it).atZone(ZoneId.systemDefault()).format(timeFormatter) }
            .orEmpty()
    }.getOrDefault("")
}

fun formatDayDivider(value: String?): String {
    return runCatching {
        val rawValue = value?.takeUnless { it.isBlank() } ?: return@runCatching ""
        val date = Instant.parse(rawValue).atZone(ZoneId.systemDefault()).toLocalDate()
        val today = java.time.LocalDate.now()
        when {
            date == today -> "РЎРµРіРѕРґРЅСЏ"
            date == today.minusDays(1) -> "Р’С‡РµСЂР°"
            date.year == today.year -> date.format(weekdayFormatter).replaceFirstChar { it.titlecase(ruLocale) }
            else -> date.format(dateFormatter)
        }
    }.getOrDefault("")
}

fun formatPresence(active: Boolean): String = if (active) "Р’ СЃРµС‚Рё" else "Р‘С‹Р»(Р°) РЅРµРґР°РІРЅРѕ"

fun formatCallType(type: String): String = if (type.uppercase() == "VIDEO") "Р’РёРґРµРѕР·РІРѕРЅРѕРє" else "РђСѓРґРёРѕР·РІРѕРЅРѕРє"

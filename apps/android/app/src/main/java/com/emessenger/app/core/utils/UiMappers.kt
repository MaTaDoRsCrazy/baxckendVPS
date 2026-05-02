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
        null, "" -> "Что-то пошло не так"
        "Invalid email" -> "Некорректный email"
        "Password is required" -> "Введите пароль"
        "User not found" -> "Пользователь не найден"
        "Invalid credentials" -> "Неверный логин или пароль"
        "Network error" -> "Ошибка сети"
        "Access denied" -> "Доступ запрещён"
        "Message body or attachment is required" -> "Сообщение не может быть пустым"
        "Call failed" -> "Не удалось начать звонок"
        "Unsupported file type" -> "Этот тип файла не поддерживается"
        "File is required" -> "Выберите файл"
        "File exceeds 15MB limit" -> "Файл превышает лимит 15 МБ"
        "User with provided username or email already exists" -> "Пользователь с таким именем или email уже существует"
        "User is not a conversation member" -> "У вас нет доступа к этому чату"
        "User is not a call participant", "User is not allowed to join this call" -> "У вас нет доступа к этому звонку"
        "Call not found" -> "Звонок не найден"
        else -> message
    }
}

fun formatMessageTime(value: String): String {
    return runCatching {
        Instant.parse(value).atZone(ZoneId.systemDefault()).format(timeFormatter)
    }.getOrDefault("—")
}

fun formatDayDivider(value: String): String {
    return runCatching {
        val date = Instant.parse(value).atZone(ZoneId.systemDefault()).toLocalDate()
        val today = java.time.LocalDate.now()
        when {
            date == today -> "Сегодня"
            date == today.minusDays(1) -> "Вчера"
            date.year == today.year -> date.format(weekdayFormatter).replaceFirstChar { it.titlecase(ruLocale) }
            else -> date.format(dateFormatter)
        }
    }.getOrDefault("Сегодня")
}

fun formatPresence(active: Boolean): String = if (active) "В сети" else "Был(а) недавно"

fun formatCallType(type: String): String = if (type.uppercase() == "VIDEO") "Видеозвонок" else "Аудиозвонок"

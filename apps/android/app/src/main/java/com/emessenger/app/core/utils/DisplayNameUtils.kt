package com.emessenger.app.core.utils

import com.emessenger.app.domain.model.ConversationModel
import com.emessenger.app.domain.model.ConversationMemberModel
import com.emessenger.app.domain.model.MessageModel
import com.emessenger.app.domain.model.UserModel

fun getDisplayName(
    fullName: String? = null,
    displayName: String? = null,
    username: String? = null,
    email: String? = null,
    phone: String? = null
): String {
    return listOf(fullName, displayName, username, email, phone)
        .mapNotNull { value ->
            value
                ?.trim()
                ?.takeIf { it.isNotEmpty() && it.lowercase() != "null" && it.lowercase() != "undefined" }
        }
        .firstOrNull() ?: "Пользователь"
}

fun UserModel.displayNameOrFallback(): String =
    getDisplayName(fullName = fullName, displayName = displayName, username = username, email = email, phone = phone)

fun ConversationMemberModel.displayNameOrFallback(): String =
    getDisplayName(displayName = displayName, username = username)

fun MessageModel.resolvedSenderLabel(member: ConversationMemberModel? = null): String =
    getDisplayName(
        fullName = sender?.fullName,
        displayName = sender?.displayName?.takeUnless { it.isBlank() } ?: senderLabel,
        username = sender?.username ?: member?.username,
        email = sender?.email,
        phone = sender?.phone
    )

fun MessageModel.withResolvedSenderLabel(member: ConversationMemberModel? = null): MessageModel =
    copy(senderLabel = resolvedSenderLabel(member))

fun ConversationModel.displayTitle(currentUserId: String? = null): String {
    if (!title.isNullOrBlank()) {
        return title
    }

    val membersTitle = members
        .filter { it.userId != currentUserId }
        .map { member -> getDisplayName(displayName = member.displayName, username = member.username) }
        .filter { it.isNotBlank() }
        .joinToString(", ")

    return membersTitle.ifBlank { "Чат" }
}

fun avatarFallback(title: String?): String {
    val tokens = title
        ?.trim()
        ?.split(Regex("\\s+"))
        ?.filter { it.isNotBlank() }
        .orEmpty()
    val initials = tokens.take(2).joinToString("") { token ->
        token.firstOrNull()?.uppercase() ?: ""
    }
    return initials.ifBlank { "PL" }
}

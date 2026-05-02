package com.emessenger.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.emessenger.app.domain.model.MessageModel

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey val id: String,
    val conversationId: String,
    val senderId: String,
    val body: String?,
    val type: String,
    val attachmentUrl: String?,
    val attachmentName: String?,
    val attachmentMimeType: String?,
    val attachmentSize: Int?,
    val createdAt: String,
    val isEdited: Boolean,
    val isDeleted: Boolean
) {
    fun toDomain() = MessageModel(
        id = id,
        conversationId = conversationId,
        senderId = senderId,
        body = body,
        type = type,
        attachmentUrl = attachmentUrl,
        attachmentName = attachmentName,
        attachmentMimeType = attachmentMimeType,
        attachmentSize = attachmentSize,
        createdAt = createdAt,
        isEdited = isEdited,
        isDeleted = isDeleted
    )
}

fun MessageModel.toEntity() = MessageEntity(
    id = id,
    conversationId = conversationId,
    senderId = senderId,
    body = body,
    type = type,
    attachmentUrl = attachmentUrl,
    attachmentName = attachmentName,
    attachmentMimeType = attachmentMimeType,
    attachmentSize = attachmentSize,
    createdAt = createdAt,
    isEdited = isEdited,
    isDeleted = isDeleted
)

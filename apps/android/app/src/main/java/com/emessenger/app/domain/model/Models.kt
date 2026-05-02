package com.emessenger.app.domain.model

data class UserModel(
    val id: String,
    val username: String,
    val fullName: String?,
    val displayName: String,
    val email: String?,
    val phone: String?,
    val about: String?,
    val avatarUrl: String?,
    val country: String?,
    val role: String,
    val status: String
)

data class ConversationMemberModel(
    val id: String,
    val userId: String,
    val role: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?
)

data class MessageStatusModel(
    val userId: String,
    val status: String,
    val createdAt: String
)

data class MessageModel(
    val id: String,
    val localId: String? = null,
    val clientTempId: String? = null,
    val conversationId: String,
    val senderId: String,
    val body: String?,
    val type: String,
    val attachmentUrl: String? = null,
    val attachmentName: String? = null,
    val attachmentMimeType: String? = null,
    val attachmentSize: Int? = null,
    val createdAt: String,
    val isEdited: Boolean = false,
    val isDeleted: Boolean = false,
    val deliveryState: String = "SENT",
    val statuses: List<MessageStatusModel> = emptyList(),
    val sender: UserModel? = null,
    val senderLabel: String = "Пользователь"
)

data class ConversationModel(
    val id: String,
    val type: String,
    val title: String?,
    val avatarUrl: String? = null,
    val members: List<ConversationMemberModel> = emptyList(),
    val messages: List<MessageModel> = emptyList()
)

data class MessagePageModel(
    val items: List<MessageModel> = emptyList(),
    val nextCursor: String? = null,
    val hasMore: Boolean = false
)

data class CallParticipantModel(
    val id: String,
    val userId: String,
    val status: String,
    val user: UserModel? = null
)

data class CallModel(
    val id: String,
    val conversationId: String,
    val createdById: String,
    val type: String,
    val status: String,
    val livekitRoomName: String,
    val participants: List<CallParticipantModel> = emptyList(),
    val createdBy: UserModel? = null
)

data class AuthTokensModel(
    val accessToken: String,
    val refreshToken: String
)

data class AuthSessionModel(
    val accessToken: String,
    val refreshToken: String,
    val user: UserModel
)

data class LiveKitTokenModel(
    val url: String,
    val token: String,
    val roomName: String
)

data class UploadModel(
    val url: String,
    val mimeType: String,
    val size: Int,
    val originalName: String
)

package com.emessenger.app.domain.model

data class UserModel(
    val id: String,
    val username: String,
    val email: String?,
    val phone: String?,
    val avatarUrl: String?,
    val role: String,
    val status: String
)

data class ConversationMemberModel(
    val id: String,
    val userId: String,
    val role: String,
    val username: String
)

data class MessageStatusModel(
    val userId: String,
    val status: String,
    val createdAt: String
)

data class MessageModel(
    val id: String,
    val conversationId: String,
    val senderId: String,
    val body: String?,
    val type: String,
    val createdAt: String,
    val isEdited: Boolean = false,
    val isDeleted: Boolean = false,
    val statuses: List<MessageStatusModel> = emptyList()
)

data class ConversationModel(
    val id: String,
    val type: String,
    val title: String?,
    val members: List<ConversationMemberModel> = emptyList(),
    val messages: List<MessageModel> = emptyList()
)

data class CallParticipantModel(
    val id: String,
    val userId: String,
    val status: String
)

data class CallModel(
    val id: String,
    val conversationId: String,
    val type: String,
    val status: String,
    val livekitRoomName: String,
    val participants: List<CallParticipantModel> = emptyList()
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

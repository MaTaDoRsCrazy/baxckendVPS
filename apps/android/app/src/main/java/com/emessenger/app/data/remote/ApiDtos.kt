package com.emessenger.app.data.remote

import com.emessenger.app.domain.model.AuthSessionModel
import com.emessenger.app.domain.model.CallModel
import com.emessenger.app.domain.model.ConversationModel
import com.emessenger.app.domain.model.LiveKitTokenModel
import com.emessenger.app.domain.model.MessageModel
import com.emessenger.app.domain.model.UploadModel
import com.emessenger.app.domain.model.UserModel

data class ApiEnvelope<T>(
    val data: T
)

data class ApiErrorDto(
    val error: ApiErrorBody
)

data class ApiErrorBody(
    val code: String,
    val message: String
)

data class LoginRequest(
    val identifier: String,
    val password: String
)

data class RegisterRequest(
    val username: String,
    val email: String?,
    val phone: String?,
    val password: String,
    val country: String?
)

data class RefreshRequest(
    val refreshToken: String
)

data class CreateMessageRequest(
    val conversationId: String,
    val type: String = "TEXT",
    val body: String? = null,
    val attachmentUrl: String? = null,
    val attachmentName: String? = null,
    val attachmentMimeType: String? = null,
    val attachmentSize: Int? = null
)

data class StartCallRequest(
    val conversationId: String,
    val type: String
)

typealias AuthEnvelope = ApiEnvelope<AuthSessionModel>
typealias UserEnvelope = ApiEnvelope<UserModel>
typealias ConversationsEnvelope = ApiEnvelope<List<ConversationModel>>
typealias ConversationEnvelope = ApiEnvelope<ConversationModel>
typealias MessagesEnvelope = ApiEnvelope<List<MessageModel>>
typealias CallEnvelope = ApiEnvelope<CallModel>
typealias CallsEnvelope = ApiEnvelope<List<CallModel>>
typealias LiveKitTokenEnvelope = LiveKitTokenModel
typealias UploadEnvelope = ApiEnvelope<UploadModel>

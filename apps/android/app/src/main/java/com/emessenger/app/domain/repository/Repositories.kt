package com.emessenger.app.domain.repository

import android.net.Uri
import com.emessenger.app.domain.model.AuthSessionModel
import com.emessenger.app.domain.model.CallModel
import com.emessenger.app.domain.model.ConversationModel
import com.emessenger.app.domain.model.LiveKitTokenModel
import com.emessenger.app.domain.model.MessageModel
import com.emessenger.app.domain.model.UserModel
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    val session: Flow<AuthSessionModel?>
    suspend fun login(identifier: String, password: String): AuthSessionModel
    suspend fun register(username: String, email: String?, phone: String?, password: String, country: String?): AuthSessionModel
    suspend fun updateProfile(
        fullName: String?,
        username: String,
        email: String?,
        phone: String?,
        about: String?,
        country: String?
    ): AuthSessionModel?
    suspend fun uploadAvatar(uri: Uri): AuthSessionModel?
    suspend fun logout()
}

interface ChatRepository {
    suspend fun getChats(): List<ConversationModel>
    suspend fun getChat(chatId: String): ConversationModel
    fun observeMessages(chatId: String): Flow<List<MessageModel>>
    suspend fun refreshMessages(chatId: String, since: String? = null)
    suspend fun latestMessageCreatedAt(chatId: String): String?
    suspend fun upsertIncomingMessage(message: MessageModel)
    suspend fun sendMessage(chatId: String, body: String)
    suspend fun sendAttachment(chatId: String, uri: Uri, body: String? = null): MessageModel
    suspend fun sendVoice(chatId: String, uri: Uri, body: String? = null): MessageModel
    suspend fun createPrivateChat(participantId: String): ConversationModel
    suspend fun createGroupChat(title: String, memberIds: List<String>): ConversationModel
    suspend fun searchUsers(query: String): List<UserModel>
}

interface CallRepository {
    suspend fun getHistory(): List<CallModel>
    suspend fun startCall(conversationId: String, type: String): CallModel
    suspend fun acceptCall(callId: String): CallModel
    suspend fun rejectCall(callId: String): CallModel
    suspend fun endCall(callId: String): CallModel
    suspend fun getToken(callId: String): LiveKitTokenModel
}

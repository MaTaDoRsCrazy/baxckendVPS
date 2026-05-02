package com.emessenger.app.data.repository

import android.content.Context
import android.net.Uri
import com.emessenger.app.core.network.MessengerApi
import com.emessenger.app.data.local.MessageDao
import com.emessenger.app.data.local.toEntity
import com.emessenger.app.data.remote.CreateMessageRequest
import com.emessenger.app.data.remote.createUploadPayload
import com.emessenger.app.domain.model.ConversationModel
import com.emessenger.app.domain.model.MessageModel
import com.emessenger.app.domain.model.UserModel
import com.emessenger.app.domain.repository.ChatRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class ChatRepositoryImpl @Inject constructor(
    private val api: MessengerApi,
    private val messageDao: MessageDao,
    @ApplicationContext private val context: Context
) : ChatRepository {
    override suspend fun getChats(): List<ConversationModel> = api.chats().data

    override suspend fun getChat(chatId: String): ConversationModel = api.chat(chatId).data

    override fun observeMessages(chatId: String): Flow<List<MessageModel>> =
        messageDao.observeMessages(chatId).map { items -> items.map { it.toDomain() } }

    override suspend fun refreshMessages(chatId: String) {
        val messages = api.messages(chatId).data
        messageDao.upsertAll(messages.map { it.toEntity() })
    }

    override suspend fun sendMessage(chatId: String, body: String) {
        api.sendMessage(CreateMessageRequest(chatId, body = body))
        refreshMessages(chatId)
    }

    override suspend fun sendAttachment(chatId: String, uri: Uri, body: String?): MessageModel {
        val upload = context.contentResolver.createUploadPayload(uri)
        val uploaded = api.uploadFile(upload.part).data
        val type = if (uploaded.mimeType.startsWith("image/")) "IMAGE" else "FILE"
        val message = api.sendMessage(
            CreateMessageRequest(
                conversationId = chatId,
                type = type,
                body = body,
                attachmentUrl = uploaded.url,
                attachmentName = uploaded.originalName,
                attachmentMimeType = uploaded.mimeType,
                attachmentSize = uploaded.size
            )
        ).data
        refreshMessages(chatId)
        return message
    }

    override suspend fun sendVoice(chatId: String, uri: Uri, body: String?): MessageModel {
        val upload = context.contentResolver.createUploadPayload(uri)
        val uploaded = api.uploadFile(upload.part).data
        val message = api.sendMessage(
            CreateMessageRequest(
                conversationId = chatId,
                type = "VOICE",
                body = body,
                attachmentUrl = uploaded.url,
                attachmentName = uploaded.originalName,
                attachmentMimeType = uploaded.mimeType,
                attachmentSize = uploaded.size
            )
        ).data
        refreshMessages(chatId)
        return message
    }

    override suspend fun createPrivateChat(participantId: String): ConversationModel =
        api.createPrivate(mapOf("participantId" to participantId)).data

    override suspend fun createGroupChat(title: String, memberIds: List<String>): ConversationModel =
        api.createGroup(mapOf("title" to title, "memberIds" to memberIds)).data

    override suspend fun searchUsers(query: String): List<UserModel> = api.searchUsers(query).data
}

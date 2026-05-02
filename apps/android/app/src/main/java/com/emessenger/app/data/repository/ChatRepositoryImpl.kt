package com.emessenger.app.data.repository

import android.content.Context
import android.net.Uri
import com.emessenger.app.core.datastore.SessionStore
import com.emessenger.app.core.network.MessengerApi
import com.emessenger.app.core.utils.withResolvedSenderLabel
import com.emessenger.app.data.local.MessageDao
import com.emessenger.app.data.local.toEntity
import com.emessenger.app.data.remote.CreateMessageRequest
import com.emessenger.app.data.remote.createUploadPayload
import com.emessenger.app.domain.model.ConversationModel
import com.emessenger.app.domain.model.MessageModel
import com.emessenger.app.domain.model.MessageStatusModel
import com.emessenger.app.domain.model.UserModel
import com.emessenger.app.domain.repository.ChatRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

@Singleton
class ChatRepositoryImpl @Inject constructor(
    private val api: MessengerApi,
    private val messageDao: MessageDao,
    private val sessionStore: SessionStore,
    @ApplicationContext private val context: Context
) : ChatRepository {
    override suspend fun getChats(): List<ConversationModel> = api.chats().data

    override suspend fun getChat(chatId: String): ConversationModel = api.chat(chatId).data

    override fun observeMessages(chatId: String): Flow<List<MessageModel>> =
        messageDao.observeMessages(chatId).map { items -> items.map { it.toDomain() } }

    override suspend fun refreshMessages(chatId: String, since: String?) {
        val messages = api.messages(chatId = chatId, limit = if (since == null) 50 else 100, since = since).data.items
            .map { it.withResolvedSenderLabel() }
            .map { it.copy(deliveryState = "SENT") }
        messageDao.upsertAll(messages.map { it.toEntity() })
    }

    override suspend fun latestMessageCreatedAt(chatId: String): String? = messageDao.latestCreatedAt(chatId)

    override suspend fun upsertIncomingMessage(message: MessageModel) {
        val normalized = message.withResolvedSenderLabel().copy(deliveryState = "SENT")
        normalized.clientTempId?.let { messageDao.deleteByClientTempId(it) }
        messageDao.upsert(normalized.toEntity())
    }

    override suspend fun sendMessage(chatId: String, body: String) {
        val session = sessionStore.session.first()
        val clientTempId = UUID.randomUUID().toString()
        val pending = buildPendingMessage(
            sessionUser = session?.user,
            chatId = chatId,
            clientTempId = clientTempId,
            type = "TEXT",
            body = body
        )

        messageDao.upsert(pending.toEntity())

        try {
            val message = api.sendMessage(
                CreateMessageRequest(
                    conversationId = chatId,
                    clientTempId = clientTempId,
                    body = body,
                    type = "TEXT"
                )
            ).data.withResolvedSenderLabel()

            messageDao.deleteByClientTempId(clientTempId)
            messageDao.upsert(
                message.copy(
                    localId = clientTempId,
                    clientTempId = message.clientTempId ?: clientTempId,
                    deliveryState = "SENT"
                ).toEntity()
            )
        } catch (error: Throwable) {
            messageDao.upsert(pending.copy(deliveryState = "FAILED").toEntity())
            throw error
        }
    }

    override suspend fun sendAttachment(chatId: String, uri: Uri, body: String?): MessageModel {
        val session = sessionStore.session.first()
        val upload = context.contentResolver.createUploadPayload(uri)
        val clientTempId = UUID.randomUUID().toString()
        val pendingType = if (upload.mimeType.startsWith("image/")) "IMAGE" else "FILE"
        val pending = buildPendingMessage(
            sessionUser = session?.user,
            chatId = chatId,
            clientTempId = clientTempId,
            type = pendingType,
            body = body,
            attachmentName = upload.originalName,
            attachmentMimeType = upload.mimeType,
            attachmentSize = upload.size
        )

        messageDao.upsert(pending.toEntity())

        return try {
            val uploaded = api.uploadFile(upload.part).data
            val type = if (uploaded.mimeType.startsWith("image/")) "IMAGE" else "FILE"
            val message = api.sendMessage(
                CreateMessageRequest(
                    conversationId = chatId,
                    clientTempId = clientTempId,
                    type = type,
                    body = body,
                    attachmentUrl = uploaded.url,
                    attachmentName = uploaded.originalName,
                    attachmentMimeType = uploaded.mimeType,
                    attachmentSize = uploaded.size
                )
            ).data.withResolvedSenderLabel()

            messageDao.deleteByClientTempId(clientTempId)
            val saved = message.copy(
                localId = clientTempId,
                clientTempId = message.clientTempId ?: clientTempId,
                deliveryState = "SENT"
            )
            messageDao.upsert(saved.toEntity())
            saved
        } catch (error: Throwable) {
            messageDao.upsert(pending.copy(deliveryState = "FAILED").toEntity())
            throw error
        }
    }

    override suspend fun sendVoice(chatId: String, uri: Uri, body: String?): MessageModel {
        val session = sessionStore.session.first()
        val upload = context.contentResolver.createUploadPayload(uri)
        val clientTempId = UUID.randomUUID().toString()
        val pending = buildPendingMessage(
            sessionUser = session?.user,
            chatId = chatId,
            clientTempId = clientTempId,
            type = "VOICE",
            body = body,
            attachmentName = upload.originalName,
            attachmentMimeType = upload.mimeType,
            attachmentSize = upload.size
        )

        messageDao.upsert(pending.toEntity())

        return try {
            val uploaded = api.uploadFile(upload.part).data
            val message = api.sendMessage(
                CreateMessageRequest(
                    conversationId = chatId,
                    clientTempId = clientTempId,
                    type = "VOICE",
                    body = body,
                    attachmentUrl = uploaded.url,
                    attachmentName = uploaded.originalName,
                    attachmentMimeType = uploaded.mimeType,
                    attachmentSize = uploaded.size
                )
            ).data.withResolvedSenderLabel()

            messageDao.deleteByClientTempId(clientTempId)
            val saved = message.copy(
                localId = clientTempId,
                clientTempId = message.clientTempId ?: clientTempId,
                deliveryState = "SENT"
            )
            messageDao.upsert(saved.toEntity())
            saved
        } catch (error: Throwable) {
            messageDao.upsert(pending.copy(deliveryState = "FAILED").toEntity())
            throw error
        }
    }

    override suspend fun createPrivateChat(participantId: String): ConversationModel =
        api.createPrivate(mapOf("participantId" to participantId)).data

    override suspend fun createGroupChat(title: String, memberIds: List<String>): ConversationModel =
        api.createGroup(mapOf("title" to title, "memberIds" to memberIds)).data

    override suspend fun searchUsers(query: String): List<UserModel> = api.searchUsers(query).data

    private fun buildPendingMessage(
        sessionUser: UserModel?,
        chatId: String,
        clientTempId: String,
        type: String,
        body: String?,
        attachmentName: String? = null,
        attachmentMimeType: String? = null,
        attachmentSize: Int? = null
    ): MessageModel {
        val now = Instant.now().toString()
        val senderLabel = sessionUser?.displayName
            ?: sessionUser?.fullName
            ?: sessionUser?.username
            ?: sessionUser?.email
            ?: sessionUser?.phone
            ?: "Пользователь"

        return MessageModel(
            id = clientTempId,
            localId = clientTempId,
            clientTempId = clientTempId,
            conversationId = chatId,
            senderId = sessionUser?.id ?: "me",
            body = body?.trim().orEmpty(),
            type = type,
            attachmentUrl = null,
            attachmentName = attachmentName,
            attachmentMimeType = attachmentMimeType,
            attachmentSize = attachmentSize,
            createdAt = now,
            statuses = sessionUser?.id
                ?.let { listOf(MessageStatusModel(userId = it, status = "READ", createdAt = now)) }
                .orEmpty(),
            sender = sessionUser,
            senderLabel = senderLabel,
            deliveryState = "PENDING"
        )
    }
}

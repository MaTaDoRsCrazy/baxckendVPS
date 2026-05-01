package com.emessenger.app.data.repository

import com.emessenger.app.core.network.MessengerApi
import com.emessenger.app.data.local.MessageDao
import com.emessenger.app.data.local.toEntity
import com.emessenger.app.domain.model.ConversationModel
import com.emessenger.app.domain.model.MessageModel
import com.emessenger.app.domain.model.UserModel
import com.emessenger.app.domain.repository.ChatRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class ChatRepositoryImpl @Inject constructor(
    private val api: MessengerApi,
    private val messageDao: MessageDao
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
        api.sendMessage(com.emessenger.app.data.remote.CreateMessageRequest(chatId, body = body))
        refreshMessages(chatId)
    }

    override suspend fun createPrivateChat(participantId: String): ConversationModel =
        api.createPrivate(mapOf("participantId" to participantId)).data

    override suspend fun createGroupChat(title: String, memberIds: List<String>): ConversationModel =
        api.createGroup(mapOf("title" to title, "memberIds" to memberIds)).data

    override suspend fun searchUsers(query: String): List<UserModel> = api.searchUsers(query).data
}

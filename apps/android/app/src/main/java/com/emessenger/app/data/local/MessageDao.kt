package com.emessenger.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY createdAt ASC")
    fun observeMessages(conversationId: String): Flow<List<MessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(messages: List<MessageEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(message: MessageEntity)

    @Query("DELETE FROM messages WHERE clientTempId = :clientTempId")
    suspend fun deleteByClientTempId(clientTempId: String)

    @Query("SELECT createdAt FROM messages WHERE conversationId = :conversationId ORDER BY createdAt DESC LIMIT 1")
    suspend fun latestCreatedAt(conversationId: String): String?
}

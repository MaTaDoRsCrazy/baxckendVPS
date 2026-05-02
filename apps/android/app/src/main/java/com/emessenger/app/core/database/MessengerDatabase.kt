package com.emessenger.app.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.emessenger.app.data.local.MessageDao
import com.emessenger.app.data.local.MessageEntity

@Database(entities = [MessageEntity::class], version = 2, exportSchema = false)
abstract class MessengerDatabase : RoomDatabase() {
    abstract fun messageDao(): MessageDao
}

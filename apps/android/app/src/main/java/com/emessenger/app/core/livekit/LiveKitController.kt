package com.emessenger.app.core.livekit

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import io.livekit.android.ConnectOptions
import io.livekit.android.LiveKit
import io.livekit.android.room.Room
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LiveKitController @Inject constructor(
    @ApplicationContext
    private val appContext: Context
) {
    private var room: Room? = null

    suspend fun connect(url: String, token: String, audio: Boolean = true, video: Boolean = false): Room {
        room = LiveKit.create(appContext).also { currentRoom ->
            currentRoom.connect(
                url = url,
                token = token,
                options = ConnectOptions(audio = audio, video = video)
            )
        }
        return room ?: error("Не удалось инициализировать LiveKit")
    }

    fun disconnect() {
        room?.disconnect()
        room = null
    }
}

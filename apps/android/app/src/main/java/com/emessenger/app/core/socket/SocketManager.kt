package com.emessenger.app.core.socket

import com.emessenger.app.BuildConfig
import io.socket.client.IO
import io.socket.client.Socket
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SocketManager @Inject constructor() {
    private var socket: Socket? = null

    fun connect(token: String) {
        val options = IO.Options.builder()
            .setTransports(arrayOf("websocket"))
            .setPath("/socket.io")
            .setAuth(mapOf("token" to token))
            .build()

        socket = IO.socket(BuildConfig.SOCKET_URL, options).apply { connect() }
    }

    fun emit(event: String, payload: Any) {
        socket?.emit(event, payload)
    }

    fun on(event: String, listener: (Array<Any>) -> Unit) {
        socket?.on(event, listener)
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}

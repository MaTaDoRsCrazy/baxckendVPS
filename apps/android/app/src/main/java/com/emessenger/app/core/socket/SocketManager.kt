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
            .setReconnection(true)
            .setReconnectionAttempts(Int.MAX_VALUE)
            .setReconnectionDelay(1_000)
            .setReconnectionDelayMax(5_000)
            .setTimeout(10_000)
            .build()

        socket?.disconnect()
        socket = IO.socket(BuildConfig.SOCKET_URL, options).apply { connect() }
    }

    fun emit(event: String, payload: Any) {
        socket?.emit(event, payload)
    }

    fun on(event: String, listener: (Array<Any>) -> Unit) {
        socket?.on(event, listener)
    }

    fun off(event: String) {
        socket?.off(event)
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}

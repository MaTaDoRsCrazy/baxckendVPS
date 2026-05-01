package com.emessenger.app.data.repository

import com.emessenger.app.core.network.MessengerApi
import com.emessenger.app.domain.model.CallModel
import com.emessenger.app.domain.model.LiveKitTokenModel
import com.emessenger.app.domain.repository.CallRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CallRepositoryImpl @Inject constructor(
    private val api: MessengerApi
) : CallRepository {
    override suspend fun getHistory(): List<CallModel> = api.callHistory().data

    override suspend fun startCall(conversationId: String, type: String): CallModel =
        api.startCall(com.emessenger.app.data.remote.StartCallRequest(conversationId, type)).data

    override suspend fun acceptCall(callId: String): CallModel = api.acceptCall(callId).data

    override suspend fun rejectCall(callId: String): CallModel = api.rejectCall(callId).data

    override suspend fun endCall(callId: String): CallModel = api.endCall(callId).data

    override suspend fun getToken(callId: String): LiveKitTokenModel = api.getCallToken(callId)
}

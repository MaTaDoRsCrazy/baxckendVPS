package com.emessenger.app.core.network

import com.emessenger.app.data.remote.ApiEnvelope
import com.emessenger.app.data.remote.AuthEnvelope
import com.emessenger.app.data.remote.CallEnvelope
import com.emessenger.app.data.remote.CallsEnvelope
import com.emessenger.app.data.remote.ConversationEnvelope
import com.emessenger.app.data.remote.ConversationsEnvelope
import com.emessenger.app.data.remote.CreateMessageRequest
import com.emessenger.app.data.remote.LiveKitTokenEnvelope
import com.emessenger.app.data.remote.LoginRequest
import com.emessenger.app.data.remote.MessagesEnvelope
import com.emessenger.app.data.remote.RefreshRequest
import com.emessenger.app.data.remote.RegisterRequest
import com.emessenger.app.data.remote.StartCallRequest
import com.emessenger.app.data.remote.UploadEnvelope
import com.emessenger.app.data.remote.UserEnvelope
import okhttp3.MultipartBody
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.PATCH
import retrofit2.http.Part
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface MessengerApi {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): AuthEnvelope

    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): AuthEnvelope

    @POST("api/auth/refresh")
    suspend fun refresh(@Body request: RefreshRequest): AuthEnvelope

    @GET("api/auth/me")
    suspend fun me(): UserEnvelope

    @GET("api/chats")
    suspend fun chats(): ConversationsEnvelope

    @GET("api/chats/{chatId}")
    suspend fun chat(@Path("chatId") chatId: String): ConversationEnvelope

    @GET("api/chats/{chatId}/messages")
    suspend fun messages(
        @Path("chatId") chatId: String,
        @Query("limit") limit: Int? = null,
        @Query("cursor") cursor: String? = null,
        @Query("since") since: String? = null
    ): MessagesEnvelope

    @GET("api/users/search")
    suspend fun searchUsers(@Query("q") query: String): ApiEnvelope<List<com.emessenger.app.domain.model.UserModel>>

    @PATCH("api/users/me")
    suspend fun updateMe(@Body input: Map<String, @JvmSuppressWildcards Any?>): UserEnvelope

    @Multipart
    @POST("api/users/me/avatar")
    suspend fun uploadAvatar(@Part file: MultipartBody.Part): UserEnvelope

    @Multipart
    @POST("api/uploads")
    suspend fun uploadFile(@Part file: MultipartBody.Part): UploadEnvelope

    @POST("api/messages")
    suspend fun sendMessage(@Body request: CreateMessageRequest): ApiEnvelope<com.emessenger.app.domain.model.MessageModel>

    @POST("api/messages/{messageId}/read")
    suspend fun readMessage(@Path("messageId") messageId: String): ApiEnvelope<com.emessenger.app.domain.model.MessageModel>

    @POST("api/chats/private")
    suspend fun createPrivate(@Body input: Map<String, String>): ConversationEnvelope

    @POST("api/chats/group")
    suspend fun createGroup(@Body input: Map<String, @JvmSuppressWildcards Any>): ConversationEnvelope

    @POST("api/calls/start")
    suspend fun startCall(@Body request: StartCallRequest): CallEnvelope

    @POST("api/calls/{callId}/accept")
    suspend fun acceptCall(@Path("callId") callId: String): CallEnvelope

    @POST("api/calls/{callId}/reject")
    suspend fun rejectCall(@Path("callId") callId: String): CallEnvelope

    @POST("api/calls/{callId}/end")
    suspend fun endCall(@Path("callId") callId: String): CallEnvelope

    @POST("api/calls/{callId}/token")
    suspend fun getCallToken(@Path("callId") callId: String): LiveKitTokenEnvelope

    @GET("api/calls/history")
    suspend fun callHistory(): CallsEnvelope
}

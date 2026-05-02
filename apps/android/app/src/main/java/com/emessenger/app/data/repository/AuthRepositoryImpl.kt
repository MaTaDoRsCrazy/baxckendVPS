package com.emessenger.app.data.repository

import android.content.Context
import android.net.Uri
import com.emessenger.app.core.datastore.SessionStore
import com.emessenger.app.core.network.MessengerApi
import com.emessenger.app.data.remote.RegisterRequest
import com.emessenger.app.data.remote.createUploadPayload
import com.emessenger.app.domain.model.AuthSessionModel
import com.emessenger.app.domain.repository.AuthRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val api: MessengerApi,
    private val sessionStore: SessionStore,
    @ApplicationContext private val context: Context
) : AuthRepository {
    override val session: Flow<AuthSessionModel?> = sessionStore.session

    override suspend fun login(identifier: String, password: String): AuthSessionModel {
        val session = api.login(com.emessenger.app.data.remote.LoginRequest(identifier, password)).data
        sessionStore.save(session)
        return session
    }

    override suspend fun register(username: String, email: String?, phone: String?, password: String, country: String?): AuthSessionModel {
        val session = api.register(RegisterRequest(username, email, phone, password, country)).data
        sessionStore.save(session)
        return session
    }

    override suspend fun updateProfile(
        fullName: String?,
        username: String,
        email: String?,
        phone: String?,
        about: String?,
        country: String?
    ): AuthSessionModel? {
        val updatedUser = api.updateMe(
            mapOf(
                "fullName" to fullName,
                "username" to username,
                "email" to email,
                "phone" to phone,
                "about" to about,
                "country" to country
            )
        ).data
        val current = session.first() ?: return null
        val updatedSession = current.copy(
            user = current.user.copy(
                username = updatedUser.username,
                fullName = updatedUser.fullName,
                displayName = updatedUser.displayName,
                email = updatedUser.email,
                phone = updatedUser.phone,
                about = updatedUser.about,
                avatarUrl = updatedUser.avatarUrl,
                country = updatedUser.country,
                role = updatedUser.role,
                status = updatedUser.status
            )
        )
        sessionStore.save(updatedSession)
        return updatedSession
    }

    override suspend fun uploadAvatar(uri: Uri): AuthSessionModel? {
        val payload = context.contentResolver.createUploadPayload(uri)
        val updatedUser = api.uploadAvatar(payload.part).data
        val current = session.first() ?: return null
        val updatedSession = current.copy(user = updatedUser)
        sessionStore.save(updatedSession)
        return updatedSession
    }

    override suspend fun logout() {
        sessionStore.clear()
    }
}

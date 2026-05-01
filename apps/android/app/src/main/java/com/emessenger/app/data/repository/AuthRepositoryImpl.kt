package com.emessenger.app.data.repository

import com.emessenger.app.core.datastore.SessionStore
import com.emessenger.app.core.network.MessengerApi
import com.emessenger.app.domain.model.AuthSessionModel
import com.emessenger.app.domain.repository.AuthRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val api: MessengerApi,
    private val sessionStore: SessionStore
) : AuthRepository {
    override val session: Flow<AuthSessionModel?> = sessionStore.session

    override suspend fun login(identifier: String, password: String): AuthSessionModel {
        val session = api.login(com.emessenger.app.data.remote.LoginRequest(identifier, password)).data
        sessionStore.save(session)
        return session
    }

    override suspend fun register(username: String, email: String?, phone: String?, password: String): AuthSessionModel {
        val session = api.register(com.emessenger.app.data.remote.RegisterRequest(username, email, phone, password)).data
        sessionStore.save(session)
        return session
    }

    override suspend fun logout() {
        sessionStore.clear()
    }
}

package com.emessenger.app.core.datastore

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.emessenger.app.core.utils.PulseLineThemeMode
import com.emessenger.app.domain.model.AuthSessionModel
import com.emessenger.app.domain.model.UserModel
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.dataStore by preferencesDataStore(name = "emessenger_session")

@Singleton
class SessionStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private object Keys {
        val accessToken = stringPreferencesKey("access_token")
        val refreshToken = stringPreferencesKey("refresh_token")
        val userId = stringPreferencesKey("user_id")
        val username = stringPreferencesKey("username")
        val email = stringPreferencesKey("email")
        val phone = stringPreferencesKey("phone")
        val avatar = stringPreferencesKey("avatar")
        val role = stringPreferencesKey("role")
        val status = stringPreferencesKey("status")
        val themeMode = stringPreferencesKey("theme_mode")
    }

    val session: Flow<AuthSessionModel?> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { preferences -> preferences.toSession() }

    val themeMode: Flow<PulseLineThemeMode> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { preferences ->
            when (preferences[Keys.themeMode]) {
                PulseLineThemeMode.LIGHT.name -> PulseLineThemeMode.LIGHT
                PulseLineThemeMode.DARK.name -> PulseLineThemeMode.DARK
                else -> PulseLineThemeMode.SYSTEM
            }
        }

    suspend fun save(session: AuthSessionModel) {
        context.dataStore.edit { preferences ->
            preferences[Keys.accessToken] = session.accessToken
            preferences[Keys.refreshToken] = session.refreshToken
            preferences[Keys.userId] = session.user.id
            preferences[Keys.username] = session.user.username
            preferences[Keys.email] = session.user.email.orEmpty()
            preferences[Keys.phone] = session.user.phone.orEmpty()
            preferences[Keys.avatar] = session.user.avatarUrl.orEmpty()
            preferences[Keys.role] = session.user.role
            preferences[Keys.status] = session.user.status
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }

    suspend fun saveThemeMode(mode: PulseLineThemeMode) {
        context.dataStore.edit { it[Keys.themeMode] = mode.name }
    }

    suspend fun updateUser(user: UserModel) {
        val current = session.first() ?: return
        save(current.copy(user = user))
    }

    private fun Preferences.toSession(): AuthSessionModel? {
        val accessToken = this[Keys.accessToken] ?: return null
        val refreshToken = this[Keys.refreshToken] ?: return null
        return AuthSessionModel(
            accessToken = accessToken,
            refreshToken = refreshToken,
            user = com.emessenger.app.domain.model.UserModel(
                id = this[Keys.userId].orEmpty(),
                username = this[Keys.username].orEmpty(),
                email = this[Keys.email]?.ifBlank { null },
                phone = this[Keys.phone]?.ifBlank { null },
                avatarUrl = this[Keys.avatar]?.ifBlank { null },
                role = this[Keys.role].orEmpty(),
                status = this[Keys.status].orEmpty()
            )
        )
    }
}

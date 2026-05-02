package com.emessenger.app.features.profile

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emessenger.app.core.datastore.SessionStore
import com.emessenger.app.core.utils.translateError
import com.emessenger.app.domain.model.UserModel
import com.emessenger.app.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProfileUiState(
    val user: UserModel? = null,
    val loading: Boolean = true,
    val saving: Boolean = false,
    val saved: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    sessionStore: SessionStore
) : ViewModel() {
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            sessionStore.session.collect { session ->
                _uiState.value = _uiState.value.copy(user = session?.user, loading = false)
            }
        }
    }

    fun save(
        fullName: String,
        username: String,
        email: String,
        phone: String,
        about: String,
        country: String
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(saving = true, saved = false, error = null)
            runCatching {
                authRepository.updateProfile(
                    fullName = fullName.trim().ifBlank { null },
                    username = username.trim(),
                    email = email.trim().ifBlank { null },
                    phone = phone.trim().ifBlank { null },
                    about = about.trim().ifBlank { null },
                    country = country.trim().ifBlank { null }
                )
            }
                .onSuccess { _uiState.value = _uiState.value.copy(saving = false, saved = true) }
                .onFailure { _uiState.value = _uiState.value.copy(saving = false, error = translateError(it.message)) }
        }
    }

    fun uploadAvatar(uri: Uri) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(saving = true, saved = false, error = null)
            runCatching { authRepository.uploadAvatar(uri) }
                .onSuccess { _uiState.value = _uiState.value.copy(saving = false, saved = true) }
                .onFailure { _uiState.value = _uiState.value.copy(saving = false, error = translateError(it.message)) }
        }
    }

    fun consumeSaved() {
        _uiState.value = _uiState.value.copy(saved = false)
    }

    fun logout(onLoggedOut: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            onLoggedOut()
        }
    }
}

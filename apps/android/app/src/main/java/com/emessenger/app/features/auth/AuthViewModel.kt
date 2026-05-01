package com.emessenger.app.features.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emessenger.app.core.utils.translateError
import com.emessenger.app.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface AuthUiState {
    data object Idle : AuthUiState
    data object Loading : AuthUiState
    data object Success : AuthUiState
    data class Error(val message: String) : AuthUiState
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun login(identifier: String, password: String) {
        if (identifier.isBlank()) {
            _uiState.value = AuthUiState.Error("Введите email или имя пользователя")
            return
        }
        if (password.isBlank()) {
            _uiState.value = AuthUiState.Error("Введите пароль")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            runCatching { authRepository.login(identifier.trim(), password) }
                .onSuccess { _uiState.value = AuthUiState.Success }
                .onFailure { _uiState.value = AuthUiState.Error(translateError(it.message)) }
        }
    }

    fun register(username: String, email: String, phone: String, password: String) {
        if (username.isBlank()) {
            _uiState.value = AuthUiState.Error("Введите имя пользователя")
            return
        }
        if (password.isBlank()) {
            _uiState.value = AuthUiState.Error("Введите пароль")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            runCatching {
                authRepository.register(
                    username = username.trim(),
                    email = email.trim().ifBlank { null },
                    phone = phone.trim().ifBlank { null },
                    password = password
                )
            }.onSuccess {
                _uiState.value = AuthUiState.Success
            }.onFailure {
                _uiState.value = AuthUiState.Error(translateError(it.message))
            }
        }
    }

    fun resetState() {
        _uiState.value = AuthUiState.Idle
    }
}

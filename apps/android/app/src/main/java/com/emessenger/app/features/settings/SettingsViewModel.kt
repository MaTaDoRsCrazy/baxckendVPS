package com.emessenger.app.features.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emessenger.app.core.datastore.SessionStore
import com.emessenger.app.core.utils.PulseLineThemeMode
import com.emessenger.app.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SettingsUiState(
    val themeMode: PulseLineThemeMode = PulseLineThemeMode.SYSTEM,
    val messageNotifications: Boolean = true,
    val callNotifications: Boolean = true,
    val soundEnabled: Boolean = true
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val sessionStore: SessionStore
) : ViewModel() {
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            sessionStore.themeMode.collect { mode ->
                _uiState.value = _uiState.value.copy(themeMode = mode)
            }
        }
    }

    fun setThemeMode(mode: PulseLineThemeMode) {
        viewModelScope.launch { sessionStore.saveThemeMode(mode) }
    }

    fun toggleMessages() {
        _uiState.value = _uiState.value.copy(messageNotifications = !_uiState.value.messageNotifications)
    }

    fun toggleCalls() {
        _uiState.value = _uiState.value.copy(callNotifications = !_uiState.value.callNotifications)
    }

    fun toggleSound() {
        _uiState.value = _uiState.value.copy(soundEnabled = !_uiState.value.soundEnabled)
    }

    fun logout(onLoggedOut: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            onLoggedOut()
        }
    }
}

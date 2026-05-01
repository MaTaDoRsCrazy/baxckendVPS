package com.emessenger.app.core.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emessenger.app.core.datastore.SessionStore
import com.emessenger.app.core.socket.SocketManager
import com.emessenger.app.core.utils.PulseLineThemeMode
import com.emessenger.app.domain.model.AuthSessionModel
import com.emessenger.app.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class RootViewModel @Inject constructor(
    authRepository: AuthRepository,
    sessionStore: SessionStore,
    private val socketManager: SocketManager
) : ViewModel() {
    private val _session = MutableStateFlow<AuthSessionModel?>(null)
    val session: StateFlow<AuthSessionModel?> = _session.asStateFlow()

    private val _themeMode = MutableStateFlow(PulseLineThemeMode.SYSTEM)
    val themeMode: StateFlow<PulseLineThemeMode> = _themeMode.asStateFlow()

    private var currentSocketToken: String? = null

    init {
        viewModelScope.launch {
            authRepository.session.collect { session ->
                _session.value = session
                val token = session?.accessToken
                if (token != null && token != currentSocketToken) {
                    socketManager.disconnect()
                    socketManager.connect(token)
                    currentSocketToken = token
                } else if (token == null && currentSocketToken != null) {
                    socketManager.disconnect()
                    currentSocketToken = null
                }
            }
        }
        viewModelScope.launch {
            sessionStore.themeMode.collect { _themeMode.value = it }
        }
    }

    override fun onCleared() {
        socketManager.disconnect()
        super.onCleared()
    }
}

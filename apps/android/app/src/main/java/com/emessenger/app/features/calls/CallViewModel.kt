package com.emessenger.app.features.calls

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emessenger.app.core.livekit.LiveKitController
import com.emessenger.app.core.utils.formatCallType
import com.emessenger.app.core.utils.translateError
import com.emessenger.app.domain.repository.CallRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CallUiState(
    val callId: String? = null,
    val callerName: String = "PulseLine",
    val callType: String = "AUDIO",
    val status: String = "Ожидание",
    val connected: Boolean = false,
    val livekitRoomName: String? = null,
    val loading: Boolean = false,
    val error: String? = null,
    val startedAtMillis: Long? = null
)

@HiltViewModel
class CallViewModel @Inject constructor(
    private val callRepository: CallRepository,
    private val liveKitController: LiveKitController
) : ViewModel() {
    private val _uiState = MutableStateFlow(CallUiState())
    val uiState: StateFlow<CallUiState> = _uiState.asStateFlow()

    private var loadedCallId: String? = null

    fun connect(callId: String) {
        if (loadedCallId == callId && (_uiState.value.connected || _uiState.value.loading)) return
        loadedCallId = callId
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(callId = callId, loading = true, status = "Соединение…", error = null)
            runCatching {
                val historyCall = callRepository.getHistory().firstOrNull { it.id == callId }
                val token = callRepository.getToken(callId)
                val isVideo = historyCall?.type == "VIDEO"
                liveKitController.connect(token.url, token.token, audio = true, video = isVideo)
                Triple(historyCall?.type ?: "AUDIO", token.roomName, isVideo)
            }.onSuccess { (type, roomName, _) ->
                _uiState.value = _uiState.value.copy(
                    callId = callId,
                    callType = type,
                    livekitRoomName = roomName,
                    status = formatCallType(type),
                    connected = true,
                    loading = false,
                    startedAtMillis = System.currentTimeMillis()
                )
            }.onFailure {
                _uiState.value = _uiState.value.copy(
                    loading = false,
                    connected = false,
                    status = "Звонок завершён",
                    error = translateError(it.message)
                )
            }
        }
    }

    fun prepareIncoming(callId: String, callerName: String = "PulseLine", type: String = "AUDIO") {
        _uiState.value = _uiState.value.copy(
            callId = callId,
            callerName = callerName,
            callType = type,
            status = "Входящий звонок"
        )
    }

    fun acceptIncoming(onAccepted: (String) -> Unit) {
        val callId = _uiState.value.callId ?: return
        viewModelScope.launch {
            runCatching { callRepository.acceptCall(callId) }
                .onSuccess { onAccepted(callId) }
                .onFailure { _uiState.value = _uiState.value.copy(error = translateError(it.message)) }
        }
    }

    fun rejectIncoming(onRejected: () -> Unit) {
        val callId = _uiState.value.callId ?: return
        viewModelScope.launch {
            runCatching { callRepository.rejectCall(callId) }
            _uiState.value = _uiState.value.copy(status = "Звонок завершён")
            onRejected()
        }
    }

    fun endCall(callId: String, onEnded: () -> Unit) {
        viewModelScope.launch {
            runCatching { callRepository.endCall(callId) }
            liveKitController.disconnect()
            _uiState.value = _uiState.value.copy(status = "Звонок завершён", connected = false)
            onEnded()
        }
    }
}

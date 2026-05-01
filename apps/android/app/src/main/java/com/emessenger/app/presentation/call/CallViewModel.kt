package com.emessenger.app.presentation.call

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emessenger.app.core.livekit.LiveKitController
import com.emessenger.app.domain.repository.CallRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CallUiState(
    val connected: Boolean = false,
    val status: String = "Idle",
    val incomingCallId: String? = null,
    val error: String? = null
)

@HiltViewModel
class CallViewModel @Inject constructor(
    private val callRepository: CallRepository,
    private val liveKitController: LiveKitController
) : ViewModel() {
    private val _state = MutableStateFlow(CallUiState())
    val state: StateFlow<CallUiState> = _state.asStateFlow()
    val currentCallId: String?
        get() = state.value.incomingCallId

    fun connect(callId: String) {
        viewModelScope.launch {
            runCatching {
                val token = callRepository.getToken(callId)
                liveKitController.connect(token.url, token.token)
            }.onSuccess {
                _state.value = CallUiState(connected = true, status = "Connected", incomingCallId = callId)
            }.onFailure {
                _state.value = CallUiState(error = it.message, status = "Failed")
            }
        }
    }

    fun acceptIncoming() {
        state.value.incomingCallId?.let { callId ->
            viewModelScope.launch { callRepository.acceptCall(callId) }
        }
    }

    fun rejectIncoming() {
        state.value.incomingCallId?.let { callId ->
            viewModelScope.launch { callRepository.rejectCall(callId) }
        }
    }

    fun endCall(callId: String) {
        viewModelScope.launch {
            runCatching { callRepository.endCall(callId) }
            liveKitController.disconnect()
            _state.value = CallUiState(status = "Ended")
        }
    }
}

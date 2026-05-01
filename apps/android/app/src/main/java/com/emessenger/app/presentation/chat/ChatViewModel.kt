package com.emessenger.app.presentation.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emessenger.app.domain.model.ConversationModel
import com.emessenger.app.domain.model.MessageModel
import com.emessenger.app.domain.repository.CallRepository
import com.emessenger.app.domain.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChatUiState(
    val conversation: ConversationModel? = null,
    val messages: List<MessageModel> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null,
    val lastCreatedCallId: String? = null
)

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val callRepository: CallRepository
) : ViewModel() {
    private val _state = MutableStateFlow(ChatUiState())
    val state: StateFlow<ChatUiState> = _state.asStateFlow()

    fun load(chatId: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true)
            runCatching {
                val conversation = chatRepository.getChat(chatId)
                chatRepository.refreshMessages(chatId)
                chatRepository.observeMessages(chatId).collect { messages ->
                    _state.value = ChatUiState(conversation = conversation, messages = messages)
                }
            }.onFailure {
                _state.value = _state.value.copy(error = it.message, loading = false)
            }
        }
    }

    fun sendMessage(chatId: String, body: String) {
        viewModelScope.launch {
            runCatching { chatRepository.sendMessage(chatId, body) }
                .onFailure { _state.value = _state.value.copy(error = it.message) }
        }
    }

    fun startAudioCall(chatId: String) {
        startCall(chatId, "AUDIO")
    }

    fun startVideoCall(chatId: String) {
        startCall(chatId, "VIDEO")
    }

    private fun startCall(chatId: String, type: String) {
        viewModelScope.launch {
            runCatching { callRepository.startCall(chatId, type) }
                .onSuccess { _state.value = _state.value.copy(lastCreatedCallId = it.id) }
                .onFailure { _state.value = _state.value.copy(error = it.message) }
        }
    }
}

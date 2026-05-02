package com.emessenger.app.features.chat

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emessenger.app.core.datastore.SessionStore
import com.emessenger.app.core.socket.SocketManager
import com.emessenger.app.core.utils.translateError
import com.emessenger.app.domain.model.ConversationModel
import com.emessenger.app.domain.model.MessageModel
import com.emessenger.app.domain.repository.CallRepository
import com.emessenger.app.domain.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChatUiState(
    val conversation: ConversationModel? = null,
    val messages: List<MessageModel> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null,
    val currentUserId: String? = null,
    val typing: Boolean = false,
    val pendingCallId: String? = null
)

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val callRepository: CallRepository,
    private val sessionStore: SessionStore,
    private val socketManager: SocketManager
) : ViewModel() {
    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    private var loadJob: Job? = null
    private var currentChatId: String? = null

    init {
        viewModelScope.launch {
            sessionStore.session.collect { session ->
                _uiState.value = _uiState.value.copy(currentUserId = session?.user?.id)
            }
        }
    }

    fun load(chatId: String) {
        if (currentChatId == chatId && (_uiState.value.messages.isNotEmpty() || _uiState.value.loading)) return
        currentChatId = chatId
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            runCatching {
                val conversation = chatRepository.getChat(chatId)
                chatRepository.refreshMessages(chatId)
                conversation
            }.onSuccess { conversation ->
                chatRepository.observeMessages(chatId).collect { messages ->
                    _uiState.value = _uiState.value.copy(
                        conversation = conversation,
                        messages = messages,
                        loading = false,
                        error = null
                    )
                }
            }.onFailure {
                _uiState.value = _uiState.value.copy(error = translateError(it.message), loading = false)
            }
        }
    }

    fun onDraftChanged(chatId: String, value: String) {
        val isTyping = value.isNotBlank()
        if (_uiState.value.typing == isTyping) return
        _uiState.value = _uiState.value.copy(typing = isTyping)
        socketManager.emit(if (isTyping) "typing:start" else "typing:stop", mapOf("conversationId" to chatId))
    }

    fun sendMessage(chatId: String, body: String) {
        if (body.isBlank()) {
            _uiState.value = _uiState.value.copy(error = "Сообщение не может быть пустым")
            return
        }
        viewModelScope.launch {
            runCatching { chatRepository.sendMessage(chatId, body.trim()) }
                .onSuccess {
                    socketManager.emit("typing:stop", mapOf("conversationId" to chatId))
                    _uiState.value = _uiState.value.copy(typing = false)
                }
                .onFailure { _uiState.value = _uiState.value.copy(error = translateError(it.message)) }
        }
    }

    fun sendAttachment(chatId: String, uri: Uri) {
        viewModelScope.launch {
            runCatching { chatRepository.sendAttachment(chatId, uri) }
                .onFailure { _uiState.value = _uiState.value.copy(error = translateError(it.message)) }
        }
    }

    fun sendVoice(chatId: String, uri: Uri) {
        viewModelScope.launch {
            runCatching { chatRepository.sendVoice(chatId, uri) }
                .onFailure { _uiState.value = _uiState.value.copy(error = translateError(it.message)) }
        }
    }

    fun startCall(chatId: String, type: String) {
        viewModelScope.launch {
            runCatching { callRepository.startCall(chatId, type) }
                .onSuccess { _uiState.value = _uiState.value.copy(pendingCallId = it.id) }
                .onFailure { _uiState.value = _uiState.value.copy(error = translateError(it.message)) }
        }
    }

    fun consumePendingCall() {
        _uiState.value = _uiState.value.copy(pendingCallId = null)
    }
}

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
import com.google.gson.Gson
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

    private val gson = Gson()
    private var observeJob: Job? = null
    private var currentChatId: String? = null

    init {
        viewModelScope.launch {
            sessionStore.session.collect { session ->
                _uiState.value = _uiState.value.copy(currentUserId = session?.user?.id)
            }
        }
    }

    fun load(chatId: String) {
        if (currentChatId != chatId) {
            currentChatId = chatId
            attachSocketListeners(chatId)
        }

        observeJob?.cancel()
        observeJob = viewModelScope.launch {
            chatRepository.observeMessages(chatId).collect { messages ->
                _uiState.value = _uiState.value.copy(
                    messages = messages,
                    loading = _uiState.value.loading && messages.isEmpty()
                )
            }
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = _uiState.value.messages.isEmpty(), error = null)
            runCatching { chatRepository.getChat(chatId) }
                .onSuccess { conversation ->
                    _uiState.value = _uiState.value.copy(conversation = conversation, loading = false, error = null)
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(error = translateError(it.message), loading = false)
                }
        }

        viewModelScope.launch {
            runCatching { chatRepository.refreshMessages(chatId) }
                .onFailure {
                    if (_uiState.value.messages.isEmpty()) {
                        _uiState.value = _uiState.value.copy(error = translateError(it.message), loading = false)
                    }
                }
        }
    }

    private fun attachSocketListeners(chatId: String) {
        socketManager.off("message:new")
        socketManager.off("connect")
        socketManager.off("typing:start")
        socketManager.off("typing:stop")

        socketManager.on("message:new") { args ->
            val payload = args.firstOrNull()?.toString().orEmpty()
            if (payload.isBlank()) return@on
            runCatching { gson.fromJson(payload, MessageModel::class.java) }
                .onSuccess { message ->
                    if (message.conversationId == chatId) {
                        viewModelScope.launch {
                            runCatching { chatRepository.upsertIncomingMessage(message) }
                        }
                    }
                }
        }

        socketManager.on("connect") {
            viewModelScope.launch {
                val latestCreatedAt = chatRepository.latestMessageCreatedAt(chatId)
                runCatching { chatRepository.refreshMessages(chatId, latestCreatedAt) }
            }
        }

        socketManager.on("typing:start") { args ->
            val payload = args.firstOrNull()?.toString().orEmpty()
            if (payload.contains(chatId)) {
                _uiState.value = _uiState.value.copy(typing = true)
            }
        }

        socketManager.on("typing:stop") { args ->
            val payload = args.firstOrNull()?.toString().orEmpty()
            if (payload.contains(chatId)) {
                _uiState.value = _uiState.value.copy(typing = false)
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
                    _uiState.value = _uiState.value.copy(typing = false, error = null)
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

package com.emessenger.app.features.chats

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emessenger.app.core.utils.translateError
import com.emessenger.app.domain.model.ConversationModel
import com.emessenger.app.domain.model.UserModel
import com.emessenger.app.domain.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChatsUiState(
    val chats: List<ConversationModel> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
    val searchQuery: String = "",
    val searchResults: List<UserModel> = emptyList(),
    val showCreator: Boolean = false,
    val groupTitle: String = "",
    val selectedUserIds: Set<String> = emptySet(),
    val creating: Boolean = false,
    val navigateToChatId: String? = null
)

@HiltViewModel
class ChatsViewModel @Inject constructor(
    private val chatRepository: ChatRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(ChatsUiState())
    val uiState: StateFlow<ChatsUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            runCatching { chatRepository.getChats() }
                .onSuccess { _uiState.value = _uiState.value.copy(chats = it, loading = false) }
                .onFailure { _uiState.value = _uiState.value.copy(error = translateError(it.message), loading = false) }
        }
    }

    fun updateSearchQuery(value: String) {
        _uiState.value = _uiState.value.copy(searchQuery = value)
    }

    fun searchUsers() {
        val query = _uiState.value.searchQuery.trim()
        if (query.isBlank()) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(creating = true, error = null)
            runCatching { chatRepository.searchUsers(query) }
                .onSuccess { _uiState.value = _uiState.value.copy(searchResults = it, creating = false) }
                .onFailure { _uiState.value = _uiState.value.copy(error = translateError(it.message), creating = false) }
        }
    }

    fun toggleCreator() {
        _uiState.value = _uiState.value.copy(showCreator = !_uiState.value.showCreator)
    }

    fun updateGroupTitle(value: String) {
        _uiState.value = _uiState.value.copy(groupTitle = value)
    }

    fun toggleSelectedUser(userId: String) {
        val selected = _uiState.value.selectedUserIds.toMutableSet()
        if (!selected.add(userId)) {
            selected.remove(userId)
        }
        _uiState.value = _uiState.value.copy(selectedUserIds = selected)
    }

    fun createPrivateChat(userId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(creating = true, error = null)
            runCatching { chatRepository.createPrivateChat(userId) }
                .onSuccess { conversation ->
                    _uiState.value = _uiState.value.copy(
                        creating = false,
                        showCreator = false,
                        navigateToChatId = conversation.id
                    )
                    refresh()
                }
                .onFailure { _uiState.value = _uiState.value.copy(error = translateError(it.message), creating = false) }
        }
    }

    fun createGroupChat() {
        val title = _uiState.value.groupTitle.trim()
        val members = _uiState.value.selectedUserIds.toList()
        if (title.isBlank() || members.isEmpty()) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(creating = true, error = null)
            runCatching { chatRepository.createGroupChat(title, members) }
                .onSuccess { conversation ->
                    _uiState.value = _uiState.value.copy(
                        creating = false,
                        showCreator = false,
                        groupTitle = "",
                        searchResults = emptyList(),
                        selectedUserIds = emptySet(),
                        navigateToChatId = conversation.id
                    )
                    refresh()
                }
                .onFailure { _uiState.value = _uiState.value.copy(error = translateError(it.message), creating = false) }
        }
    }

    fun consumeNavigation() {
        _uiState.value = _uiState.value.copy(navigateToChatId = null)
    }
}

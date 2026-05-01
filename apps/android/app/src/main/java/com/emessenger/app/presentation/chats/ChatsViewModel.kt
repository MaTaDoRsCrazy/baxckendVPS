package com.emessenger.app.presentation.chats

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emessenger.app.domain.model.ConversationModel
import com.emessenger.app.domain.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChatsUiState(
    val chats: List<ConversationModel> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ChatsViewModel @Inject constructor(
    private val chatRepository: ChatRepository
) : ViewModel() {
    private val _state = MutableStateFlow(ChatsUiState(loading = true))
    val state: StateFlow<ChatsUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true)
            runCatching { chatRepository.getChats() }
                .onSuccess { _state.value = ChatsUiState(chats = it) }
                .onFailure { _state.value = ChatsUiState(error = it.message) }
        }
    }
}

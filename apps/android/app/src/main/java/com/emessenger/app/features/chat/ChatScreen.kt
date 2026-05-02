package com.emessenger.app.features.chat

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Call
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Videocam
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.emessenger.app.R
import com.emessenger.app.core.design.PulseLineAvatar
import com.emessenger.app.core.design.PulseLineEmptyState
import com.emessenger.app.core.utils.displayTitle
import com.emessenger.app.core.utils.formatDayDivider
import com.emessenger.app.core.utils.formatPresence

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun ChatScreen(
    chatId: String,
    viewModel: ChatViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onOpenInfo: () -> Unit,
    onOpenCall: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var draft by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(chatId) { viewModel.load(chatId) }
    LaunchedEffect(uiState.messages.size) {
        if (uiState.messages.isNotEmpty()) {
            listState.animateScrollToItem(uiState.messages.lastIndex)
        }
    }
    LaunchedEffect(uiState.pendingCallId) {
        uiState.pendingCallId?.let {
            onOpenCall(it)
            viewModel.consumePendingCall()
        }
    }

    val title = uiState.conversation?.displayTitle(uiState.currentUserId) ?: stringResource(R.string.chats)

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        PulseLineAvatar(title = title, modifier = Modifier.padding(vertical = 6.dp))
                        Column {
                            Text(text = title, style = MaterialTheme.typography.titleMedium)
                            Text(
                                text = if (uiState.typing) stringResource(R.string.typing) else formatPresence(true),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Rounded.ArrowBack, contentDescription = stringResource(R.string.back))
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.startCall(chatId, "AUDIO") }) {
                        Icon(Icons.Rounded.Call, contentDescription = stringResource(R.string.audio_call))
                    }
                    IconButton(onClick = { viewModel.startCall(chatId, "VIDEO") }) {
                        Icon(Icons.Rounded.Videocam, contentDescription = stringResource(R.string.video_call))
                    }
                    IconButton(onClick = onOpenInfo) {
                        Icon(Icons.Rounded.Info, contentDescription = stringResource(R.string.chat_info))
                    }
                }
            )
        },
        bottomBar = {
            MessageComposer(
                value = draft,
                onValueChange = {
                    draft = it
                    viewModel.onDraftChanged(chatId, it)
                },
                onSend = {
                    viewModel.sendMessage(chatId, draft)
                    draft = ""
                },
                onSendAttachment = { uri -> viewModel.sendAttachment(chatId, uri) },
                onSendVoice = { uri -> viewModel.sendVoice(chatId, uri) }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            uiState.error?.let {
                Text(
                    text = it,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
            if (uiState.loading && uiState.messages.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = stringResource(R.string.loading), color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            } else if (uiState.messages.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    PulseLineEmptyState(
                        title = stringResource(R.string.no_messages),
                        subtitle = stringResource(R.string.start_chat)
                    )
                }
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    itemsIndexed(uiState.messages, key = { _, item -> item.id }) { index, message ->
                        val previous = uiState.messages.getOrNull(index - 1)
                        if (previous == null || formatDayDivider(previous.createdAt) != formatDayDivider(message.createdAt)) {
                            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                Text(
                                    text = formatDayDivider(message.createdAt),
                                    modifier = Modifier.padding(vertical = 8.dp),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = if (message.senderId == uiState.currentUserId) Arrangement.End else Arrangement.Start
                        ) {
                            MessageBubble(
                                message = message,
                                own = message.senderId == uiState.currentUserId,
                                senderLabel = message.sender?.displayName
                                    ?: uiState.conversation?.members?.firstOrNull { it.userId == message.senderId }?.displayName
                                    ?: "PulseLine"
                            )
                        }
                    }
                }
            }
        }
    }
}

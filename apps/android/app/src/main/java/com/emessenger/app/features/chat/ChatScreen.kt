package com.emessenger.app.features.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Call
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Videocam
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.emessenger.app.R
import com.emessenger.app.core.design.PulseLineAvatar
import com.emessenger.app.core.design.PulseLineEmptyState
import com.emessenger.app.core.utils.displayTitle
import com.emessenger.app.core.utils.displayNameOrFallback
import com.emessenger.app.core.utils.formatDayDivider
import com.emessenger.app.core.utils.resolvedSenderLabel

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
    val companion = uiState.conversation?.members?.firstOrNull { it.userId != uiState.currentUserId }
    val subtitle = when {
        uiState.typing -> stringResource(R.string.typing)
        uiState.conversation?.type == "GROUP" -> "${stringResource(R.string.participants)}: ${uiState.conversation?.members?.size ?: 0}"
        else -> stringResource(R.string.online)
    }
    val avatarUrl = uiState.conversation?.avatarUrl ?: companion?.avatarUrl

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ChatHeaderAvatar(
                            title = title,
                            avatarUrl = avatarUrl,
                            modifier = Modifier.size(42.dp)
                        )
                        Column {
                            Text(
                                text = title,
                                style = MaterialTheme.typography.titleMedium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            ChatStatusLine(
                                text = subtitle,
                                accent = !uiState.typing
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
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
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.28f),
                                MaterialTheme.colorScheme.background
                            )
                        )
                    )
            ) {
                Column(modifier = Modifier.fillMaxSize()) {
                    uiState.error?.let {
                        ChatInlineError(
                            text = it,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)
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
                                subtitle = stringResource(R.string.start_chat),
                                modifier = Modifier.padding(horizontal = 32.dp)
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
                                val previousDay = formatDayDivider(previous?.createdAt)
                                val currentDay = formatDayDivider(message.createdAt)
                                if ((previous == null || previousDay != currentDay) && currentDay.isNotBlank()) {
                                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                        Surface(
                                            shape = CircleShape,
                                            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.85f)
                                        ) {
                                            Text(
                                                text = currentDay,
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                textAlign = TextAlign.Center
                                            )
                                        }
                                    }
                                }
                                val senderMember = uiState.conversation?.members?.firstOrNull { it.userId == message.senderId }
                                val senderLabel = message.senderLabel
                                    .takeUnless { it.isBlank() }
                                    ?: message.resolvedSenderLabel(senderMember)
                                        .takeUnless { it.isBlank() }
                                    ?: senderMember?.displayNameOrFallback()
                                    ?: "Пользователь"
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = if (message.senderId == uiState.currentUserId) Arrangement.End else Arrangement.Start
                                ) {
                                    MessageBubble(
                                        message = message,
                                        own = message.senderId == uiState.currentUserId,
                                        senderLabel = senderLabel
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ChatHeaderAvatar(
    title: String,
    avatarUrl: String?,
    modifier: Modifier = Modifier
) {
    if (!avatarUrl.isNullOrBlank()) {
        AsyncImage(
            model = avatarUrl,
            contentDescription = title,
            modifier = modifier
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surfaceVariant),
            contentScale = ContentScale.Crop
        )
    } else {
        PulseLineAvatar(title = title, modifier = modifier)
    }
}

@Composable
private fun ChatStatusLine(
    text: String,
    accent: Boolean
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        if (accent) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.secondary)
            )
        }
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall,
            color = if (accent) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun ChatInlineError(
    text: String,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.error.copy(alpha = 0.10f)
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodySmall
        )
    }
}

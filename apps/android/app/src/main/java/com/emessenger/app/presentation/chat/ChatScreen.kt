package com.emessenger.app.presentation.chat

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.emessenger.app.presentation.auth.collectAsStateLifecycleAware
import kotlinx.coroutines.flow.StateFlow

@Composable
fun ChatScreen(
    chatId: String,
    state: StateFlow<ChatUiState>,
    onLoad: () -> Unit,
    onBack: () -> Unit,
    onSendMessage: (String) -> Unit,
    onAudioCall: () -> Unit,
    onVideoCall: () -> Unit,
    onCallStarted: (String) -> Unit
) {
    val uiState = state.collectAsStateLifecycleAware()
    var body by remember { mutableStateOf("") }

    LaunchedEffect(chatId) { onLoad() }
    LaunchedEffect(uiState.lastCreatedCallId) {
        uiState.lastCreatedCallId?.let(onCallStarted)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Button(onClick = onBack) { Text("Back") }
            Text(uiState.conversation?.title ?: chatId, style = MaterialTheme.typography.titleLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onAudioCall) { Text("Audio") }
                Button(onClick = onVideoCall) { Text("Video") }
            }
        }
        LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(uiState.messages) { message ->
                Text("${message.senderId}: ${message.body.orEmpty()}")
            }
        }
        OutlinedTextField(
            value = body,
            onValueChange = { body = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Message") }
        )
        Button(
            onClick = {
                onSendMessage(body)
                body = ""
            },
            modifier = Modifier.fillMaxWidth()
        ) { Text("Send") }
    }
}

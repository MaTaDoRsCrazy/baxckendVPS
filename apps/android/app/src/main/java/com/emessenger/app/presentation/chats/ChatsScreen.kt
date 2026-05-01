package com.emessenger.app.presentation.chats

import androidx.compose.foundation.clickable
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
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.emessenger.app.presentation.auth.collectAsStateLifecycleAware
import kotlinx.coroutines.flow.StateFlow

@Composable
fun ChatsScreen(
    state: StateFlow<ChatsUiState>,
    onRefresh: () -> Unit,
    onOpenChat: (String) -> Unit,
    onProfile: () -> Unit,
    onSettings: () -> Unit
) {
    val uiState = state.collectAsStateLifecycleAware()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Chats", style = MaterialTheme.typography.headlineMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onProfile) { Text("Profile") }
                Button(onClick = onSettings) { Text("Settings") }
            }
        }
        Button(onClick = onRefresh, modifier = Modifier.fillMaxWidth()) { Text("Refresh") }
        uiState.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(uiState.chats) { chat ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenChat(chat.id) },
                    tonalElevation = 2.dp,
                    shape = MaterialTheme.shapes.large
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(chat.title ?: chat.id, style = MaterialTheme.typography.titleMedium)
                        Text(chat.type, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}

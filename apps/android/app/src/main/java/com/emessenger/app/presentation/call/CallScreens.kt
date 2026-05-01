package com.emessenger.app.presentation.call

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.emessenger.app.presentation.auth.collectAsStateLifecycleAware
import kotlinx.coroutines.flow.StateFlow

@Composable
fun IncomingCallScreen(
    state: StateFlow<CallUiState>,
    onAccept: () -> Unit,
    onReject: () -> Unit
) {
    val uiState = state.collectAsStateLifecycleAware()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Incoming Call", style = MaterialTheme.typography.headlineMedium)
        Text(uiState.status)
        Button(onClick = onAccept, modifier = Modifier.fillMaxWidth()) { Text("Accept") }
        Button(onClick = onReject, modifier = Modifier.fillMaxWidth()) { Text("Reject") }
    }
}

@Composable
fun CallScreen(
    callId: String,
    state: StateFlow<CallUiState>,
    onLoad: () -> Unit,
    onEnd: () -> Unit
) {
    val uiState = state.collectAsStateLifecycleAware()
    LaunchedEffect(callId) { onLoad() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Call Screen", style = MaterialTheme.typography.headlineMedium)
        Text("Call ID: $callId")
        Text("Status: ${uiState.status}")
        uiState.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(onClick = onEnd, modifier = Modifier.fillMaxWidth()) {
            Text("End Call")
        }
    }
}

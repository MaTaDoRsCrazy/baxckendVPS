package com.emessenger.app.presentation.splash

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.emessenger.app.domain.model.AuthSessionModel
import kotlinx.coroutines.flow.StateFlow

@Composable
fun SplashScreen(
    session: StateFlow<AuthSessionModel?>,
    onAuthed: () -> Unit,
    onUnauthed: () -> Unit
) {
    val current = session.collectAsState().value
    LaunchedEffect(current) {
        if (current == null) onUnauthed() else onAuthed()
    }

    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

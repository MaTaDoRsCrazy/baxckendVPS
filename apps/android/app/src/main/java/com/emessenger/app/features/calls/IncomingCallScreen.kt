package com.emessenger.app.features.calls

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.emessenger.app.R
import com.emessenger.app.core.design.PulseLineAvatar
import com.emessenger.app.core.design.PulseLineFilledButton
import com.emessenger.app.core.design.PulseLineOutlinedButton

@Composable
fun IncomingCallScreen(
    viewModel: CallViewModel = hiltViewModel(),
    onAccept: (String) -> Unit,
    onReject: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val transition = rememberInfiniteTransition(label = "incoming")
    val scale by transition.animateFloat(
        initialValue = 1f,
        targetValue = 1.18f,
        animationSpec = infiniteRepeatable(animation = tween(1400, easing = LinearEasing), repeatMode = RepeatMode.Reverse),
        label = "scale"
    )
    val alpha by transition.animateFloat(
        initialValue = 0.18f,
        targetValue = 0.42f,
        animationSpec = infiniteRepeatable(animation = tween(1400, easing = LinearEasing), repeatMode = RepeatMode.Reverse),
        label = "alpha"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        MaterialTheme.colorScheme.background,
                        MaterialTheme.colorScheme.surface,
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Box(
                    modifier = Modifier
                        .size(180.dp)
                        .scale(scale)
                        .alpha(alpha)
                        .background(MaterialTheme.colorScheme.primary, CircleShape)
                )
                PulseLineAvatar(title = uiState.callerName, modifier = Modifier.size(120.dp))
            }
            Text(text = stringResource(R.string.incoming_call), style = MaterialTheme.typography.headlineMedium)
            Text(text = uiState.callerName, style = MaterialTheme.typography.titleLarge)
            Text(text = if (uiState.callType == "VIDEO") stringResource(R.string.video_call) else stringResource(R.string.audio_call))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                PulseLineOutlinedButton(
                    text = stringResource(R.string.reject),
                    onClick = { viewModel.rejectIncoming(onReject) },
                    modifier = Modifier.weight(1f)
                )
                PulseLineFilledButton(
                    text = stringResource(R.string.accept),
                    onClick = { viewModel.acceptIncoming(onAccept) },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

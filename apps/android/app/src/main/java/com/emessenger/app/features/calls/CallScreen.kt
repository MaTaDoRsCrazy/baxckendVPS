package com.emessenger.app.features.calls

import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Campaign
import androidx.compose.material.icons.rounded.CallEnd
import androidx.compose.material.icons.rounded.Cameraswitch
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.MicOff
import androidx.compose.material.icons.rounded.Videocam
import androidx.compose.material.icons.rounded.VideocamOff
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.emessenger.app.R
import com.emessenger.app.core.design.PulseLineAvatar
import com.emessenger.app.core.permissions.hasPermission
import com.emessenger.app.core.permissions.requiredCallPermissions
import kotlinx.coroutines.delay

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun CallScreen(
    callId: String,
    viewModel: CallViewModel = hiltViewModel(),
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val isVideo = uiState.callType == "VIDEO"
    var micEnabled by remember { mutableStateOf(true) }
    var cameraEnabled by remember { mutableStateOf(isVideo) }
    var seconds by remember { mutableLongStateOf(0L) }
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { }

    LaunchedEffect(callId, isVideo) {
        val permissions = requiredCallPermissions(isVideo)
        if (permissions.any { !hasPermission(context, it) }) {
            permissionLauncher.launch(permissions)
        }
        viewModel.connect(callId)
    }
    LaunchedEffect(uiState.startedAtMillis) {
        if (uiState.startedAtMillis != null) {
            while (true) {
                seconds = ((System.currentTimeMillis() - (uiState.startedAtMillis ?: 0L)) / 1000L).coerceAtLeast(0L)
                delay(1000)
            }
        }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text(if (isVideo) stringResource(R.string.video_call) else stringResource(R.string.audio_call)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Rounded.ArrowBack, contentDescription = stringResource(R.string.back))
                    }
                }
            )
        },
        bottomBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 18.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                CallActionButton(
                    icon = if (micEnabled) Icons.Rounded.Mic else Icons.Rounded.MicOff,
                    label = stringResource(R.string.microphone),
                    onClick = { micEnabled = !micEnabled }
                )
                CallActionButton(
                    icon = Icons.Rounded.Campaign,
                    label = stringResource(R.string.speaker),
                    onClick = { }
                )
                if (isVideo) {
                    CallActionButton(
                        icon = if (cameraEnabled) Icons.Rounded.Videocam else Icons.Rounded.VideocamOff,
                        label = stringResource(R.string.camera),
                        onClick = { cameraEnabled = !cameraEnabled }
                    )
                    CallActionButton(
                        icon = Icons.Rounded.Cameraswitch,
                        label = "Камера",
                        onClick = { }
                    )
                }
                CallActionButton(
                    icon = Icons.Rounded.CallEnd,
                    label = stringResource(R.string.end_call),
                    highlighted = true,
                    onClick = { viewModel.endCall(callId, onBack) }
                )
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(
                    Brush.verticalGradient(
                        listOf(
                            MaterialTheme.colorScheme.background,
                            MaterialTheme.colorScheme.surface,
                            MaterialTheme.colorScheme.tertiary.copy(alpha = 0.22f)
                        )
                    )
                )
        ) {
            if (isVideo) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                        .background(MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.shapes.extraLarge)
                ) {
                    Column(
                        modifier = Modifier
                            .align(Alignment.Center)
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(text = stringResource(R.string.video_placeholder), style = MaterialTheme.typography.bodyLarge)
                        Text(text = uiState.livekitRoomName?.let { "Комната: $it" } ?: "", style = MaterialTheme.typography.bodySmall)
                    }
                    Surface(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(18.dp),
                        shape = RoundedCornerShape(24.dp),
                        color = MaterialTheme.colorScheme.surface
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            PulseLineAvatar(title = "Я", modifier = Modifier.size(72.dp))
                            Text(text = stringResource(R.string.local_preview), style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    PulseLineAvatar(title = uiState.callerName, modifier = Modifier.size(124.dp))
                    Text(
                        text = uiState.callerName,
                        modifier = Modifier.padding(top = 18.dp),
                        style = MaterialTheme.typography.headlineMedium
                    )
                    Text(
                        text = uiState.error ?: if (uiState.connected) stringResource(R.string.call_in_progress) else stringResource(R.string.connecting),
                        modifier = Modifier.padding(top = 8.dp),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "%02d:%02d".format(seconds / 60, seconds % 60),
                        modifier = Modifier.padding(top = 8.dp),
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
    }
}

@Composable
private fun CallActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit,
    highlighted: Boolean = false
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Surface(
            modifier = Modifier.size(58.dp),
            shape = RoundedCornerShape(20.dp),
            color = if (highlighted) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.surface,
            onClick = onClick
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = label,
                    tint = if (highlighted) MaterialTheme.colorScheme.onError else MaterialTheme.colorScheme.onSurface
                )
            }
        }
        Text(text = label, style = MaterialTheme.typography.bodySmall)
    }
}

package com.emessenger.app.features.chat

import android.Manifest
import android.media.MediaRecorder
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AttachFile
import androidx.compose.material.icons.rounded.EmojiEmotions
import androidx.compose.material.icons.rounded.GraphicEq
import androidx.compose.material.icons.rounded.Send
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import com.emessenger.app.R
import java.io.File

@Composable
fun MessageComposer(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    onSendAttachment: (Uri) -> Unit,
    onSendVoice: (Uri) -> Unit
) {
    val context = LocalContext.current
    var recorder by remember { mutableStateOf<MediaRecorder?>(null) }
    var recordingFile by remember { mutableStateOf<File?>(null) }
    var isRecording by remember { mutableStateOf(false) }

    val attachmentLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            onSendAttachment(uri)
        }
    }

    val audioPermissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (!granted) return@rememberLauncherForActivityResult

        val output = File(context.cacheDir, "voice_${System.currentTimeMillis()}.m4a")
        val nextRecorder = MediaRecorder().apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setOutputFile(output.absolutePath)
            prepare()
            start()
        }
        recorder = nextRecorder
        recordingFile = output
        isRecording = true
    }

    DisposableEffect(Unit) {
        onDispose {
            runCatching {
                recorder?.stop()
                recorder?.release()
            }
        }
    }

    Surface(shadowElevation = 12.dp, color = MaterialTheme.colorScheme.surface) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 10.dp),
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            IconButton(onClick = { attachmentLauncher.launch("*/*") }) {
                Icon(Icons.Rounded.AttachFile, contentDescription = stringResource(R.string.attach))
            }
            TextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                placeholder = { androidx.compose.material3.Text(stringResource(R.string.message_hint)) },
                maxLines = 5,
                shape = MaterialTheme.shapes.large,
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                    focusedIndicatorColor = androidx.compose.ui.graphics.Color.Transparent,
                    unfocusedIndicatorColor = androidx.compose.ui.graphics.Color.Transparent
                ),
                leadingIcon = {
                    Icon(Icons.Rounded.EmojiEmotions, contentDescription = null, modifier = Modifier.size(20.dp))
                }
            )
            IconButton(
                onClick = {
                    if (isRecording) {
                        runCatching {
                            recorder?.stop()
                            recorder?.release()
                        }
                        recorder = null
                        isRecording = false
                        recordingFile?.let { onSendVoice(it.toUri()) }
                    } else {
                        audioPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    }
                }
            ) {
                Icon(
                    Icons.Rounded.GraphicEq,
                    contentDescription = if (isRecording) "Остановить запись" else stringResource(R.string.voice_message)
                )
            }
            IconButton(onClick = onSend) { Icon(Icons.Rounded.Send, contentDescription = stringResource(R.string.send)) }
        }
    }
}

package com.emessenger.app.features.chat

import android.content.Intent
import android.media.MediaPlayer
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.emessenger.app.core.utils.formatMessageTime
import com.emessenger.app.domain.model.MessageModel

@Composable
fun MessageBubble(
    message: MessageModel,
    own: Boolean,
    senderLabel: String
) {
    val context = LocalContext.current
    val mediaPlayerState = remember { mutableStateOf<MediaPlayer?>(null) }

    fun openExternal(uri: String) {
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(uri)))
    }

    Column(
        modifier = Modifier
            .clip(
                RoundedCornerShape(
                    topStart = 24.dp,
                    topEnd = 24.dp,
                    bottomStart = if (own) 24.dp else 8.dp,
                    bottomEnd = if (own) 8.dp else 24.dp
                )
            )
            .background(if (own) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        if (!own) {
            Text(
                text = senderLabel,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary
            )
        }

        if (message.isDeleted) {
            Text(
                text = "Сообщение удалено",
                style = MaterialTheme.typography.bodyLarge,
                color = if (own) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
            )
        } else {
            if (!message.body.isNullOrBlank()) {
                Text(
                    text = message.body,
                    style = MaterialTheme.typography.bodyLarge,
                    color = if (own) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
                )
            }

            when (message.type) {
                "IMAGE" -> {
                    if (!message.attachmentUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = message.attachmentUrl,
                            contentDescription = message.attachmentName,
                            modifier = Modifier
                                .padding(top = 4.dp)
                                .clip(MaterialTheme.shapes.large)
                                .clickable { openExternal(message.attachmentUrl) }
                        )
                    }
                }
                "FILE" -> {
                    if (!message.attachmentUrl.isNullOrBlank()) {
                        Text(
                            text = message.attachmentName ?: "Файл",
                            modifier = Modifier.clickable { openExternal(message.attachmentUrl) },
                            color = if (own) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.primary
                        )
                    }
                }
                "VOICE" -> {
                    if (!message.attachmentUrl.isNullOrBlank()) {
                        Text(
                            text = "Голосовое сообщение",
                            modifier = Modifier.clickable {
                                val current = mediaPlayerState.value
                                if (current?.isPlaying == true) {
                                    current.stop()
                                    current.release()
                                    mediaPlayerState.value = null
                                } else {
                                    mediaPlayerState.value?.release()
                                    mediaPlayerState.value = MediaPlayer().apply {
                                        setDataSource(message.attachmentUrl)
                                        prepare()
                                        start()
                                    }
                                }
                            },
                            color = if (own) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                text = formatMessageTime(message.createdAt),
                style = MaterialTheme.typography.bodySmall,
                color = if (own) MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.78f) else MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (own) {
                Text(
                    text = if (message.statuses.any { it.status == "READ" }) "Прочитано" else "Доставлено",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (own) MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.78f) else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

package com.emessenger.app.features.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.emessenger.app.core.utils.formatMessageTime
import com.emessenger.app.domain.model.MessageModel

@Composable
fun MessageBubble(
    message: MessageModel,
    own: Boolean,
    senderLabel: String
) {
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
        Text(
            text = if (message.isDeleted) "Сообщение удалено" else message.body.orEmpty(),
            style = MaterialTheme.typography.bodyLarge,
            color = if (own) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
        )
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

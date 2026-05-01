package com.emessenger.app.features.chats

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.emessenger.app.R
import com.emessenger.app.core.design.PulseLineAvatar
import com.emessenger.app.core.design.PulseLineListRow
import com.emessenger.app.core.utils.formatMessageTime
import com.emessenger.app.domain.model.ConversationModel

@Composable
fun ChatListItem(
    chat: ConversationModel,
    onClick: () -> Unit
) {
    val title = chat.title ?: chat.members.joinToString(", ") { it.username }.ifBlank { stringResource(R.string.new_chat) }
    val lastMessage = chat.messages.lastOrNull()
    val subtitle = lastMessage?.body ?: stringResource(R.string.start_chat)

    PulseLineListRow(
        onClick = onClick,
        leading = { PulseLineAvatar(title = title, modifier = Modifier.size(54.dp)) },
        content = {
            Text(text = title, style = MaterialTheme.typography.titleMedium, maxLines = 1)
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1
            )
        },
        trailing = {
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = lastMessage?.createdAt?.let(::formatMessageTime) ?: "—",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.secondary.copy(alpha = if (chat.type == "PRIVATE") 1f else 0.25f))
                )
            }
        }
    )
}

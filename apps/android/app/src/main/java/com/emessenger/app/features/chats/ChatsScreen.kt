package com.emessenger.app.features.chats

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.emessenger.app.R
import com.emessenger.app.core.design.PulseLineEmptyState
import com.emessenger.app.core.design.PulseLineFilledButton
import com.emessenger.app.core.design.PulseLineGradientCard
import com.emessenger.app.core.design.PulseLineOutlinedButton
import com.emessenger.app.core.design.PulseLineSectionCard
import com.emessenger.app.core.design.PulseLineTextField

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatsScreen(
    viewModel: ChatsViewModel = hiltViewModel(),
    onOpenChat: (String) -> Unit,
    onOpenProfile: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uiState.navigateToChatId) {
        uiState.navigateToChatId?.let {
            onOpenChat(it)
            viewModel.consumeNavigation()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(text = stringResource(R.string.app_name), style = MaterialTheme.typography.titleLarge)
                        Text(
                            text = stringResource(R.string.socket_status_connected),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onOpenProfile) { Icon(Icons.Rounded.Person, contentDescription = stringResource(R.string.profile)) }
                    IconButton(onClick = onOpenSettings) { Icon(Icons.Rounded.Settings, contentDescription = stringResource(R.string.settings)) }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = viewModel::toggleCreator) {
                Icon(Icons.Rounded.Add, contentDescription = stringResource(R.string.new_chat))
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                PulseLineGradientCard(modifier = Modifier.fillMaxWidth()) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Icon(Icons.Rounded.Search, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Column {
                            Text(text = stringResource(R.string.chats), style = MaterialTheme.typography.titleMedium)
                            Text(
                                text = stringResource(R.string.search_hint_chats),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                if (uiState.error != null) {
                    Text(text = uiState.error.orEmpty(), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }

                if (uiState.loading && uiState.chats.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(text = stringResource(R.string.loading), color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                } else if (uiState.chats.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        PulseLineEmptyState(
                            title = stringResource(R.string.no_chats),
                            subtitle = stringResource(R.string.select_chat_hint),
                            action = {
                                PulseLineFilledButton(
                                    text = stringResource(R.string.start_chat),
                                    onClick = viewModel::toggleCreator
                                )
                            }
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 96.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.chats, key = { it.id }) { chat ->
                            ChatListItem(chat = chat, onClick = { onOpenChat(chat.id) })
                        }
                    }
                }
            }
        }
    }

    if (uiState.showCreator) {
        ModalBottomSheet(onDismissRequest = viewModel::toggleCreator) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                PulseLineSectionCard(
                    title = stringResource(R.string.create_chat),
                    subtitle = stringResource(R.string.search_users)
                ) {
                    PulseLineTextField(
                        value = uiState.searchQuery,
                        onValueChange = viewModel::updateSearchQuery,
                        label = stringResource(R.string.search_users)
                    )
                    PulseLineFilledButton(
                        text = if (uiState.creating) stringResource(R.string.loading) else stringResource(R.string.search),
                        onClick = viewModel::searchUsers,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !uiState.creating
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        uiState.searchResults.forEach { user ->
                            PulseLineSectionCard(title = user.username, subtitle = user.email ?: user.phone ?: "PulseLine") {
                                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    PulseLineOutlinedButton(
                                        text = stringResource(R.string.create_private_chat),
                                        onClick = { viewModel.createPrivateChat(user.id) },
                                        modifier = Modifier.weight(1f),
                                        enabled = !uiState.creating
                                    )
                                    PulseLineOutlinedButton(
                                        text = if (uiState.selectedUserIds.contains(user.id)) stringResource(R.string.added) else stringResource(R.string.add_to_group),
                                        onClick = { viewModel.toggleSelectedUser(user.id) },
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                        }
                    }
                }
                PulseLineSectionCard(title = stringResource(R.string.new_group), subtitle = stringResource(R.string.group_name)) {
                    PulseLineTextField(
                        value = uiState.groupTitle,
                        onValueChange = viewModel::updateGroupTitle,
                        label = stringResource(R.string.group_name)
                    )
                    PulseLineFilledButton(
                        text = stringResource(R.string.create_group),
                        onClick = viewModel::createGroupChat,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = uiState.groupTitle.isNotBlank() && uiState.selectedUserIds.isNotEmpty() && !uiState.creating
                    )
                }
            }
        }
    }
}

package com.emessenger.app.features.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.emessenger.app.BuildConfig
import com.emessenger.app.R
import com.emessenger.app.core.design.PulseLineAvatar
import com.emessenger.app.core.design.PulseLineFilledButton
import com.emessenger.app.core.design.PulseLineOutlinedButton
import com.emessenger.app.core.design.PulseLineSectionCard
import com.emessenger.app.core.utils.displayNameOrFallback

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun ProfileScreen(
    viewModel: ProfileViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onEdit: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val user = uiState.user
    val displayName = user?.displayNameOrFallback() ?: "Пользователь"

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text(stringResource(R.string.profile)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Rounded.ArrowBack, contentDescription = stringResource(R.string.back))
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            PulseLineSectionCard(title = displayName, subtitle = user?.about ?: "Ваш профиль PulseLine") {
                PulseLineAvatar(title = displayName, modifier = Modifier.padding(vertical = 6.dp))
                Text(text = user?.username ?: "—", style = MaterialTheme.typography.bodyLarge)
                Text(text = user?.fullName ?: "—", style = MaterialTheme.typography.bodyMedium)
                Text(text = user?.email ?: "—", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(text = user?.phone ?: "—", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(text = user?.country ?: "—", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
            }
            PulseLineSectionCard(title = stringResource(R.string.about), subtitle = stringResource(R.string.version_label, BuildConfig.VERSION_NAME)) {
                Text(text = stringResource(R.string.about_placeholder), style = MaterialTheme.typography.bodyMedium)
            }
            if (uiState.error != null) {
                Text(text = uiState.error.orEmpty(), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }
            PulseLineFilledButton(text = stringResource(R.string.edit_profile), onClick = onEdit)
            PulseLineOutlinedButton(text = stringResource(R.string.logout), onClick = { viewModel.logout(onBack) })
        }
    }
}

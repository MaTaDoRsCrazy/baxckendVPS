package com.emessenger.app.features.settings

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.emessenger.app.R
import com.emessenger.app.core.design.PulseLineFilledButton
import com.emessenger.app.core.design.PulseLineOutlinedButton
import com.emessenger.app.core.design.PulseLineSectionCard
import com.emessenger.app.core.permissions.hasPermission
import com.emessenger.app.core.permissions.needsNotificationPermission
import com.emessenger.app.core.utils.PulseLineThemeMode

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun SettingsScreen(
    viewModel: SettingsViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onLogout: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text(stringResource(R.string.settings)) },
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
            PulseLineSectionCard(title = stringResource(R.string.appearance), subtitle = stringResource(R.string.placeholder_feature)) {
                ThemeOption("Системная", uiState.themeMode == PulseLineThemeMode.SYSTEM) { viewModel.setThemeMode(PulseLineThemeMode.SYSTEM) }
                ThemeOption("Светлая", uiState.themeMode == PulseLineThemeMode.LIGHT) { viewModel.setThemeMode(PulseLineThemeMode.LIGHT) }
                ThemeOption("Тёмная", uiState.themeMode == PulseLineThemeMode.DARK) { viewModel.setThemeMode(PulseLineThemeMode.DARK) }
            }
            PulseLineSectionCard(title = stringResource(R.string.notifications), subtitle = stringResource(R.string.permissions_notifications)) {
                ToggleRow("Уведомления о сообщениях", uiState.messageNotifications, viewModel::toggleMessages)
                ToggleRow("Уведомления о звонках", uiState.callNotifications, viewModel::toggleCalls)
                ToggleRow("Звук", uiState.soundEnabled, viewModel::toggleSound)
                if (needsNotificationPermission() && !hasPermission(context, Manifest.permission.POST_NOTIFICATIONS)) {
                    PulseLineFilledButton(
                        text = stringResource(R.string.request_permissions),
                        onClick = { permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
            PulseLineSectionCard(title = stringResource(R.string.privacy), subtitle = stringResource(R.string.placeholder_feature)) {
                Text(text = "Статус последнего входа, подтверждения прочтения и список блокировок будут подключены к backend-расширениям.", style = MaterialTheme.typography.bodyMedium)
            }
            PulseLineSectionCard(title = stringResource(R.string.calls), subtitle = stringResource(R.string.placeholder_feature)) {
                Text(text = "Проверка микрофона, камеры и предпочтительный режим звонков появятся на следующем этапе.", style = MaterialTheme.typography.bodyMedium)
            }
            PulseLineSectionCard(title = stringResource(R.string.devices), subtitle = stringResource(R.string.sessions_placeholder)) {
                Text(text = stringResource(R.string.about_placeholder), style = MaterialTheme.typography.bodyMedium)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                PulseLineOutlinedButton(text = stringResource(R.string.back), onClick = onBack, modifier = Modifier.weight(1f))
                PulseLineFilledButton(
                    text = stringResource(R.string.logout),
                    onClick = { viewModel.logout(onLogout) },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun ToggleRow(label: String, checked: Boolean, onToggle: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(text = label, style = MaterialTheme.typography.bodyLarge)
        Switch(checked = checked, onCheckedChange = { onToggle() })
    }
}

@Composable
private fun ThemeOption(label: String, selected: Boolean, onClick: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
        )
        androidx.compose.material3.RadioButton(selected = selected, onClick = onClick)
    }
}

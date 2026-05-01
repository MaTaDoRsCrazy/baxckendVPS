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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.emessenger.app.R
import com.emessenger.app.core.design.PulseLineFilledButton
import com.emessenger.app.core.design.PulseLineSectionCard
import com.emessenger.app.core.design.PulseLineTextField

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun EditProfileScreen(
    viewModel: ProfileViewModel = hiltViewModel(),
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var username by remember(uiState.user?.username) { mutableStateOf(uiState.user?.username.orEmpty()) }
    var email by remember(uiState.user?.email) { mutableStateOf(uiState.user?.email.orEmpty()) }
    var phone by remember(uiState.user?.phone) { mutableStateOf(uiState.user?.phone.orEmpty()) }

    LaunchedEffect(uiState.saved) {
        if (uiState.saved) {
            viewModel.consumeSaved()
            onBack()
        }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text(stringResource(R.string.edit_profile)) },
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
            PulseLineSectionCard(title = stringResource(R.string.edit_profile), subtitle = stringResource(R.string.bio_placeholder)) {
                PulseLineTextField(value = username, onValueChange = { username = it }, label = stringResource(R.string.username))
                PulseLineTextField(value = email, onValueChange = { email = it }, label = stringResource(R.string.email))
                PulseLineTextField(value = phone, onValueChange = { phone = it }, label = stringResource(R.string.phone))
                uiState.error?.let {
                    Text(text = it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                }
                PulseLineFilledButton(
                    text = if (uiState.saving) stringResource(R.string.loading) else stringResource(R.string.save),
                    onClick = { viewModel.save(username, email, phone) }
                )
            }
        }
    }
}

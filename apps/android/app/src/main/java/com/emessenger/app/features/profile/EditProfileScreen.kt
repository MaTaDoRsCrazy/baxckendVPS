package com.emessenger.app.features.profile

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import com.emessenger.app.core.design.PulseLineOutlinedButton
import com.emessenger.app.core.design.PulseLineSectionCard
import com.emessenger.app.core.design.PulseLineTextField

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun EditProfileScreen(
    viewModel: ProfileViewModel = hiltViewModel(),
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var fullName by remember(uiState.user?.fullName) { mutableStateOf(uiState.user?.fullName.orEmpty()) }
    var username by remember(uiState.user?.username) { mutableStateOf(uiState.user?.username.orEmpty()) }
    var email by remember(uiState.user?.email) { mutableStateOf(uiState.user?.email.orEmpty()) }
    var phone by remember(uiState.user?.phone) { mutableStateOf(uiState.user?.phone.orEmpty()) }
    var about by remember(uiState.user?.about) { mutableStateOf(uiState.user?.about.orEmpty()) }
    var country by remember(uiState.user?.country) { mutableStateOf(uiState.user?.country.orEmpty()) }
    val avatarLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            viewModel.uploadAvatar(uri)
        }
    }

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
            PulseLineSectionCard(title = stringResource(R.string.edit_profile), subtitle = "Имя, контакты, описание и аватар") {
                PulseLineTextField(value = fullName, onValueChange = { fullName = it }, label = "Имя и фамилия")
                PulseLineTextField(value = username, onValueChange = { username = it }, label = stringResource(R.string.username))
                PulseLineTextField(value = email, onValueChange = { email = it }, label = stringResource(R.string.email))
                PulseLineTextField(value = phone, onValueChange = { phone = it }, label = stringResource(R.string.phone))
                PulseLineTextField(value = country, onValueChange = { country = it }, label = "Страна")
                PulseLineTextField(value = about, onValueChange = { about = it }, label = "О себе", singleLine = false)
                uiState.error?.let {
                    Text(text = it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                }
                PulseLineFilledButton(
                    text = if (uiState.saving) stringResource(R.string.loading) else stringResource(R.string.save),
                    onClick = { viewModel.save(fullName, username, email, phone, about, country) }
                )
                PulseLineOutlinedButton(text = "Загрузить аватар", onClick = { avatarLauncher.launch("image/*") })
            }
        }
    }
}

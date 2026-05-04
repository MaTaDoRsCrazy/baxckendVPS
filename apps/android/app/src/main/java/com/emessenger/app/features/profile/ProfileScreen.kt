package com.emessenger.app.features.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AlternateEmail
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.MailOutline
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Public
import androidx.compose.material.icons.rounded.Phone
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.emessenger.app.BuildConfig
import com.emessenger.app.R
import com.emessenger.app.core.design.PulseLineAvatar
import com.emessenger.app.core.design.PulseLineFilledButton
import com.emessenger.app.core.design.PulseLineGradientCard
import com.emessenger.app.core.design.PulseLineOutlinedButton
import com.emessenger.app.core.design.PulseLineSectionCard
import com.emessenger.app.core.utils.displayNameOrFallback
import androidx.compose.ui.Alignment

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun ProfileScreen(
    viewModel: ProfileViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onEdit: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val user = uiState.user
    val displayName = user?.displayNameOrFallback() ?: stringResource(R.string.user_fallback)
    val username = user?.username?.takeIf { it.isNotBlank() }?.let { "@$it" } ?: stringResource(R.string.not_specified)
    val fullName = user?.fullName?.takeIf { it.isNotBlank() } ?: stringResource(R.string.not_specified)
    val email = user?.email?.takeIf { it.isNotBlank() } ?: stringResource(R.string.not_specified)
    val phone = user?.phone?.takeIf { it.isNotBlank() } ?: stringResource(R.string.not_specified)
    val country = user?.country?.takeIf { it.isNotBlank() } ?: stringResource(R.string.not_specified)
    val about = user?.about?.takeIf { it.isNotBlank() }

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
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            PulseLineGradientCard(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(18.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        ProfileHeroAvatar(
                            title = displayName,
                            avatarUrl = user?.avatarUrl,
                            modifier = Modifier.size(92.dp)
                        )
                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(text = displayName, style = MaterialTheme.typography.titleLarge)
                            Text(
                                text = username,
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = about ?: stringResource(R.string.profile_subtitle),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            PulseLineSectionCard(
                title = stringResource(R.string.profile_details_title),
                subtitle = stringResource(R.string.profile_details_subtitle)
            ) {
                ProfileInfoRow(
                    icon = Icons.Rounded.AlternateEmail,
                    label = stringResource(R.string.username),
                    value = username
                )
                ProfileInfoRow(
                    icon = Icons.Rounded.Person,
                    label = stringResource(R.string.full_name),
                    value = fullName
                )
                ProfileInfoRow(
                    icon = Icons.Rounded.MailOutline,
                    label = stringResource(R.string.email),
                    value = email
                )
                ProfileInfoRow(
                    icon = Icons.Rounded.Phone,
                    label = stringResource(R.string.phone),
                    value = phone
                )
                ProfileInfoRow(
                    icon = Icons.Rounded.Public,
                    label = stringResource(R.string.country),
                    value = country
                )
            }

            PulseLineSectionCard(title = stringResource(R.string.about), subtitle = stringResource(R.string.version_label, BuildConfig.VERSION_NAME)) {
                Text(text = stringResource(R.string.about_placeholder), style = MaterialTheme.typography.bodyMedium)
            }
            if (uiState.error != null) {
                Text(text = uiState.error.orEmpty(), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            }
            PulseLineFilledButton(
                text = stringResource(R.string.edit_profile),
                onClick = onEdit,
                modifier = Modifier.fillMaxWidth()
            )
            PulseLineOutlinedButton(
                text = stringResource(R.string.logout),
                onClick = { viewModel.logout(onBack) },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun ProfileHeroAvatar(
    title: String,
    avatarUrl: String?,
    modifier: Modifier = Modifier
) {
    if (!avatarUrl.isNullOrBlank()) {
        AsyncImage(
            model = avatarUrl,
            contentDescription = title,
            modifier = modifier
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surface),
            contentScale = ContentScale.Crop
        )
    } else {
        PulseLineAvatar(title = title, modifier = modifier)
    }
}

@Composable
private fun ProfileInfoRow(
    icon: ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Surface(
            modifier = Modifier.size(42.dp),
            shape = CircleShape,
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Box(contentAlignment = androidx.compose.ui.Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

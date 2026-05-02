package com.emessenger.app.features.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.emessenger.app.R
import com.emessenger.app.core.design.PulseLineFilledButton
import com.emessenger.app.core.design.PulseLineGradientCard
import com.emessenger.app.core.design.PulseLineLogo
import com.emessenger.app.core.design.PulseLineOutlinedButton
import com.emessenger.app.core.design.PulseLineTextField

data class CountryOptionUi(
    val name: String,
    val dialCode: String
)

private val countryOptions = listOf(
    CountryOptionUi("Россия", "+7"),
    CountryOptionUi("Казахстан", "+7"),
    CountryOptionUi("Беларусь", "+375"),
    CountryOptionUi("Украина", "+380"),
    CountryOptionUi("Узбекистан", "+998"),
    CountryOptionUi("Кыргызстан", "+996"),
    CountryOptionUi("Таджикистан", "+992"),
    CountryOptionUi("Армения", "+374"),
    CountryOptionUi("Азербайджан", "+994"),
    CountryOptionUi("Грузия", "+995"),
    CountryOptionUi("Германия", "+49"),
    CountryOptionUi("Польша", "+48"),
    CountryOptionUi("Финляндия", "+358"),
    CountryOptionUi("США", "+1")
)

@Composable
fun RegisterScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onRegistered: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var country by remember { mutableStateOf(countryOptions.first()) }
    var phoneLocal by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var agreementAccepted by remember { mutableStateOf(false) }
    var captchaLeft by remember { mutableIntStateOf(3) }
    var captchaRight by remember { mutableIntStateOf(4) }
    var captchaAnswer by remember { mutableStateOf("") }
    var countryExpanded by remember { mutableStateOf(false) }

    fun resetCaptcha() {
        captchaLeft = (1..9).random()
        captchaRight = (1..9).random()
        captchaAnswer = ""
    }

    LaunchedEffect(Unit) {
        resetCaptcha()
    }

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) {
            onRegistered()
            viewModel.resetState()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.background,
                        MaterialTheme.colorScheme.surfaceVariant,
                        MaterialTheme.colorScheme.secondary.copy(alpha = 0.18f)
                    )
                )
            )
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        PulseLineGradientCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                PulseLineLogo(modifier = Modifier.align(Alignment.CenterHorizontally).size(78.dp))
                Text(text = stringResource(R.string.create_account), style = MaterialTheme.typography.headlineMedium)
                Text(
                    text = "Заполните данные, выберите страну, подтвердите согласие и пройдите простую проверку.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                PulseLineTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = stringResource(R.string.username)
                )
                PulseLineTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = stringResource(R.string.email)
                )
                PulseLineOutlinedButton(
                    text = "${country.name} (${country.dialCode})",
                    onClick = { countryExpanded = true },
                    modifier = Modifier.fillMaxWidth()
                )
                DropdownMenu(expanded = countryExpanded, onDismissRequest = { countryExpanded = false }) {
                    countryOptions.forEach { option ->
                        DropdownMenuItem(
                            text = { Text("${option.name} (${option.dialCode})") },
                            onClick = {
                                country = option
                                countryExpanded = false
                            }
                        )
                    }
                }
                PulseLineTextField(
                    value = "${country.dialCode}$phoneLocal",
                    onValueChange = { value ->
                        phoneLocal = value.removePrefix(country.dialCode).replace(Regex("[^\\d]"), "")
                    },
                    label = stringResource(R.string.phone)
                )
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text(stringResource(R.string.password)) },
                    shape = MaterialTheme.shapes.medium,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done)
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(text = "Сколько будет $captchaLeft + $captchaRight?", modifier = Modifier.weight(1f))
                    PulseLineTextField(
                        value = captchaAnswer,
                        onValueChange = { captchaAnswer = it },
                        label = "Ответ",
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(checked = agreementAccepted, onCheckedChange = { agreementAccepted = it })
                    Text(
                        text = "Согласен с правилами сервиса и обработкой данных.",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                if (uiState is AuthUiState.Error) {
                    Text(
                        text = (uiState as AuthUiState.Error).message,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                    LaunchedEffect(uiState) {
                        resetCaptcha()
                    }
                }
                PulseLineFilledButton(
                    text = if (uiState is AuthUiState.Loading) stringResource(R.string.loading) else stringResource(R.string.register),
                    onClick = {
                        viewModel.register(
                            username = username,
                            email = email,
                            phone = "${country.dialCode}$phoneLocal",
                            password = password,
                            country = country.name,
                            agreementAccepted = agreementAccepted,
                            captchaExpected = captchaLeft + captchaRight,
                            captchaAnswer = captchaAnswer
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = uiState !is AuthUiState.Loading
                )
                PulseLineOutlinedButton(
                    text = stringResource(R.string.go_to_login),
                    onClick = onBack,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

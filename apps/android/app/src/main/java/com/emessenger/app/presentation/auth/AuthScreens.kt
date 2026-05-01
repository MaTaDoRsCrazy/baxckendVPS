package com.emessenger.app.presentation.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.flow.StateFlow

@Composable
fun LoginScreen(
    state: StateFlow<AuthUiState>,
    onLogin: (String, String) -> Unit,
    onRegister: () -> Unit,
    onLoggedIn: () -> Unit
) {
    val uiState = state.collectAsStateLifecycleAware()
    var identifier by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    LaunchedEffect(uiState.success) {
        if (uiState.success) onLoggedIn()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Login", style = MaterialTheme.typography.headlineMedium)
        OutlinedTextField(value = identifier, onValueChange = { identifier = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Email or username") })
        OutlinedTextField(value = password, onValueChange = { password = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Password") })
        uiState.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(onClick = { onLogin(identifier, password) }, modifier = Modifier.fillMaxWidth()) {
            Text(if (uiState.loading) "Loading..." else "Login")
        }
        Button(onClick = onRegister, modifier = Modifier.fillMaxWidth()) {
            Text("Register")
        }
    }
}

@Composable
fun RegisterScreen(
    state: StateFlow<AuthUiState>,
    onRegister: (String, String?, String?, String) -> Unit,
    onBack: () -> Unit,
    onRegistered: () -> Unit
) {
    val uiState = state.collectAsStateLifecycleAware()
    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    LaunchedEffect(uiState.success) {
        if (uiState.success) onRegistered()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Register", style = MaterialTheme.typography.headlineMedium)
        OutlinedTextField(value = username, onValueChange = { username = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Username") })
        OutlinedTextField(value = email, onValueChange = { email = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Email") })
        OutlinedTextField(value = phone, onValueChange = { phone = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Phone") })
        OutlinedTextField(value = password, onValueChange = { password = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Password") })
        uiState.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(onClick = { onRegister(username, email.ifBlank { null }, phone.ifBlank { null }, password) }, modifier = Modifier.fillMaxWidth()) {
            Text(if (uiState.loading) "Loading..." else "Create account")
        }
        Button(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
            Text("Back")
        }
    }
}

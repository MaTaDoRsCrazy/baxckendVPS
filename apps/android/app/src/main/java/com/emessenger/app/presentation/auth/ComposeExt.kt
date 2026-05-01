package com.emessenger.app.presentation.auth

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import kotlinx.coroutines.flow.StateFlow

@Composable
fun <T> StateFlow<T>.collectAsStateLifecycleAware(): T = collectAsState().value

package com.emessenger.app

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.emessenger.app.core.design.PulseLineTheme
import com.emessenger.app.core.navigation.PulseLineNavHost
import com.emessenger.app.core.navigation.RootViewModel
import com.emessenger.app.core.utils.PulseLineThemeMode

@Composable
fun PulseLineApp() {
    val rootViewModel: RootViewModel = hiltViewModel()
    val themeMode by rootViewModel.themeMode.collectAsStateWithLifecycle()

    PulseLineTheme(
        darkTheme = when (themeMode) {
            PulseLineThemeMode.DARK -> true
            PulseLineThemeMode.LIGHT -> false
            PulseLineThemeMode.SYSTEM -> androidx.compose.foundation.isSystemInDarkTheme()
        }
    ) {
        PulseLineNavHost(rootViewModel = rootViewModel)
    }
}

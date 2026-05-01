package com.emessenger.app.presentation.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emessenger.app.domain.model.AuthSessionModel
import com.emessenger.app.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    private val _session = MutableStateFlow<AuthSessionModel?>(null)
    val session: StateFlow<AuthSessionModel?> = _session

    init {
        viewModelScope.launch {
            authRepository.session.collect { _session.value = it }
        }
    }
}

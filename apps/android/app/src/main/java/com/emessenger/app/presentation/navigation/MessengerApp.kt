package com.emessenger.app.presentation.navigation

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.emessenger.app.presentation.auth.AuthViewModel
import com.emessenger.app.presentation.auth.LoginScreen
import com.emessenger.app.presentation.auth.RegisterScreen
import com.emessenger.app.presentation.call.CallScreen
import com.emessenger.app.presentation.call.CallViewModel
import com.emessenger.app.presentation.call.IncomingCallScreen
import com.emessenger.app.presentation.chat.ChatScreen
import com.emessenger.app.presentation.chat.ChatViewModel
import com.emessenger.app.presentation.chats.ChatsScreen
import com.emessenger.app.presentation.chats.ChatsViewModel
import com.emessenger.app.presentation.profile.ProfileScreen
import com.emessenger.app.presentation.settings.SettingsScreen
import com.emessenger.app.presentation.splash.SplashScreen
import com.emessenger.app.presentation.splash.SplashViewModel

@Composable
fun MessengerApp() {
    val navController = rememberNavController()

    MaterialTheme {
        NavHost(navController = navController, startDestination = NavRoutes.Splash.route) {
            composable(NavRoutes.Splash.route) {
                val viewModel: SplashViewModel = hiltViewModel()
                SplashScreen(
                    session = viewModel.session,
                    onAuthed = { navController.navigate(NavRoutes.Chats.route) { popUpTo(0) } },
                    onUnauthed = { navController.navigate(NavRoutes.Login.route) { popUpTo(0) } }
                )
            }
            composable(NavRoutes.Login.route) {
                val viewModel: AuthViewModel = hiltViewModel()
                LoginScreen(
                    state = viewModel.state,
                    onLogin = viewModel::login,
                    onRegister = { navController.navigate(NavRoutes.Register.route) },
                    onLoggedIn = { navController.navigate(NavRoutes.Chats.route) { popUpTo(0) } }
                )
            }
            composable(NavRoutes.Register.route) {
                val viewModel: AuthViewModel = hiltViewModel()
                RegisterScreen(
                    state = viewModel.state,
                    onRegister = viewModel::register,
                    onBack = { navController.popBackStack() },
                    onRegistered = { navController.navigate(NavRoutes.Chats.route) { popUpTo(0) } }
                )
            }
            composable(NavRoutes.Chats.route) {
                val viewModel: ChatsViewModel = hiltViewModel()
                ChatsScreen(
                    state = viewModel.state,
                    onRefresh = viewModel::refresh,
                    onOpenChat = { navController.navigate(NavRoutes.Chat.create(it)) },
                    onProfile = { navController.navigate(NavRoutes.Profile.route) },
                    onSettings = { navController.navigate(NavRoutes.Settings.route) }
                )
            }
            composable(
                route = NavRoutes.Chat.route,
                arguments = listOf(navArgument("chatId") { type = NavType.StringType })
            ) { backStackEntry ->
                val chatId = backStackEntry.arguments?.getString("chatId").orEmpty()
                val viewModel: ChatViewModel = hiltViewModel()
                ChatScreen(
                    chatId = chatId,
                    state = viewModel.state,
                    onLoad = { viewModel.load(chatId) },
                    onBack = { navController.popBackStack() },
                    onSendMessage = { viewModel.sendMessage(chatId, it) },
                    onAudioCall = { viewModel.startAudioCall(chatId) },
                    onVideoCall = { viewModel.startVideoCall(chatId) },
                    onCallStarted = { callId -> navController.navigate(NavRoutes.Call.create(callId)) }
                )
            }
            composable(NavRoutes.Profile.route) {
                ProfileScreen(onBack = { navController.popBackStack() })
            }
            composable(NavRoutes.Settings.route) {
                SettingsScreen(onBack = { navController.popBackStack() })
            }
            composable(NavRoutes.IncomingCall.route) {
                val viewModel: CallViewModel = hiltViewModel()
                IncomingCallScreen(
                    state = viewModel.state,
                    onAccept = { viewModel.acceptIncoming(); viewModel.currentCallId?.let { navController.navigate(NavRoutes.Call.create(it)) } },
                    onReject = viewModel::rejectIncoming
                )
            }
            composable(
                route = NavRoutes.Call.route,
                arguments = listOf(navArgument("callId") { type = NavType.StringType })
            ) { backStackEntry ->
                val callId = backStackEntry.arguments?.getString("callId").orEmpty()
                val viewModel: CallViewModel = hiltViewModel()
                CallScreen(
                    callId = callId,
                    state = viewModel.state,
                    onLoad = { viewModel.connect(callId) },
                    onEnd = {
                        viewModel.endCall(callId)
                        navController.popBackStack()
                    }
                )
            }
        }
    }
}

package com.emessenger.app.core.navigation

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.emessenger.app.features.auth.AuthViewModel
import com.emessenger.app.features.auth.LoginScreen
import com.emessenger.app.features.auth.RegisterScreen
import com.emessenger.app.features.calls.CallScreen
import com.emessenger.app.features.calls.CallViewModel
import com.emessenger.app.features.calls.IncomingCallScreen
import com.emessenger.app.features.chat.ChatInfoScreen
import com.emessenger.app.features.chat.ChatScreen
import com.emessenger.app.features.chat.ChatViewModel
import com.emessenger.app.features.chats.ChatsScreen
import com.emessenger.app.features.chats.ChatsViewModel
import com.emessenger.app.features.profile.EditProfileScreen
import com.emessenger.app.features.profile.ProfileScreen
import com.emessenger.app.features.profile.ProfileViewModel
import com.emessenger.app.features.settings.SettingsScreen
import com.emessenger.app.features.settings.SettingsViewModel
import com.emessenger.app.features.splash.SplashScreen

sealed class PulseLineRoute(val route: String) {
    data object Splash : PulseLineRoute("splash")
    data object Login : PulseLineRoute("login")
    data object Register : PulseLineRoute("register")
    data object Chats : PulseLineRoute("chats")
    data object Profile : PulseLineRoute("profile")
    data object EditProfile : PulseLineRoute("profile/edit")
    data object Settings : PulseLineRoute("settings")
    data object IncomingCall : PulseLineRoute("call/incoming")
    data object Chat : PulseLineRoute("chats/{chatId}") {
        fun create(chatId: String) = "chats/$chatId"
    }
    data object ChatInfo : PulseLineRoute("chats/{chatId}/info") {
        fun create(chatId: String) = "chats/$chatId/info"
    }
    data object Call : PulseLineRoute("call/{callId}") {
        fun create(callId: String) = "call/$callId"
    }
}

@Composable
fun PulseLineNavHost(rootViewModel: RootViewModel) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = PulseLineRoute.Splash.route) {
        composable(PulseLineRoute.Splash.route) {
            SplashScreen(
                sessionFlow = rootViewModel.session,
                onAuthed = { navController.navigate(PulseLineRoute.Chats.route) { popUpTo(0) } },
                onUnauthed = { navController.navigate(PulseLineRoute.Login.route) { popUpTo(0) } }
            )
        }
        composable(PulseLineRoute.Login.route) {
            val viewModel: AuthViewModel = hiltViewModel()
            LoginScreen(
                viewModel = viewModel,
                onOpenRegister = { navController.navigate(PulseLineRoute.Register.route) },
                onLoggedIn = { navController.navigate(PulseLineRoute.Chats.route) { popUpTo(0) } }
            )
        }
        composable(PulseLineRoute.Register.route) {
            val viewModel: AuthViewModel = hiltViewModel()
            RegisterScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onRegistered = { navController.navigate(PulseLineRoute.Chats.route) { popUpTo(0) } }
            )
        }
        composable(PulseLineRoute.Chats.route) {
            val viewModel: ChatsViewModel = hiltViewModel()
            ChatsScreen(
                viewModel = viewModel,
                onOpenChat = { navController.navigate(PulseLineRoute.Chat.create(it)) },
                onOpenProfile = { navController.navigate(PulseLineRoute.Profile.route) },
                onOpenSettings = { navController.navigate(PulseLineRoute.Settings.route) }
            )
        }
        composable(
            route = PulseLineRoute.Chat.route,
            arguments = listOf(navArgument("chatId") { type = NavType.StringType })
        ) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getString("chatId").orEmpty()
            val viewModel: ChatViewModel = hiltViewModel()
            ChatScreen(
                chatId = chatId,
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onOpenInfo = { navController.navigate(PulseLineRoute.ChatInfo.create(chatId)) },
                onOpenCall = { callId -> navController.navigate(PulseLineRoute.Call.create(callId)) }
            )
        }
        composable(
            route = PulseLineRoute.ChatInfo.route,
            arguments = listOf(navArgument("chatId") { type = NavType.StringType })
        ) { backStackEntry ->
            val chatId = backStackEntry.arguments?.getString("chatId").orEmpty()
            val viewModel: ChatViewModel = hiltViewModel()
            ChatInfoScreen(chatId = chatId, viewModel = viewModel, onBack = { navController.popBackStack() })
        }
        composable(PulseLineRoute.Profile.route) {
            val viewModel: ProfileViewModel = hiltViewModel()
            ProfileScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onEdit = { navController.navigate(PulseLineRoute.EditProfile.route) }
            )
        }
        composable(PulseLineRoute.EditProfile.route) {
            val viewModel: ProfileViewModel = hiltViewModel()
            EditProfileScreen(viewModel = viewModel, onBack = { navController.popBackStack() })
        }
        composable(PulseLineRoute.Settings.route) {
            val viewModel: SettingsViewModel = hiltViewModel()
            SettingsScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate(PulseLineRoute.Login.route) { popUpTo(0) }
                }
            )
        }
        composable(PulseLineRoute.IncomingCall.route) {
            val viewModel: CallViewModel = hiltViewModel()
            IncomingCallScreen(
                viewModel = viewModel,
                onAccept = { callId -> navController.navigate(PulseLineRoute.Call.create(callId)) },
                onReject = { navController.popBackStack() }
            )
        }
        composable(
            route = PulseLineRoute.Call.route,
            arguments = listOf(navArgument("callId") { type = NavType.StringType })
        ) { backStackEntry ->
            val callId = backStackEntry.arguments?.getString("callId").orEmpty()
            val viewModel: CallViewModel = hiltViewModel()
            CallScreen(
                callId = callId,
                viewModel = viewModel,
                onBack = { navController.popBackStack() }
            )
        }
    }
}

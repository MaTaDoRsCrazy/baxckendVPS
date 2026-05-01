package com.emessenger.app.presentation.navigation

sealed class NavRoutes(val route: String) {
    data object Splash : NavRoutes("splash")
    data object Login : NavRoutes("login")
    data object Register : NavRoutes("register")
    data object Chats : NavRoutes("chats")
    data object Chat : NavRoutes("chat/{chatId}") {
        fun create(chatId: String) = "chat/$chatId"
    }
    data object Profile : NavRoutes("profile")
    data object Settings : NavRoutes("settings")
    data object IncomingCall : NavRoutes("incoming-call")
    data object Call : NavRoutes("call/{callId}") {
        fun create(callId: String) = "call/$callId"
    }
}

package com.emessenger.app.core.network

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MessengerFirebaseService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        Log.d("MessengerFCM", "New FCM token: $token")
    }

    override fun onMessageReceived(message: RemoteMessage) {
        Log.d("MessengerFCM", "Push payload: ${message.data}")
    }
}

package com.emessenger.app.core.network

import com.emessenger.app.core.datastore.SessionStore
import javax.inject.Inject
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor @Inject constructor(
    private val sessionStore: SessionStore
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val session = runBlocking { sessionStore.session.first() }
        val request = chain.request().newBuilder().apply {
            session?.accessToken?.let { token ->
                header("Authorization", "Bearer $token")
            }
        }.build()

        return chain.proceed(request)
    }
}

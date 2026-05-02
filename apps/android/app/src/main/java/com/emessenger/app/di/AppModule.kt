package com.emessenger.app.di

import android.content.Context
import androidx.room.Room
import com.emessenger.app.BuildConfig
import com.emessenger.app.core.database.MessengerDatabase
import com.emessenger.app.core.network.AuthInterceptor
import com.emessenger.app.core.network.MessengerApi
import com.emessenger.app.data.local.MessageDao
import com.emessenger.app.data.repository.AuthRepositoryImpl
import com.emessenger.app.data.repository.CallRepositoryImpl
import com.emessenger.app.data.repository.ChatRepositoryImpl
import com.emessenger.app.domain.repository.AuthRepository
import com.emessenger.app.domain.repository.CallRepository
import com.emessenger.app.domain.repository.ChatRepository
import com.squareup.moshi.Moshi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.converter.moshi.MoshiConverterFactory

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideMoshi(): Moshi = Moshi.Builder().build()

    @Provides
    @Singleton
    fun provideOkHttp(authInterceptor: AuthInterceptor): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            })
            .build()

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, moshi: Moshi): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()

    @Provides
    @Singleton
    fun provideApi(retrofit: Retrofit): MessengerApi = retrofit.create(MessengerApi::class.java)
}

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): MessengerDatabase =
        Room.databaseBuilder(context, MessengerDatabase::class.java, "emessenger.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides
    fun provideMessageDao(database: MessengerDatabase): MessageDao = database.messageDao()
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    abstract fun bindChatRepository(impl: ChatRepositoryImpl): ChatRepository

    @Binds
    abstract fun bindCallRepository(impl: CallRepositoryImpl): CallRepository
}

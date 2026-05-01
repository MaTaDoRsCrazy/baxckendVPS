# eMessenger Android

## Open in Android Studio

1. Open Android Studio
2. Choose `Open`
3. Select the folder `apps/android`
4. Let Gradle sync complete

## Where to set API base URL

Edit [app/build.gradle.kts](/c:/Users/firem/Desktop/hostMESSENGER/emessenger/apps/android/app/build.gradle.kts):

- `BuildConfig.API_BASE_URL`
- `BuildConfig.SOCKET_URL`

For example:

```kotlin
buildConfigField("String", "API_BASE_URL", "\"https://api.example.com/\"")
buildConfigField("String", "SOCKET_URL", "\"https://api.example.com\"")
```

## Required permissions

- `INTERNET`
- `RECORD_AUDIO`
- `CAMERA`
- `POST_NOTIFICATIONS`
- `FOREGROUND_SERVICE`

They are already declared in `AndroidManifest.xml`.

## Auth flow

1. Login/register uses backend REST API
2. Access and refresh tokens are stored in DataStore
3. `AuthInterceptor` adds `Authorization: Bearer ...`
4. Splash decides whether to open auth screens or chats

## WebSocket flow

`SocketManager` is prepared for Socket.IO:

- connect with JWT access token
- emit message/call/typing events
- receive realtime events from backend

The skeleton is ready for wiring event callbacks into ViewModels.

## LiveKit call flow

1. Android starts or accepts a call through backend endpoints
2. Android requests `POST /api/calls/:callId/token`
3. Backend returns:
   - `url`
   - `token`
   - `roomName`
4. `LiveKitController` connects with that temporary token

`LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` must never be added to Android.

## Notes

- Package name: `com.emessenger.app`
- Architecture: Compose + MVVM + Clean-ish layering + Hilt
- Local message cache: Room
- Token storage: DataStore
- Push structure: Firebase Messaging service stub added

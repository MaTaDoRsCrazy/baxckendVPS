# PulseLine Android

PulseLine — мобильный клиент EMESSENGER для Android на Kotlin + Jetpack Compose. Интерфейс русифицирован, сборка подтверждена через Gradle wrapper.

## Как открыть проект

1. Откройте Android Studio.
2. Выберите `Open`.
3. Укажите папку `apps/android`.
4. Дождитесь `Gradle Sync`.

## Как собрать APK

В Android Studio:

1. `Build`
2. `Build APK(s)`

В терминале:

```bash
cd apps/android
gradlew.bat assembleDebug
```

Готовый APK:

- `app/build/outputs/apk/debug/app-debug.apk`

## Где менять API_BASE_URL

Файл:

- [app/build.gradle.kts](/c:/Users/firem/Desktop/hostMESSENGER/emessenger/apps/android/app/build.gradle.kts)

Поля:

```kotlin
buildConfigField("String", "API_BASE_URL", "\"http://139.28.222.148/\"")
buildConfigField("String", "SOCKET_URL", "\"http://139.28.222.148\"")
```

Позже можно заменить на HTTPS-домен, например:

```kotlin
buildConfigField("String", "API_BASE_URL", "\"https://api.example.com/\"")
buildConfigField("String", "SOCKET_URL", "\"https://api.example.com\"")
```

## Permissions

В проекте уже используются:

- `INTERNET`
- `RECORD_AUDIO`
- `CAMERA`
- `POST_NOTIFICATIONS`
- `FOREGROUND_SERVICE`

Runtime flow уже подготовлен для:

- микрофона
- камеры
- уведомлений на Android 13+

## Auth flow

1. Пользователь выполняет вход или регистрацию через backend.
2. `accessToken` и `refreshToken` сохраняются в DataStore.
3. `SplashScreen` проверяет сессию и отправляет пользователя либо в auth flow, либо в список чатов.
4. `AuthInterceptor` автоматически подставляет `Authorization: Bearer ...` в REST-запросы.

## WebSocket / Socket.IO

- После появления активной сессии Android подключает `SocketManager`.
- JWT access token передаётся в `auth.token`.
- Подготовлены realtime-основы для `message:new`, `typing:*`, `user:*`, `call:*`.
- В текущем MVP часть входящих realtime-сценариев остаётся skeleton/placeholder и может быть дорасширена без смены архитектуры.

## LiveKit call flow

1. Android стартует или принимает звонок через backend.
2. Android запрашивает `POST /api/calls/:callId/token`.
3. Backend возвращает:
   - `url`
   - `token`
   - `roomName`
4. `LiveKitController` подключается к комнате через временный токен.

Никогда не добавляйте в Android:

- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

## Что уже работает

- сборка через `gradlew.bat assembleDebug`
- PulseLine branding
- splash screen
- login/register
- список чатов
- экран диалога
- отправка сообщений
- старт звонка
- получение LiveKit token через backend
- profile/settings screens
- Room/DataStore/Hilt/Retrofit/Socket.IO foundation

## Что пока placeholder

- полноценный remote video renderer
- продвинутые swipe actions
- расширенные privacy/devices sections
- полная входящая call overlay логика от realtime-событий

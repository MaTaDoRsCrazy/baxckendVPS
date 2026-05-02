# PulseLine Android

Android-клиент eMessenger на Kotlin + Jetpack Compose + Hilt + Room + DataStore + Retrofit + Socket.IO + LiveKit.

## Базовая конфигурация

Файл:

- `app/build.gradle.kts`

Для текущего backend:

```kotlin
buildConfigField("String", "API_BASE_URL", "\"http://139.28.222.148/\"")
buildConfigField("String", "SOCKET_URL", "\"http://139.28.222.148\"")
```

Для debug/test сборки HTTP разрешён через:

- `android:usesCleartextTraffic="true"`
- `android:networkSecurityConfig="@xml/network_security_config"`

## Что умеет клиент

- логин и регистрация
- профиль и редактирование профиля
- загрузка аватара
- список чатов
- отправка текста
- отправка изображения и файла
- запись и отправка голосовых сообщений
- аудио/видеозвонки через backend token flow и LiveKit

## Как собрать APK

```bash
cd apps/android
gradlew.bat assembleDebug
```

APK:

- `app/build/outputs/apk/debug/app-debug.apk`

## Что важно по безопасности

- `LIVEKIT_API_SECRET` нельзя добавлять в Android код
- Android получает только временный токен через backend
- приложение не должно подключаться напрямую к базе данных

## Smoke test

1. Зарегистрироваться.
2. Войти по `email` или `username`.
3. Обновить профиль.
4. Загрузить аватар.
5. Отправить текст.
6. Отправить изображение или файл.
7. Отправить голосовое сообщение.
8. Запустить аудиозвонок.
9. Запустить видеозвонок.

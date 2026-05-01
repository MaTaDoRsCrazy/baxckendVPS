# PulseLine Android UI

## Концепция

PulseLine — современный mobile messenger UI с Telegram-inspired UX, но без копирования бренда, логотипов и ассетов Telegram. Основной визуальный язык:

- глубокий синий
- фиолетово-синий акцент
- cyan highlight
- rounded premium surfaces
- быстрый и чистый Compose UI

## Экраны

- `SplashScreen`
- `LoginScreen`
- `RegisterScreen`
- `ChatsScreen`
- `ChatScreen`
- `ChatInfoScreen`
- `ProfileScreen`
- `EditProfileScreen`
- `SettingsScreen`
- `IncomingCallScreen`
- `CallScreen`

## Что уже реализовано

- PulseLine branding
- новый splash с анимацией
- русифицированный auth flow
- обновлённый список чатов
- новый экран диалога с bubble UI
- профиль и редактирование профиля
- экран настроек с темой и permission flow
- аудио/видео call UI поверх backend + LiveKit token flow
- сборка через Gradle wrapper подтверждена

## Что пока placeholder

- full remote video rendering в Compose
- advanced reply / attachment / emoji workflows
- swipe actions и pinned chat logic
- полное realtime-отображение incoming call overlay из Socket.IO
- расширенные privacy / devices controls

## Проверка APK

```bash
cd apps/android
gradlew.bat assembleDebug
```

APK:

- `apps/android/app/build/outputs/apk/debug/app-debug.apk`

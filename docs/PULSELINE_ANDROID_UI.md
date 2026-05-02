# PulseLine Android UI

## Экранная модель

Приложение покрывает:

- `LoginScreen`
- `RegisterScreen`
- `ChatsScreen`
- `ChatScreen`
- `ProfileScreen`
- `EditProfileScreen`
- `IncomingCallScreen`
- `CallScreen`

## Что обновлено

- единый display name fallback без `null`, `undefined` и `null null`
- avatar fallback с инициалами или `PL`
- регистрация на русском языке
- выбор страны и ввод телефона с кодом страны
- подтверждение соглашения и простая captcha
- профиль с редактированием `fullName`, `username`, `email`, `phone`, `about`, `country`
- загрузка аватара
- вложения в сообщениях: изображение, файл, голос
- запись голосовых через `MediaRecorder`
- воспроизведение voice bubble
- кнопки аудио/видеозвонка, mute и camera toggle

## Permissions

Используются:

- `INTERNET`
- `RECORD_AUDIO`
- `CAMERA`
- `POST_NOTIFICATIONS`

Для debug/test сборки разрешён HTTP cleartext к `139.28.222.148`.

## Ограничения текущего UI

- remote video остаётся базовым и зависит от устройства/разрешений
- полноценный foreground calling UX ещё можно доработать
- входящий звонок через Socket.IO реализован на уровне flow, но не как системный telecom экран

## Сборка

```bash
cd apps/android
gradlew.bat assembleDebug
```

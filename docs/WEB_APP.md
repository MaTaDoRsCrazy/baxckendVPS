# Web App PulseLine

## Назначение

Web-клиент PulseLine работает поверх backend API и Socket.IO. Секреты LiveKit в frontend не хранятся.

## Конфигурация

Используются:

- `VITE_API_URL=/api`
- `VITE_SOCKET_URL=/`

LiveKit URL и token web получает только от backend через `POST /api/calls/:callId/token`.

## Основные сценарии

- логин по `email` или `username`
- регистрация с `username`, `email`, `password`, выбором страны, телефоном, согласием и captcha
- редактирование профиля на русском языке
- загрузка аватара
- создание чатов
- отправка `TEXT`, `IMAGE`, `FILE`, `VOICE`
- воспроизведение голосовых сообщений
- входящие и исходящие аудио/видеозвонки

## Ошибки и локализация

Web-клиент показывает русские сообщения об ошибках и больше не сваливается в общий текст вроде "что-то не так" без попытки расшифровки.

## Upload flow

1. Файл загружается через `POST /api/uploads`.
2. Backend возвращает:

```json
{
  "url": "/uploads/...",
  "mimeType": "image/webp",
  "size": 12345,
  "originalName": "photo.webp"
}
```

3. После этого web отправляет `POST /api/messages` с типом:

- `IMAGE` для изображений
- `FILE` для файлов
- `VOICE` для голосовых сообщений

## Профиль

Поддерживаются поля:

- `fullName`
- `username`
- `email`
- `phone`
- `about`
- `avatarUrl`
- `country`

Display name в UI строится так:

- `fullName`
- `username`
- `email`
- `phone`
- `"Пользователь"`

Если аватара нет, показываются инициалы или `PL`.

## LiveKit flow

1. Web вызывает `POST /api/calls/start`.
2. Backend создаёт звонок и участников.
3. Web вызывает `POST /api/calls/:callId/token`.
4. Backend возвращает:

```json
{
  "url": "wss://your-project.livekit.cloud",
  "token": "temporary-token",
  "roomName": "call_<callId>"
}
```

5. Web подключается к LiveKit по этим данным.

## Smoke test

1. Зарегистрируйте пользователя.
2. Выйдите и войдите снова по `username`.
3. Перейдите в `/chats`.
4. Обновите профиль.
5. Загрузите аватар.
6. Отправьте текст.
7. Отправьте изображение.
8. Отправьте файл.
9. Отправьте голосовое сообщение.
10. Проверьте аудио- и видеозвонок.

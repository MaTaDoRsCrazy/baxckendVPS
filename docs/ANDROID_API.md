# Android API Contract

## Auth

Android использует:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Логин работает по `email` или `username`.

Регистрация отправляет:

```json
{
  "username": "alex",
  "email": "alex@example.com",
  "phone": "+79990000000",
  "password": "secret123",
  "country": "Россия"
}
```

## Users

- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/users/me/avatar`
- `GET /api/users/search?q=alex`

`PATCH /api/users/me` поддерживает:

- `fullName`
- `username`
- `email`
- `phone`
- `about`
- `country`
- `avatarUrl`

## Uploads

- `POST /api/uploads`

Требования:

- `multipart/form-data`
- нужен JWT
- лимит `15 MB`

Разрешённые mime types:

- `image/jpeg`
- `image/png`
- `image/webp`
- `audio/webm`
- `audio/mpeg`
- `audio/mp4`
- `application/pdf`
- базовые `text/*` и `application/octet-stream`

Ответ:

```json
{
  "url": "/uploads/file-name.webp",
  "mimeType": "image/webp",
  "size": 12345,
  "originalName": "avatar.webp"
}
```

## Messages

- `POST /api/messages`
- `PATCH /api/messages/:messageId`
- `DELETE /api/messages/:messageId`
- `POST /api/messages/:messageId/read`

Message поддерживает типы:

- `TEXT`
- `IMAGE`
- `FILE`
- `VOICE`

Дополнительные поля вложения:

- `attachmentUrl`
- `attachmentName`
- `attachmentMimeType`
- `attachmentSize`

## Calls

- `POST /api/calls/start`
- `POST /api/calls/:callId/token`
- `POST /api/calls/:callId/accept`
- `POST /api/calls/:callId/reject`
- `POST /api/calls/:callId/end`
- `GET /api/calls/history`

`POST /api/calls/start`:

```json
{
  "conversationId": "conv_123",
  "type": "AUDIO"
}
```

`POST /api/calls/:callId/token`:

```json
{
  "url": "wss://your-project.livekit.cloud",
  "token": "temporary-token",
  "roomName": "call_<callId>"
}
```

Если раньше на Android появлялось `401 Could not fetch region settings`, теперь токен и URL должны приходить только через backend token flow.

## Socket.IO

Подключение:

```json
{
  "auth": {
    "token": "ACCESS_TOKEN"
  }
}
```

События:

- `message:new`
- `message:updated`
- `message:deleted`
- `message:read`
- `typing:start`
- `typing:stop`
- `call:incoming`
- `call:accepted`
- `call:rejected`
- `call:ended`

## Что хранится на Android

- `accessToken`
- `refreshToken`
- текущий пользователь
- локальный кэш сообщений Room
- UI state

На Android нельзя хранить:

- `LIVEKIT_API_SECRET`
- прямые доступы к PostgreSQL

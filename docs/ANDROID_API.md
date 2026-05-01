# Android API Contract

## 1. Auth flow

1. Android отправляет `POST /api/auth/register` или `POST /api/auth/login`.
2. Backend возвращает `accessToken`, `refreshToken` и `user`.
3. Android сохраняет:
   - `accessToken`
   - `refreshToken`
   - профиль текущего пользователя
4. Во все REST-запросы и Socket.IO auth добавляется `Authorization: Bearer <accessToken>`.
5. При истечении access token приложение вызывает `POST /api/auth/refresh`.
6. При выходе выполняется `POST /api/auth/logout`.

## 2. REST endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Users

- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/users/search?q=alice`

### Chats

- `GET /api/chats`
- `POST /api/chats/private`
- `POST /api/chats/group`
- `GET /api/chats/:chatId`
- `GET /api/chats/:chatId/messages`

### Messages

- `POST /api/messages`
- `PATCH /api/messages/:messageId`
- `DELETE /api/messages/:messageId`
- `POST /api/messages/:messageId/read`

### Calls

- `POST /api/calls/start`
- `POST /api/calls/:callId/accept`
- `POST /api/calls/:callId/reject`
- `POST /api/calls/:callId/end`
- `POST /api/calls/:callId/token`
- `GET /api/calls/history`

## 3. Socket.IO

Endpoint:

- `ws(s)://HOST/socket.io/`

Подключение с JWT:

```json
{
  "auth": {
    "token": "ACCESS_TOKEN"
  }
}
```

### Client -> Server

- `message:send`
- `message:read`
- `typing:start`
- `typing:stop`
- `call:start`
- `call:accept`
- `call:reject`
- `call:end`

### Server -> Client

- `message:new`
- `message:updated`
- `message:deleted`
- `message:read`
- `typing:start`
- `typing:stop`
- `user:online`
- `user:offline`
- `call:incoming`
- `call:accepted`
- `call:rejected`
- `call:ended`

## 4. LiveKit call flow

1. Android стартует или получает звонок через REST / Socket.IO.
2. Backend создаёт `Call` и `CallParticipant`.
3. Android вызывает `POST /api/calls/:callId/token`.
4. Backend проверяет:
   - access token валиден
   - пользователь участвует в звонке
5. Backend возвращает:

```json
{
  "url": "wss://your-project.livekit.cloud",
  "token": "LIVEKIT_JOIN_TOKEN",
  "roomName": "conv_xxx_call_xxx"
}
```

6. Android подключается к LiveKit Cloud только по возвращённым `url` и `token`.

Никогда не хранить на Android:

- `LIVEKIT_API_SECRET`
- прямые PostgreSQL credentials

## 5. Что хранит Android

- `accessToken`
- `refreshToken`
- текущего пользователя
- локальный кэш сообщений
- тему приложения
- метаданные активного звонка при необходимости

## 6. Важное ограничение

Android никогда не подключается напрямую к PostgreSQL. Все пользователи, чаты, сообщения, сессии и звонки идут только через backend API и Socket.IO gateway.

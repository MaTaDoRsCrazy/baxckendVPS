# Android API Contract

## 1. Auth flow

1. Android sends `POST /api/auth/register` or `POST /api/auth/login`
2. Backend returns `accessToken`, `refreshToken`, and `user`
3. Android stores:
   - `accessToken`
   - `refreshToken`
   - current user profile
4. Android sends `Authorization: Bearer <accessToken>` on REST and Socket.IO auth
5. When access token expires, Android calls `POST /api/auth/refresh`
6. On logout, Android calls `POST /api/auth/logout`

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

## 3. WebSocket connection

Socket.IO endpoint:

- `ws(s)://HOST/socket.io/`

Android should connect with JWT access token:

```json
{
  "auth": {
    "token": "ACCESS_TOKEN"
  }
}
```

## 4. WebSocket events

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

## 5. LiveKit call flow

1. Android starts or receives a call via REST or Socket.IO
2. Backend creates a `Call` row and `CallParticipant` rows
3. Android calls `POST /api/calls/:callId/token`
4. Backend verifies:
   - access token is valid
   - user belongs to the call
5. Backend returns:

```json
{
  "url": "wss://your-project.livekit.cloud",
  "token": "LIVEKIT_JOIN_TOKEN",
  "roomName": "conv_xxx_call_xxx"
}
```

6. Android joins LiveKit Cloud with returned `url` and `token`
7. Android never stores or receives `LIVEKIT_API_SECRET`

## 6. Data Android should store

- `accessToken`
- `refreshToken`
- current user profile
- chat list cache
- message cache per chat
- last known call metadata if resuming UI

Do not store:

- `LIVEKIT_API_SECRET`
- direct PostgreSQL credentials

## 7. Call token request example

Request:

```http
POST /api/calls/{callId}/token
Authorization: Bearer ACCESS_TOKEN
```

Response:

```json
{
  "url": "wss://your-project.livekit.cloud",
  "token": "eyJhbGciOi...",
  "roomName": "conv_123_call_456"
}
```

## 8. Backend ownership

Android must never connect directly to PostgreSQL. All user, chat, message, session, and call state flows through the backend API and Socket.IO gateway.

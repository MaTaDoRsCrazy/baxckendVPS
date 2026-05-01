# Web App

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Socket.IO Client
- LiveKit Client SDK

## Routes

- `/login`
- `/register`
- `/chats`
- `/chats/:chatId`
- `/profile`
- `/settings`
- `/call/:callId`

## Runtime config

- `VITE_API_URL=/api`
- `VITE_SOCKET_URL=/`

LiveKit URL is not stored in frontend env. The web app requests it from:

- `POST /api/calls/:callId/token`

Response:

```json
{
  "url": "wss://your-project.livekit.cloud",
  "token": "temporary-join-token",
  "roomName": "conv_x_call_y"
}
```

## Features in this MVP

- register/login/logout
- local auth storage for access/refresh token
- chat list and chat view
- private and group chat creation
- message send
- realtime message updates via Socket.IO
- typing indicator
- read status sync
- online/offline presence
- incoming call banner
- audio/video call entry with LiveKit temporary token

## Security

- `LIVEKIT_API_SECRET` never appears in web source or env
- browser uses only the temporary token returned by backend

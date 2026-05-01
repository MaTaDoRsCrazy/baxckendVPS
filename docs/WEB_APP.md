# Web App PulseLine

## Стек

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Socket.IO Client
- LiveKit Client SDK

## Маршруты

- `/login`
- `/register`
- `/chats`
- `/chats/:chatId`
- `/profile`
- `/settings`
- `/call/:callId`

## Конфигурация

- `VITE_API_URL=/api`
- `VITE_SOCKET_URL=/`

LiveKit URL не хранится в env фронтенда. Web app получает его только из backend:

- `POST /api/calls/:callId/token`

Ответ:

```json
{
  "url": "wss://your-project.livekit.cloud",
  "token": "temporary-join-token",
  "roomName": "conv_x_call_y"
}
```

## Что работает

- вход / регистрация / выход
- локальное хранение access/refresh token
- список чатов и экран переписки
- создание личных и групповых чатов
- отправка сообщений
- realtime через Socket.IO
- typing indicator
- read status
- online / offline статус
- баннер входящего звонка
- вход в аудио- и видеозвонок через временный LiveKit token

## Безопасность

- `LIVEKIT_API_SECRET` не попадает в frontend bundle
- браузер использует только временный token от backend
- PostgreSQL недоступен браузеру напрямую

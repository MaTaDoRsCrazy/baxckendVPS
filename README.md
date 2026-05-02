# eMessenger / PulseLine

Монорепозиторий self-hosted мессенджера с backend API, web-клиентом, админкой и Android-приложением PulseLine.

## Состав

- `apps/backend` - Fastify, Prisma, PostgreSQL, JWT, Socket.IO, LiveKit token API
- `apps/web` - web messenger на React/Vite
- `apps/admin` - админ-панель на React/Vite
- `apps/android` - Android клиент PulseLine на Kotlin + Compose
- `packages/shared` - общие типы, helper-функции displayName и avatar fallback
- `infra` - Caddy и вспомогательная инфраструктура

## Что покрыто в текущей версии

- единый `displayName` fallback: `fullName/name -> username -> email -> phone -> "Пользователь"`
- avatar fallback с инициалами или `PL`
- профиль пользователя: `fullName`, `username`, `email`, `phone`, `about`, `avatarUrl`, `country`
- загрузка файлов и аватаров через backend `/uploads`
- вложения сообщений: `TEXT`, `IMAGE`, `FILE`, `VOICE`
- голосовые сообщения в web и Android
- регистрация с `username`, `email`, `password`, выбором страны, телефоном, согласием и простой captcha
- LiveKit звонки через backend token flow без передачи секретов в web/Android

## Локальный запуск

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Локальные адреса:

- backend: `http://localhost:3000`
- web: `http://localhost:5174`
- admin: `http://localhost:5173`

Android собирается отдельно из `apps/android`.

## Production / VPS

На VPS должны храниться только backend env и LiveKit secrets. Не добавляйте `LIVEKIT_API_SECRET` в web или Android.

Обязательные env:

- `DATABASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `UPLOADS_DIR=/uploads`
- `MAX_UPLOAD_SIZE_MB=15`

Если backend, web и admin уже работают на VPS, после `git pull` достаточно выполнить:

```bash
cd /opt/emessenger
docker compose up -d --build backend web admin caddy
docker compose exec backend npm run db:migrate
```

## LiveKit Cloud

1. Создайте проект в LiveKit Cloud.
2. Скопируйте `WebSocket URL`, `API Key` и `API Secret`.
3. Запишите их только в `.env` на VPS как:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=lk_...
LIVEKIT_API_SECRET=...
```

4. Не добавляйте эти значения в `apps/web`, `apps/android` или публичные `.env`.
5. Web и Android получают только временный токен через `POST /api/calls/:callId/token`.

## Android сборка

```bash
cd apps/android
gradlew.bat assembleDebug
```

APK:

- `apps/android/app/build/outputs/apk/debug/app-debug.apk`

## Smoke test

После деплоя проверьте:

1. Регистрация в web.
2. Логин в web и переход на `/chats`.
3. Обновление профиля и загрузка аватара.
4. Отправка текстового сообщения.
5. Отправка изображения и файла.
6. Отправка голосового сообщения.
7. Аудиозвонок.
8. Видеозвонок.

Подробности по деплою и контрактам:

- `DEPLOY.md`
- `docs/WEB_APP.md`
- `docs/ANDROID_API.md`
- `docs/PULSELINE_ANDROID_UI.md`
- `apps/android/README.md`

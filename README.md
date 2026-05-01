# EMESSENGER / PulseLine

Полноценный monorepo для self-hosted backend мессенджера с браузерным клиентом, админкой и Android-приложением PulseLine. Звонки работают через LiveKit Cloud: VPS хранит только backend API, Socket.IO, PostgreSQL, админ-панель, web app и генерацию временных LiveKit token.

## Состав проекта

- `apps/backend` — Fastify + Prisma + PostgreSQL + Socket.IO + JWT + LiveKit token API
- `apps/admin` — русифицированная админка на React/Vite/Tailwind
- `apps/web` — русифицированный web messenger на React/Vite/Tailwind
- `apps/android` — PulseLine на Kotlin + Compose + Hilt + Room + DataStore + LiveKit Android SDK
- `packages/shared` — общие TypeScript-типы
- `infra/` — Caddy, backup script, PostgreSQL infra

## Структура

```text
emessenger/
  apps/
    admin/
    android/
    backend/
    web/
  backups/
  docs/
    ANDROID_API.md
    DEPLOY.md
    PULSELINE_ANDROID_UI.md
    WEB_APP.md
  infra/
    caddy/
    postgres/
    scripts/
  packages/
    shared/
  docker-compose.yml
  .env.example
  README.md
  DEPLOY.md
```

## Локальный запуск

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Локальные адреса:

- Backend: `http://localhost:3000`
- Admin: `http://localhost:5173`
- Web app: `http://localhost:5174`

Android открывается отдельно в Android Studio из папки `apps/android`.

## Production / VPS

```bash
git clone <repo-url> emessenger
cd emessenger
cp .env.example .env
docker compose up -d --build
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
```

Проверка после запуска:

```bash
curl http://SERVER_IP/api/health
```

Маршруты по IP:

- `http://SERVER_IP/` — web app
- `http://SERVER_IP/admin` — админка
- `http://SERVER_IP/api/health` — backend

## Android APK

```bash
cd apps/android
gradlew.bat assembleDebug
```

APK появится в:

- `apps/android/app/build/outputs/apk/debug/app-debug.apk`

## Важные замечания

- `LIVEKIT_API_SECRET` хранится только на backend/VPS.
- Android и web получают только временный токен через `POST /api/calls/:callId/token`.
- PostgreSQL не публикуется наружу и работает только внутри Docker network.
- Для резервных копий используйте `infra/scripts/backup-postgres.sh`.

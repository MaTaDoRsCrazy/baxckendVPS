# eMessenger

Monorepo for eMessenger backend, admin panel, browser messenger, and Android client skeleton. Calls are powered by LiveKit Cloud, while the VPS hosts the backend API, WebSocket messaging, PostgreSQL, admin panel, user web app, token generation, and moderation tooling.

## Stack

- Backend: Node.js, TypeScript, Fastify, Prisma, PostgreSQL, Socket.IO, JWT, argon2, LiveKit Server SDK
- Admin: React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query
- Web: React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Socket.IO Client, LiveKit Client SDK
- Android: Kotlin, Jetpack Compose, MVVM, Hilt, Retrofit, DataStore, Room, Socket.IO client, LiveKit Android SDK
- Infra: Docker Compose, Caddy, PostgreSQL 16 Alpine

## Project structure

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

## Environment

1. Copy `.env.example` to `.env`
2. Fill JWT secrets, PostgreSQL password, and LiveKit Cloud credentials
3. Keep `LIVEKIT_API_SECRET` only on the backend/VPS

## Local run

1. `cp .env.example .env`
2. `docker compose up -d postgres`
3. `npm install`
4. `npm run db:migrate`
5. `npm run db:seed`
6. `npm run dev`

Local development URLs:

- Backend: `http://localhost:3000`
- Admin: `http://localhost:5173`
- Web messenger: `http://localhost:5174`

Android app is opened separately from `apps/android` in Android Studio.

## Production run

1. `git clone <repo-url> emessenger`
2. `cd emessenger`
3. `cp .env.example .env`
4. Fill `.env`
5. `docker compose up -d --build`
6. `docker compose exec backend npm run db:migrate`
7. `docker compose exec backend npm run db:seed`

After startup:

- API health: `curl http://SERVER_IP/api/health`
- User web app: `http://SERVER_IP/`
- Admin panel: `http://SERVER_IP/admin`
- Socket.IO endpoint: `http://SERVER_IP/socket.io/`

If domains are configured:

- `APP_DOMAIN` -> user web app
- `ADMIN_DOMAIN` -> admin panel
- `API_DOMAIN` -> backend API
- `SERVER_DOMAIN` -> optional same-host path-based routing

## Useful commands

- `npm run db:generate`
- `npm run build`
- `docker compose logs -f backend`
- `sh infra/scripts/backup-postgres.sh`
- `cd apps/android && ./gradlew assembleDebug`

## Notes

- PostgreSQL is only reachable inside the Docker network and is not exposed publicly.
- Android and admin clients never receive `LIVEKIT_API_SECRET`.
- Android must request call join tokens from `POST /api/calls/:callId/token`.
- Web app also requests call join tokens from `POST /api/calls/:callId/token`.

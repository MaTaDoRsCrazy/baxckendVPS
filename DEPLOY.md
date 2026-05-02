# Deploy on VPS

Инструкция рассчитана на ваш текущий сценарий: backend, web и admin уже размещены на VPS, а деплой делается вручную через `git pull` и `docker compose`.

## 1. Что должно быть в `.env` на VPS

Минимально нужны:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
POSTGRES_DB=emessenger
POSTGRES_USER=emessenger
POSTGRES_PASSWORD=change-me
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=lk_...
LIVEKIT_API_SECRET=...
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
UPLOADS_DIR=/uploads
MAX_UPLOAD_SIZE_MB=15
```

Дополнительно при необходимости:

- `CORS_ORIGINS`
- `APP_DOMAIN`
- `ADMIN_DOMAIN`
- `API_DOMAIN`
- `SERVER_DOMAIN`

## 2. LiveKit Cloud

1. Создайте проект в LiveKit Cloud.
2. Возьмите `WebSocket URL`, `API Key`, `API Secret`.
3. Сохраните их только в `.env` на VPS.
4. Не передавайте `LIVEKIT_API_SECRET` в web или Android.

Backend сам:

- создаёт `AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)`
- выдаёт токен на 30 минут
- ограничивает доступ комнатой `call_<callId>`

## 3. Деплой после изменений

Выполняйте на VPS:

```bash
cd /opt/emessenger
git pull
docker compose up -d --build backend web admin caddy
docker compose exec backend npm run db:migrate
```

Если нужен просмотр логов:

```bash
docker compose logs -f backend
docker compose logs -f web
docker compose logs -f admin
docker compose logs -f caddy
```

## 4. Что изменилось в инфраструктуре

- backend использует volume для локальных загрузок `/uploads`
- Caddy проксирует публичные файлы по `/uploads/*`
- лимит загрузки: `15 MB`

## 5. Smoke test после деплоя

Проверьте в браузере:

1. `GET /api/health`
2. регистрация нового пользователя
3. вход по `email` или `username`
4. переход на `/chats`
5. редактирование профиля
6. загрузка аватара
7. отправка текста
8. отправка изображения/файла
9. отправка голосового сообщения
10. аудиозвонок
11. видеозвонок

Проверьте в Android:

1. логин
2. профиль
3. отправку текста
4. отправку файла/изображения
5. голосовое сообщение
6. аудио/видеозвонок

## 6. Важно

- Codex не должен подключаться к вашему VPS и не делал этого.
- Миграции и LiveKit secrets остаются под вашим контролем на сервере.
- Если в production используется HTTP для Android debug/test, `usesCleartextTraffic` уже разрешён в приложении.

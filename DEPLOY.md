# Deploy on Ubuntu 24.04 VPS

## 1. Update server

```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Install Docker

```bash
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
```

## 3. Open firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

## 4. Download project

```bash
git clone <repo-url> emessenger
cd emessenger
```

## 5. Create environment file

```bash
cp .env.example .env
nano .env
```

Fill at minimum:

- `POSTGRES_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `APP_DOMAIN` if you want a separate user-web domain
- `ADMIN_DOMAIN` if you want a separate admin domain
- `API_DOMAIN` if you want a separate API domain
- `SERVER_DOMAIN` if you want one host with path-based routing

## 6. Start containers

```bash
sudo docker compose up -d --build
sudo docker compose exec backend npm run db:migrate
sudo docker compose exec backend npm run db:seed
```

## 7. Verify backend health

```bash
curl http://YOUR_SERVER_IP/api/health
```

If you configured a domain:

```bash
curl https://your-domain.example/api/health
```

## 8. Login to admin panel

Open:

- Web app: `http://YOUR_SERVER_IP/`
- Admin: `http://YOUR_SERVER_IP/admin`

Or on domains:

- Web app: `https://app.example.com/`
- Admin: `https://admin.example.com/`
- API: `https://api.example.com/api/health`

Use credentials from:

- `ADMIN_EMAIL` or `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

## 9. Watch logs

```bash
sudo docker compose logs -f backend
sudo docker compose logs -f caddy
sudo docker compose logs -f postgres
```

## 10. Restart backend

```bash
sudo docker compose restart backend
```

## 11. Restart web or admin

```bash
sudo docker compose restart web
sudo docker compose restart admin
```

## 12. PostgreSQL backup

```bash
chmod +x infra/scripts/backup-postgres.sh
./infra/scripts/backup-postgres.sh
ls -lah backups/
```

## 13. PostgreSQL restore

```bash
cat backups/postgres-YYYYMMDD-HHMMSS.sql | sudo docker compose exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

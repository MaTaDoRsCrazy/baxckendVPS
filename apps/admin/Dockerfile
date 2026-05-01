FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package.json
COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/shared/tsconfig.json packages/shared/tsconfig.json
COPY packages/shared/src packages/shared/src
COPY apps/admin/package.json apps/admin/package.json
COPY apps/admin/tsconfig.json apps/admin/tsconfig.json
COPY apps/admin/vite.config.ts apps/admin/vite.config.ts
COPY apps/admin/tailwind.config.ts apps/admin/tailwind.config.ts
COPY apps/admin/postcss.config.cjs apps/admin/postcss.config.cjs
COPY apps/admin/index.html apps/admin/index.html
COPY apps/admin/src apps/admin/src

RUN npm install
RUN npm run build -w @emessenger/shared
RUN npm run build -w @emessenger/admin

FROM nginx:1.27-alpine
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files \$uri /index.html;
  }
}
EOF

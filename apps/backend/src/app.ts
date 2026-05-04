import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { env } from "./config/env.js";
import { createAuditLogger } from "./lib/audit.js";
import { registerErrorHandler } from "./lib/errors.js";
import { extractBearerToken } from "./lib/jwt.js";
import { createPrismaClient } from "./lib/prisma.js";
import { getRequestMeta } from "./lib/request.js";
import { resolveUploadAbsolutePath } from "./lib/uploads.js";
import { RealtimeGateway } from "./lib/socket.js";
import { registerApiRoutes } from "./routes/index.js";
import { createServices } from "./services/index.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug"
    },
    bodyLimit: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 + 1024 * 512
  });

  const prisma = createPrismaClient();
  const services = createServices(prisma, env);
  const auditLogger = createAuditLogger(prisma);

  await app.register(cors, {
    origin: env.corsOrigins,
    credentials: true
  });
  await app.register(helmet);
  await app.register(rateLimit, {
    max: 200,
    timeWindow: "1 minute"
  });

  app.addContentTypeParser(/^multipart\/form-data/i, { parseAs: "buffer" }, (request, body, done) => {
    done(null, body);
  });

  app.addHook("onRequest", async (request) => {
    request.auth = null;
  });

  app.addHook("preHandler", async (request) => {
    if (!request.url.startsWith("/api")) {
      return;
    }

    const routeConfig = (request.routeOptions.config ?? {}) as {
      isPublic?: boolean;
      skipIpSecurity?: boolean;
    };
    const meta = getRequestMeta(request);

    if (!routeConfig.skipIpSecurity) {
      await services.securityService.assertIpAllowed(meta.ipAddress);
    }

    if (routeConfig.isPublic) {
      return;
    }

    const token = extractBearerToken(request.headers.authorization);
    const { auth, session } = await services.securityService.authenticateAccessToken(token);
    request.auth = auth;
    await services.securityService.touchSessionActivity(session, meta);
  });

  const gateway = new RealtimeGateway(app.server, prisma, env, {
    chatService: services.chatService,
    messageService: services.messageService,
    callService: services.callService,
    securityService: services.securityService
  });

  app.setErrorHandler(registerErrorHandler());

  app.get("/uploads/*", async (request, reply) => {
    const wildcard = String((request.params as { "*": string })["*"] ?? "");
    const filePath = resolveUploadAbsolutePath(env, wildcard);
    await access(filePath);
    return reply.send(createReadStream(filePath));
  });

  await app.register(async (api) => {
    await registerApiRoutes(api, services, env, auditLogger, gateway);
  }, { prefix: "/api" });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}

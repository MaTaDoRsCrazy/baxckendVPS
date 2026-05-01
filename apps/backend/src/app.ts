import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { createAuditLogger } from "./lib/audit.js";
import { registerErrorHandler } from "./lib/errors.js";
import { createPrismaClient } from "./lib/prisma.js";
import { RealtimeGateway } from "./lib/socket.js";
import { registerApiRoutes } from "./routes/index.js";
import { createServices } from "./services/index.js";

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== "production"
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

  app.addHook("onRequest", async (request) => {
    request.auth = null;
  });

  const gateway = new RealtimeGateway(app.server, prisma, env, {
    chatService: services.chatService,
    messageService: services.messageService,
    callService: services.callService
  });

  app.setErrorHandler(registerErrorHandler());

  await app.register(async (api) => {
    await registerApiRoutes(api, services, env, auditLogger, gateway);
  }, { prefix: "/api" });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}

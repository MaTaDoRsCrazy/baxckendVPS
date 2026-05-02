import type { FastifyInstance } from "fastify";
import type { AppEnv } from "../config/env.js";
import { buildAdminController } from "../controllers/admin.controller.js";
import { buildAuthController } from "../controllers/auth.controller.js";
import { buildCallsController } from "../controllers/calls.controller.js";
import { buildChatsController } from "../controllers/chats.controller.js";
import { buildMessagesController } from "../controllers/messages.controller.js";
import { buildUploadsController } from "../controllers/uploads.controller.js";
import { buildUsersController } from "../controllers/users.controller.js";
import type { createAuditLogger } from "../lib/audit.js";
import type { RealtimeGateway } from "../lib/socket.js";
import type { AppServices } from "../services/index.js";

export async function registerApiRoutes(
  app: FastifyInstance,
  services: AppServices,
  env: AppEnv,
  auditLogger: ReturnType<typeof createAuditLogger>,
  gateway: RealtimeGateway
) {
  const auth = buildAuthController(services, env);
  const users = buildUsersController(services, env);
  const chats = buildChatsController(services, env, gateway);
  const messages = buildMessagesController(services, env, gateway);
  const calls = buildCallsController(services, env, gateway);
  const uploads = buildUploadsController(services, env);
  const admin = buildAdminController(services, env, auditLogger, gateway);

  app.get("/health", async () => ({
    data: {
      status: "ok",
      timestamp: new Date().toISOString()
    }
  }));

  app.post("/auth/register", {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute"
      }
    }
  }, auth.register);
  app.post("/auth/login", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 minute"
      }
    }
  }, auth.login);
  app.post("/auth/refresh", auth.refresh);
  app.post("/auth/logout", auth.logout);
  app.get("/auth/me", auth.me);

  app.get("/users/me", users.me);
  app.patch("/users/me", users.updateMe);
  app.post("/users/me/avatar", users.updateAvatar);
  app.get("/users/search", users.search);
  app.post("/uploads", uploads.create);

  app.get("/chats", chats.list);
  app.post("/chats/private", chats.createPrivate);
  app.post("/chats/group", chats.createGroup);
  app.get("/chats/:chatId", chats.getOne);
  app.get("/chats/:chatId/messages", chats.getMessages);

  app.post("/messages", messages.create);
  app.patch("/messages/:messageId", messages.update);
  app.delete("/messages/:messageId", messages.delete);
  app.post("/messages/:messageId/read", messages.read);

  app.post("/calls/start", calls.start);
  app.post("/calls/:callId/accept", calls.accept);
  app.post("/calls/:callId/reject", calls.reject);
  app.post("/calls/:callId/end", calls.end);
  app.post("/calls/:callId/token", calls.token);
  app.get("/calls/history", calls.history);

  app.get("/admin/dashboard", admin.dashboard);
  app.get("/admin/users", admin.users);
  app.patch("/admin/users/:userId/block", admin.block);
  app.patch("/admin/users/:userId/unblock", admin.unblock);
  app.get("/admin/chats", admin.chats);
  app.get("/admin/messages", admin.messages);
  app.delete("/admin/messages/:messageId", admin.deleteMessage);
  app.get("/admin/calls", admin.calls);
  app.get("/admin/audit-log", admin.auditLog);
  app.get("/admin/server/status", admin.serverStatus);
}

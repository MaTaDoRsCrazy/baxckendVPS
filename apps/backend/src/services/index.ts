import type { PrismaClient } from "@prisma/client";
import type { AppEnv } from "../config/env.js";
import { createAdminService } from "./admin.service.js";
import { createAuthService } from "./auth.service.js";
import { createCallService } from "./call.service.js";
import { createChatService } from "./chat.service.js";
import { createGeoIpService } from "./geoip.service.js";
import { createMessageService } from "./message.service.js";
import { createSecurityService } from "./security.service.js";
import { createUploadService } from "./upload.service.js";
import { createUserService } from "./user.service.js";

export function createServices(prisma: PrismaClient, env: AppEnv) {
  const geoIpService = createGeoIpService(env);
  const securityService = createSecurityService(prisma, env, geoIpService);
  const authService = createAuthService(prisma, env, securityService);
  const userService = createUserService(prisma);
  const chatService = createChatService(prisma);
  const messageService = createMessageService(prisma);
  const callService = createCallService(prisma, env);
  const uploadService = createUploadService(prisma, env);
  const adminService = createAdminService(prisma);

  return {
    authService,
    userService,
    chatService,
    messageService,
    callService,
    uploadService,
    adminService,
    geoIpService,
    securityService
  };
}

export type AppServices = ReturnType<typeof createServices>;

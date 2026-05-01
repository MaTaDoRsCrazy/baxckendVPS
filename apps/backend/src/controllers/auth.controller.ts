import { z } from "zod";
import type { AppEnv } from "../config/env.js";
import { getRequestMeta } from "../lib/request.js";
import { requireAuth } from "../plugins/auth.js";
import type { AppServices } from "../services/index.js";

const registerSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(8),
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().min(5).optional().nullable()
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(8)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export function buildAuthController(services: AppServices, env: AppEnv) {
  return {
    register: async (request: any, reply: any) => {
      const input = registerSchema.parse(request.body);
      const data = await services.authService.register(input, getRequestMeta(request));
      return reply.status(201).send({ data });
    },

    login: async (request: any, reply: any) => {
      const input = loginSchema.parse(request.body);
      const data = await services.authService.login(input, getRequestMeta(request));
      return reply.send({ data });
    },

    refresh: async (request: any, reply: any) => {
      const input = refreshSchema.parse(request.body);
      const data = await services.authService.refresh(input.refreshToken, getRequestMeta(request));
      return reply.send({ data });
    },

    logout: async (request: any, reply: any) => {
      const input = refreshSchema.parse(request.body);
      const data = await services.authService.logout(input.refreshToken);
      return reply.send({ data });
    },

    me: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const data = await services.authService.getMe(auth.userId);
      return reply.send({ data });
    }
  };
}

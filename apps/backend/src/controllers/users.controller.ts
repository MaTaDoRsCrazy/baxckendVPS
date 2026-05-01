import { z } from "zod";
import type { AppEnv } from "../config/env.js";
import { requireAuth } from "../plugins/auth.js";
import type { AppServices } from "../services/index.js";

const updateMeSchema = z.object({
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().min(5).optional().nullable(),
  username: z.string().trim().min(3).optional(),
  avatarUrl: z.string().url().optional().nullable()
});

const searchSchema = z.object({
  q: z.string().trim().min(1)
});

export function buildUsersController(services: AppServices, env: AppEnv) {
  return {
    me: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const data = await services.userService.getMe(auth.userId);
      return reply.send({ data });
    },

    updateMe: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const input = updateMeSchema.parse(request.body);
      const data = await services.userService.updateMe(auth.userId, input);
      return reply.send({ data });
    },

    search: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const query = searchSchema.parse(request.query);
      const data = await services.userService.searchUsers(query.q, auth.userId);
      return reply.send({ data });
    }
  };
}

import { z } from "zod";
import type { AppEnv } from "../config/env.js";
import { parseSingleMultipartFile } from "../lib/multipart.js";
import { requireAuth } from "../plugins/auth.js";
import type { AppServices } from "../services/index.js";

const updateMeSchema = z.object({
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().min(5).optional().nullable(),
  username: z.string().trim().min(3).optional(),
  fullName: z.string().trim().min(1).max(120).optional().nullable(),
  about: z.string().trim().max(500).optional().nullable(),
  country: z.string().trim().min(2).max(64).optional().nullable(),
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

    updateAvatar: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const contentType = String(request.headers["content-type"] ?? "");
      const body = z.instanceof(Buffer).parse(request.body);
      const file = parseSingleMultipartFile(body, contentType);
      const upload = await services.uploadService.saveUpload({
        request,
        originalName: file.originalName,
        mimeType: file.mimeType,
        buffer: file.buffer
      });
      const data = await services.userService.updateAvatar(auth.userId, upload.url);
      return reply.status(201).send({ data });
    },

    search: async (request: any, reply: any) => {
      const auth = requireAuth(request, env);
      const query = searchSchema.parse(request.query);
      const data = await services.userService.searchUsers(query.q, auth.userId);
      return reply.send({ data });
    }
  };
}

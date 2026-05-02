import { z } from "zod";
import type { AppEnv } from "../config/env.js";
import { parseSingleMultipartFile } from "../lib/multipart.js";
import { requireAuth } from "../plugins/auth.js";
import type { AppServices } from "../services/index.js";

const multipartBodySchema = z.instanceof(Buffer);

export function buildUploadsController(services: AppServices, env: AppEnv) {
  return {
    create: async (request: any, reply: any) => {
      requireAuth(request, env);
      const contentType = String(request.headers["content-type"] ?? "");
      const body = multipartBodySchema.parse(request.body);
      const file = parseSingleMultipartFile(body, contentType);
      const data = await services.uploadService.saveUpload({
        request,
        originalName: file.originalName,
        mimeType: file.mimeType,
        buffer: file.buffer
      });

      return reply.status(201).send({ data });
    }
  };
}

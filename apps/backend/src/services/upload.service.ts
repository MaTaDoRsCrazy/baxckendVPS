import type { PrismaClient } from "@prisma/client";
import type { FastifyRequest } from "fastify";
import type { AppEnv } from "../config/env.js";
import { assertUploadMimeType, assertUploadSize, buildPublicUploadUrl, writeUploadFile } from "../lib/uploads.js";

interface SaveUploadInput {
  request: FastifyRequest;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}

export function createUploadService(_prisma: PrismaClient, env: AppEnv) {
  return {
    async saveUpload(input: SaveUploadInput) {
      assertUploadMimeType(input.mimeType);
      assertUploadSize(input.buffer.byteLength, env);

      const stored = await writeUploadFile(env, input.originalName, input.buffer);
      return {
        url: buildPublicUploadUrl(input.request, env, stored.publicPath),
        mimeType: input.mimeType,
        size: input.buffer.byteLength,
        originalName: input.originalName
      };
    }
  };
}

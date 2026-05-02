import type { FastifyRequest } from "fastify";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AppEnv } from "../config/env.js";
import { badRequest } from "./errors.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/webm",
  "audio/mpeg",
  "audio/mp4",
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/octet-stream",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export function assertUploadMimeType(mimeType: string) {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw badRequest("Unsupported file type");
  }
}

export function assertUploadSize(size: number, env: AppEnv) {
  const limitBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  if (size <= 0) {
    throw badRequest("File is required");
  }

  if (size > limitBytes) {
    throw badRequest(`File exceeds ${env.MAX_UPLOAD_SIZE_MB}MB limit`);
  }
}

export function sanitizeFileName(input: string) {
  const trimmed = input.trim();
  const fallback = trimmed || "file";
  return fallback.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function writeUploadFile(env: AppEnv, originalName: string, buffer: Buffer) {
  const now = new Date();
  const folder = path.join(
    env.UPLOADS_DIR,
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0")
  );
  await mkdir(folder, { recursive: true });

  const safeName = sanitizeFileName(originalName);
  const fileName = `${randomUUID()}_${safeName}`;
  const absolutePath = path.join(folder, fileName);
  await writeFile(absolutePath, buffer);

  const publicPath = `/${path.relative(env.UPLOADS_DIR, absolutePath).split(path.sep).join("/")}`;
  return {
    absolutePath,
    publicPath: `/uploads${publicPath}`
  };
}

export function buildPublicUploadUrl(request: FastifyRequest, env: AppEnv, publicPath: string) {
  if (env.SERVER_DOMAIN) {
    const base = env.SERVER_DOMAIN.startsWith("http") ? env.SERVER_DOMAIN : `https://${env.SERVER_DOMAIN}`;
    return new URL(publicPath, `${base.replace(/\/$/, "")}/`).toString();
  }

  const proto = (request.headers["x-forwarded-proto"] as string | undefined) ?? "http";
  const host = request.headers["x-forwarded-host"] ?? request.headers.host;
  if (!host) {
    return publicPath;
  }

  return `${proto}://${host}${publicPath}`;
}

export function resolveUploadAbsolutePath(env: AppEnv, wildcardPath: string) {
  const relativePath = wildcardPath.replace(/^\/+/, "");
  const absolutePath = path.resolve(env.UPLOADS_DIR, relativePath);
  const rootPath = path.resolve(env.UPLOADS_DIR);

  if (!absolutePath.startsWith(rootPath)) {
    throw badRequest("Invalid upload path");
  }

  return absolutePath;
}

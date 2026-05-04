import type { FastifyRequest } from "fastify";
import type { UserRole } from "@prisma/client";
import type { AppEnv } from "../config/env.js";
import type { RequestAuth } from "../types/auth.js";
import { extractBearerToken, verifyAccessToken } from "../lib/jwt.js";
import { forbidden, unauthorized } from "../lib/errors.js";

export function getRequestAuth(request: FastifyRequest, env: AppEnv): RequestAuth {
  if (request.auth) {
    return request.auth;
  }

  const token = extractBearerToken(request.headers.authorization);
  const payload = verifyAccessToken(env, token);

  request.auth = {
    userId: payload.userId,
    role: payload.role,
    sessionId: payload.sessionId
  };

  return request.auth;
}

export function requireAuth(request: FastifyRequest, env: AppEnv): RequestAuth {
  return getRequestAuth(request, env);
}

export function requireRoles(request: FastifyRequest, env: AppEnv, roles: UserRole[]): RequestAuth {
  const auth = getRequestAuth(request, env);
  if (!roles.includes(auth.role)) {
    throw forbidden("Insufficient permissions");
  }

  return auth;
}

export function getSocketToken(input: unknown): string {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw unauthorized("Missing socket token");
  }

  return input;
}

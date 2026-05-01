import jwt from "jsonwebtoken";
import type { AppEnv } from "../config/env.js";
import type { AccessTokenPayload, RefreshTokenPayload } from "../types/auth.js";
import { badRequest, unauthorized } from "./errors.js";

const DURATION_PATTERN = /^(\d+)([smhd])$/;

export function parseDurationToMs(input: string): number {
  const match = DURATION_PATTERN.exec(input);
  if (!match) {
    throw badRequest(`Invalid duration format: ${input}`);
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multiplier =
    unit === "s" ? 1_000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;

  return value * multiplier;
}

export function toDateFromDuration(input: string): Date {
  return new Date(Date.now() + parseDurationToMs(input));
}

export function signAccessToken(env: AppEnv, payload: Omit<AccessTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"]
  });
}

export function signRefreshToken(env: AppEnv, payload: Omit<RefreshTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(env: AppEnv, token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    return payload as AccessTokenPayload;
  } catch {
    throw unauthorized("Invalid access token");
  }
}

export function verifyRefreshToken(env: AppEnv, token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    return payload as RefreshTokenPayload;
  } catch {
    throw unauthorized("Invalid refresh token");
  }
}

export function extractBearerToken(authorizationHeader?: string): string {
  if (!authorizationHeader) {
    throw unauthorized("Missing Authorization header");
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw unauthorized("Invalid Authorization header");
  }

  return token;
}

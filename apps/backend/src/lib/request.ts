import type { FastifyRequest } from "fastify";
import { normalizeIp } from "./ip.js";

export function getClientIp(request: FastifyRequest) {
  const forwarded = request.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded.join(",") : forwarded;

  if (typeof forwardedValue === "string") {
    const candidates = forwardedValue
      .split(",")
      .map((value) => normalizeIp(value))
      .filter((value): value is string => Boolean(value));

    if (candidates.length > 0) {
      return candidates[0];
    }
  }

  return normalizeIp(request.ip);
}

export function getUserAgent(request: FastifyRequest) {
  const rawUserAgent = request.headers["user-agent"];
  const value = Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getRequestMeta(request: FastifyRequest) {
  return {
    userAgent: getUserAgent(request),
    ipAddress: getClientIp(request)
  };
}

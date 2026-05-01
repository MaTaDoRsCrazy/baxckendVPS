import type { FastifyRequest } from "fastify";

export function getRequestMeta(request: FastifyRequest) {
  return {
    userAgent: request.headers["user-agent"] ?? null,
    ipAddress: request.ip
  };
}

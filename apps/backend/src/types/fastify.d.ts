import "fastify";
import type { RequestAuth } from "./auth.js";

declare module "fastify" {
  interface FastifyRequest {
    auth: RequestAuth | null;
  }
}

export {};

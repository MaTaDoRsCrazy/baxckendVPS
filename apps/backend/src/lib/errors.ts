import { Prisma } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function notFound(message = "Resource not found"): AppError {
  return new AppError(404, "NOT_FOUND", message);
}

export function forbidden(message = "Forbidden"): AppError {
  return new AppError(403, "FORBIDDEN", message);
}

export function unauthorized(message = "Unauthorized"): AppError {
  return new AppError(401, "UNAUTHORIZED", message);
}

export function badRequest(message = "Bad request", details?: unknown): AppError {
  return new AppError(400, "BAD_REQUEST", message, details);
}

export function conflict(message = "Conflict"): AppError {
  return new AppError(409, "CONFLICT", message);
}

export function tooManyRequests(message = "Too many requests", code = "TOO_MANY_REQUESTS"): AppError {
  return new AppError(429, code, message);
}

export function registerErrorHandler() {
  return async (error: unknown, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null
        }
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request payload",
          details: error.flatten()
        }
      });
    }

    if (
      error instanceof Error &&
      error.message.includes("Body cannot be empty when content-type is set to 'application/json'")
    ) {
      return reply.status(400).send({
        error: {
          code: "EMPTY_JSON_BODY",
          message: "Request body cannot be empty for application/json"
        }
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return reply.status(409).send({
        error: {
          code: "UNIQUE_CONSTRAINT",
          message: "A unique field already exists"
        }
      });
    }

    request.log.error({
      route: request.routeOptions.url,
      method: request.method,
      error: error instanceof Error ? error.message : String(error)
    }, "request_failed");
    return reply.status(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error"
      }
    });
  };
}

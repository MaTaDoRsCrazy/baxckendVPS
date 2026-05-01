import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d"),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_USERNAME: z.string().min(3),
  ADMIN_PASSWORD: z.string().min(8),
  LIVEKIT_URL: z.string().url(),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string().default("*"),
  SERVER_DOMAIN: z.string().optional().default(""),
  ADMIN_DOMAIN: z.string().optional().default(""),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1)
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  corsOrigins:
    parsedEnv.CORS_ORIGIN === "*"
      ? true
      : parsedEnv.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
};

export type AppEnv = typeof env;

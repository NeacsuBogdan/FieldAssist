import { z } from "zod";

const envSchema = z.object({
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  HOST: z.string().min(1).default("0.0.0.0"),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  UPLOADS_DIR: z.string().min(1).default("uploads"),
});

export type AppConfig = z.infer<typeof envSchema>;

export const loadConfig = (
  source: NodeJS.ProcessEnv = process.env,
): AppConfig => envSchema.parse(source);

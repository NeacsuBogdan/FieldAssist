import { PrismaClient } from "@prisma/client";

import type { AppConfig } from "../config/env.js";

export const createPrismaClient = (config: AppConfig): PrismaClient =>
  new PrismaClient({
    datasourceUrl: config.DATABASE_URL,
    log: config.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

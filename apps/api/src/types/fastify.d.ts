import type { UserRole } from "@fieldassist/shared";
import type { PrismaClient } from "@prisma/client";
import type { FastifyReply } from "fastify";

import type { AppServices } from "../app.js";
import type { AppConfig } from "../config/env.js";
import type { AuthContext } from "../modules/auth/auth.types.js";
import type { RealtimeGateway } from "../modules/realtime/realtime.gateway.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
    authorize: (
      allowedRoles: UserRole[],
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    config: AppConfig;
    prisma: PrismaClient;
    realtime: RealtimeGateway;
    services: AppServices;
  }

  interface FastifyRequest {
    authContext: AuthContext | null;
  }
}

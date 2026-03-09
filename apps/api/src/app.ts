import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import sensible from "@fastify/sensible";
import type { UserRole } from "@fieldassist/shared";
import Fastify, { type FastifyBaseLogger } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import type { AppConfig } from "./config/env.js";
import { loadConfig } from "./config/env.js";
import { AppError, ForbiddenError } from "./lib/errors.js";
import { verifyPassword } from "./lib/password.js";
import { createPrismaClient } from "./lib/prisma.js";
import { createActivityLogService } from "./modules/activity/activity.service.js";
import { createAuthRepository } from "./modules/auth/auth.repository.js";
import authRoutes from "./modules/auth/auth.routes.js";
import { createAuthService } from "./modules/auth/auth.service.js";
import type { AuthService } from "./modules/auth/auth.types.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import {
  createDashboardService,
  type DashboardService,
} from "./modules/dashboard/dashboard.service.js";
import healthRoutes from "./modules/health/health.routes.js";
import incidentRoutes from "./modules/incidents/incident.routes.js";
import {
  createIncidentService,
  type IncidentService,
} from "./modules/incidents/incident.service.js";
import uploadRoutes from "./modules/uploads/upload.routes.js";
import {
  createUploadService,
  type UploadService,
} from "./modules/uploads/upload.service.js";
import workOrderRoutes from "./modules/work-orders/work-order.routes.js";
import {
  createWorkOrderService,
  type WorkOrderService,
} from "./modules/work-orders/work-order.service.js";

export type AppServices = {
  auth: AuthService;
  dashboard: DashboardService;
  incidents: IncidentService;
  uploads: UploadService;
  workOrders: WorkOrderService;
};

type BuildAppOptions = {
  config?: AppConfig;
  logger?: FastifyBaseLogger | boolean;
  services?: Partial<AppServices>;
};

const hasStatusCode = (
  error: unknown,
): error is { message: string; statusCode: number } =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  "statusCode" in error &&
  typeof error.statusCode === "number";

const defaultLogger = (config: AppConfig) =>
  config.NODE_ENV === "development"
    ? {
        level: config.LOG_LEVEL,
        transport: {
          options: {
            translateTime: "HH:MM:ss",
          },
          target: "pino-pretty",
        },
      }
    : {
        level: config.LOG_LEVEL,
      };

export const buildApp = async (options: BuildAppOptions = {}) => {
  const config = options.config ?? loadConfig();
  const prisma = createPrismaClient(config);

  const app = Fastify({
    logger: options.logger ?? defaultLogger(config),
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, {
    credentials: false,
    origin: config.CORS_ORIGIN,
  });
  await app.register(multipart, {
    limits: {
      fileSize: 8 * 1024 * 1024,
      files: 1,
    },
  });
  await app.register(sensible);
  await app.register(jwt, {
    secret: config.JWT_SECRET,
  });

  const activityLogService = createActivityLogService(prisma);
  const authService =
    options.services?.auth ??
    createAuthService({
      signToken: (claims) => Promise.resolve(app.jwt.sign(claims)),
      userRepository: createAuthRepository(prisma),
      verifyPassword,
    });
  const workOrders =
    options.services?.workOrders ??
    createWorkOrderService({
      activityLogService,
      prisma,
    });
  const dashboard =
    options.services?.dashboard ?? createDashboardService(prisma);
  const incidents =
    options.services?.incidents ??
    createIncidentService({
      activityLogService,
      prisma,
    });
  const uploads =
    options.services?.uploads ??
    createUploadService({
      activityLogService,
      prisma,
      uploadsDir: config.UPLOADS_DIR,
    });

  app.decorate("config", config);
  app.decorate("prisma", prisma);
  app.decorate("services", {
    auth: authService,
    dashboard,
    incidents,
    uploads,
    workOrders,
  });
  app.decorateRequest("authContext", null);
  app.decorate("authenticate", async (request) => {
    const payload = await request.jwtVerify<{
      role: UserRole;
      sub: string;
    }>();

    request.authContext = {
      role: payload.role,
      userId: payload.sub,
    };
  });
  app.decorate("authorize", (allowedRoles) => async (request, reply) => {
    await app.authenticate(request, reply);

    const authContext = request.authContext;

    if (!authContext || !allowedRoles.includes(authContext.role)) {
      throw new ForbiddenError();
    }
  });

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
        },
      });
    }

    if (isResponseSerializationError(error)) {
      request.log.error({ err: error }, "Response serialization failed.");
      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    if (
      hasStatusCode(error) &&
      error.statusCode >= 400 &&
      error.statusCode < 500
    ) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.statusCode === 401 ? "UNAUTHORIZED" : "VALIDATION_ERROR",
          message:
            error.statusCode === 401
              ? "Authentication is required."
              : error.message,
        },
      });
    }

    request.log.error({ err: error }, "Unhandled request error.");
    return reply.status(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    });
  });

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  await app.register(healthRoutes, {
    prefix: "/api/v1/health",
  });
  await app.register(authRoutes, {
    prefix: "/api/v1/auth",
  });
  await app.register(workOrderRoutes, {
    prefix: "/api/v1/work-orders",
  });
  await app.register(incidentRoutes, {
    prefix: "/api/v1/incidents",
  });
  await app.register(uploadRoutes, {
    prefix: "/api/v1/uploads",
  });
  await app.register(dashboardRoutes, {
    prefix: "/api/v1/dashboard",
  });

  return app;
};

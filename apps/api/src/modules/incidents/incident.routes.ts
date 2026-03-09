import {
  CreateIncidentRequestSchema,
  IncidentDetailResponseSchema,
  IncidentListResponseSchema,
  IncidentStatusSchema,
  UpdateIncidentRequestSchema,
} from "@fieldassist/shared";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { UnauthorizedError } from "../../lib/errors.js";

const IncidentParamsSchema = z.object({
  id: z.string().min(1),
});

const IncidentListQuerySchema = z.object({
  status: IncidentStatusSchema.optional(),
});

const getAuthContext = (
  authContext: {
    role: "TECHNICIAN" | "SUPERVISOR";
    userId: string;
  } | null,
) => {
  if (!authContext) {
    throw new UnauthorizedError();
  }

  return authContext;
};

const incidentRoutes: FastifyPluginAsync = (app) => {
  const routes = app.withTypeProvider<ZodTypeProvider>();

  routes.get(
    "/",
    {
      preHandler: [routes.authorize(["SUPERVISOR"])],
      schema: {
        querystring: IncidentListQuerySchema,
        response: {
          200: IncidentListResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      return {
        data: await routes.services.incidents.listIncidents({
          actor,
          ...(request.query.status
            ? {
                status: request.query.status,
              }
            : {}),
        }),
      };
    },
  );

  routes.post(
    "/",
    {
      preHandler: [routes.authorize(["TECHNICIAN"])],
      schema: {
        body: CreateIncidentRequestSchema,
        response: {
          200: IncidentDetailResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      return {
        data: await routes.services.incidents.createIncident({
          actor,
          input: request.body,
        }),
      };
    },
  );

  routes.get(
    "/:id",
    {
      preHandler: [routes.authorize(["SUPERVISOR"])],
      schema: {
        params: IncidentParamsSchema,
        response: {
          200: IncidentDetailResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      return {
        data: await routes.services.incidents.getIncidentById({
          actor,
          incidentId: request.params.id,
        }),
      };
    },
  );

  routes.patch(
    "/:id",
    {
      preHandler: [routes.authorize(["SUPERVISOR"])],
      schema: {
        body: UpdateIncidentRequestSchema,
        params: IncidentParamsSchema,
        response: {
          200: IncidentDetailResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      return {
        data: await routes.services.incidents.updateIncident({
          actor,
          incidentId: request.params.id,
          input: request.body,
        }),
      };
    },
  );

  return Promise.resolve();
};

export default incidentRoutes;

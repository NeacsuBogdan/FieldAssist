import {
  WorkOrderDetailResponseSchema,
  WorkOrderListResponseSchema,
  WorkOrderStatusSchema,
} from "@fieldassist/shared";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { UnauthorizedError } from "../../lib/errors.js";

const WorkOrderParamsSchema = z.object({
  id: z.string().min(1),
});

const WorkOrderListQuerySchema = z.object({
  status: WorkOrderStatusSchema.optional(),
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

const workOrderRoutes: FastifyPluginAsync = (app) => {
  const routes = app.withTypeProvider<ZodTypeProvider>();

  routes.get(
    "/",
    {
      preHandler: [routes.authenticate],
      schema: {
        querystring: WorkOrderListQuerySchema,
        response: {
          200: WorkOrderListResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      return {
        data: await routes.services.workOrders.listWorkOrders(
          request.query.status
            ? {
                actor,
                status: request.query.status,
              }
            : {
                actor,
              },
        ),
      };
    },
  );

  routes.get(
    "/:id",
    {
      preHandler: [routes.authenticate],
      schema: {
        params: WorkOrderParamsSchema,
        response: {
          200: WorkOrderDetailResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      return {
        data: await routes.services.workOrders.getWorkOrderById({
          actor,
          workOrderId: request.params.id,
        }),
      };
    },
  );

  routes.post(
    "/:id/start",
    {
      preHandler: [routes.authorize(["TECHNICIAN"])],
      schema: {
        params: WorkOrderParamsSchema,
        response: {
          200: WorkOrderDetailResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      return {
        data: await routes.services.workOrders.startWorkOrder({
          actor,
          workOrderId: request.params.id,
        }),
      };
    },
  );

  routes.post(
    "/:id/pause",
    {
      preHandler: [routes.authorize(["TECHNICIAN"])],
      schema: {
        params: WorkOrderParamsSchema,
        response: {
          200: WorkOrderDetailResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      return {
        data: await routes.services.workOrders.pauseWorkOrder({
          actor,
          workOrderId: request.params.id,
        }),
      };
    },
  );

  routes.post(
    "/:id/complete",
    {
      preHandler: [routes.authorize(["TECHNICIAN"])],
      schema: {
        params: WorkOrderParamsSchema,
        response: {
          200: WorkOrderDetailResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      return {
        data: await routes.services.workOrders.completeWorkOrder({
          actor,
          workOrderId: request.params.id,
        }),
      };
    },
  );

  return Promise.resolve();
};

export default workOrderRoutes;

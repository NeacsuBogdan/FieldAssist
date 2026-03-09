import {
  WorkOrderDetailResponseSchema,
  WorkOrderListResponseSchema,
  WorkOrderStatusSchema,
  UpdateStepRequestSchema,
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

const StepParamsSchema = WorkOrderParamsSchema.extend({
  stepExecutionId: z.string().min(1),
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

const withOptionalNotes = (notes: string | null | undefined) =>
  notes === undefined ? {} : { notes };

const createOccurredAt = () => new Date().toISOString();

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
      const data = await routes.services.workOrders.startWorkOrder({
        actor,
        workOrderId: request.params.id,
      });

      routes.realtime.emitWorkOrderUpdated({
        occurredAt: createOccurredAt(),
        workOrderId: request.params.id,
      });
      routes.realtime.emitDashboardSummaryUpdated();
      routes.realtime.emitActivityLogged({
        entityId: request.params.id,
        entityType: "WORK_ORDER",
        occurredAt: createOccurredAt(),
        workOrderId: request.params.id,
      });

      return {
        data,
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
      const data = await routes.services.workOrders.pauseWorkOrder({
        actor,
        workOrderId: request.params.id,
      });

      routes.realtime.emitWorkOrderUpdated({
        occurredAt: createOccurredAt(),
        workOrderId: request.params.id,
      });
      routes.realtime.emitDashboardSummaryUpdated();
      routes.realtime.emitActivityLogged({
        entityId: request.params.id,
        entityType: "WORK_ORDER",
        occurredAt: createOccurredAt(),
        workOrderId: request.params.id,
      });

      return {
        data,
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
      const data = await routes.services.workOrders.completeWorkOrder({
        actor,
        workOrderId: request.params.id,
      });

      routes.realtime.emitWorkOrderUpdated({
        occurredAt: createOccurredAt(),
        workOrderId: request.params.id,
      });
      routes.realtime.emitDashboardSummaryUpdated();
      routes.realtime.emitActivityLogged({
        entityId: request.params.id,
        entityType: "WORK_ORDER",
        occurredAt: createOccurredAt(),
        workOrderId: request.params.id,
      });

      return {
        data,
      };
    },
  );

  routes.post(
    "/:id/steps/:stepExecutionId/start",
    {
      preHandler: [routes.authorize(["TECHNICIAN"])],
      schema: {
        params: StepParamsSchema,
        response: {
          200: WorkOrderDetailResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      const data = await routes.services.workOrders.startStep({
        actor,
        stepExecutionId: request.params.stepExecutionId,
        workOrderId: request.params.id,
      });

      routes.realtime.emitStepUpdated({
        occurredAt: createOccurredAt(),
        stepExecutionId: request.params.stepExecutionId,
        workOrderId: request.params.id,
      });
      routes.realtime.emitWorkOrderUpdated({
        occurredAt: createOccurredAt(),
        workOrderId: request.params.id,
      });
      routes.realtime.emitDashboardSummaryUpdated();
      routes.realtime.emitActivityLogged({
        entityId: request.params.stepExecutionId,
        entityType: "STEP_EXECUTION",
        occurredAt: createOccurredAt(),
        stepExecutionId: request.params.stepExecutionId,
        workOrderId: request.params.id,
      });

      return {
        data,
      };
    },
  );

  routes.post(
    "/:id/steps/:stepExecutionId/complete",
    {
      preHandler: [routes.authorize(["TECHNICIAN"])],
      schema: {
        body: UpdateStepRequestSchema,
        params: StepParamsSchema,
        response: {
          200: WorkOrderDetailResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      const data = await routes.services.workOrders.completeStep({
        actor,
        stepExecutionId: request.params.stepExecutionId,
        workOrderId: request.params.id,
        ...withOptionalNotes(request.body.notes),
      });

      routes.realtime.emitStepUpdated({
        occurredAt: createOccurredAt(),
        stepExecutionId: request.params.stepExecutionId,
        workOrderId: request.params.id,
      });
      routes.realtime.emitWorkOrderUpdated({
        occurredAt: createOccurredAt(),
        workOrderId: request.params.id,
      });
      routes.realtime.emitDashboardSummaryUpdated();
      routes.realtime.emitActivityLogged({
        entityId: request.params.stepExecutionId,
        entityType: "STEP_EXECUTION",
        occurredAt: createOccurredAt(),
        stepExecutionId: request.params.stepExecutionId,
        workOrderId: request.params.id,
      });

      return {
        data,
      };
    },
  );

  routes.patch(
    "/:id/steps/:stepExecutionId",
    {
      preHandler: [routes.authorize(["TECHNICIAN"])],
      schema: {
        body: UpdateStepRequestSchema,
        params: StepParamsSchema,
        response: {
          200: WorkOrderDetailResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      const data = await routes.services.workOrders.updateStep({
        actor,
        stepExecutionId: request.params.stepExecutionId,
        workOrderId: request.params.id,
        ...withOptionalNotes(request.body.notes),
      });

      routes.realtime.emitStepUpdated({
        occurredAt: createOccurredAt(),
        stepExecutionId: request.params.stepExecutionId,
        workOrderId: request.params.id,
      });
      routes.realtime.emitWorkOrderUpdated({
        occurredAt: createOccurredAt(),
        workOrderId: request.params.id,
      });
      routes.realtime.emitActivityLogged({
        entityId: request.params.stepExecutionId,
        entityType: "STEP_EXECUTION",
        occurredAt: createOccurredAt(),
        stepExecutionId: request.params.stepExecutionId,
        workOrderId: request.params.id,
      });

      return {
        data,
      };
    },
  );

  return Promise.resolve();
};

export default workOrderRoutes;

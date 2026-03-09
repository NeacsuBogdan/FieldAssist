import {
  ActivityLogResponseSchema,
  DashboardSummaryResponseSchema,
} from "@fieldassist/shared";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

const ActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

const dashboardRoutes: FastifyPluginAsync = (app) => {
  const routes = app.withTypeProvider<ZodTypeProvider>();

  routes.get(
    "/summary",
    {
      preHandler: [routes.authorize(["SUPERVISOR"])],
      schema: {
        response: {
          200: DashboardSummaryResponseSchema,
        },
      },
    },
    async () => ({
      data: await routes.services.dashboard.getSummary(),
    }),
  );

  routes.get(
    "/activity",
    {
      preHandler: [routes.authorize(["SUPERVISOR"])],
      schema: {
        querystring: ActivityQuerySchema,
        response: {
          200: ActivityLogResponseSchema,
        },
      },
    },
    async (request) => ({
      data: await routes.services.dashboard.getActivity(request.query.limit),
    }),
  );

  return Promise.resolve();
};

export default dashboardRoutes;

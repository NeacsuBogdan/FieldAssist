import { createApiResponseSchema } from "@fieldassist/shared";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

const HealthResponseSchema = createApiResponseSchema(
  z.object({
    service: z.literal("api"),
    status: z.literal("ok"),
  }),
);

const healthRoutes: FastifyPluginAsync = (app) => {
  const health = app.withTypeProvider<ZodTypeProvider>();

  health.get(
    "/",
    {
      schema: {
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    () => ({
      data: {
        service: "api" as const,
        status: "ok" as const,
      },
    }),
  );

  return Promise.resolve();
};

export default healthRoutes;

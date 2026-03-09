import {
  LoginRequestSchema,
  LoginResponseSchema,
  LogoutResponseSchema,
  MeResponseSchema,
} from "@fieldassist/shared";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { UnauthorizedError } from "../../lib/errors.js";

const authRoutes: FastifyPluginAsync = (app) => {
  const auth = app.withTypeProvider<ZodTypeProvider>();

  auth.post(
    "/login",
    {
      schema: {
        body: LoginRequestSchema,
        response: {
          200: LoginResponseSchema,
        },
      },
    },
    async (request) => {
      const session = await auth.services.auth.login(request.body);
      return {
        data: session,
      };
    },
  );

  auth.post(
    "/logout",
    {
      preHandler: [auth.authenticate],
      schema: {
        response: {
          200: LogoutResponseSchema,
        },
      },
    },
    async () => ({
      data: await auth.services.auth.logout(),
    }),
  );

  auth.get(
    "/me",
    {
      preHandler: [auth.authenticate],
      schema: {
        response: {
          200: MeResponseSchema,
        },
      },
    },
    async (request) => {
      const authContext = request.authContext;

      if (!authContext) {
        throw new UnauthorizedError();
      }

      const user = await auth.services.auth.getMe(authContext.userId);
      return {
        data: user,
      };
    },
  );

  return Promise.resolve();
};

export default authRoutes;

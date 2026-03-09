import { AttachmentUploadResponseSchema } from "@fieldassist/shared";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { BadRequestError, UnauthorizedError } from "../../lib/errors.js";

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

const uploadRoutes: FastifyPluginAsync = (app) => {
  const routes = app.withTypeProvider<ZodTypeProvider>();

  routes.post(
    "/",
    {
      preHandler: [routes.authenticate],
      schema: {
        consumes: ["multipart/form-data"],
        response: {
          200: AttachmentUploadResponseSchema,
        },
      },
    },
    async (request) => {
      const actor = getAuthContext(request.authContext);
      let incidentReportId: string | null = null;
      let workOrderId: string | null = null;
      let uploadInput:
        | {
            fileBuffer: Buffer;
            mimeType: string;
            originalFileName: string;
            sizeBytes: number;
          }
        | null = null;

      for await (const part of request.parts()) {
        if (part.type === "file") {
          if (uploadInput) {
            throw new BadRequestError(
              "Only one file may be uploaded per request.",
            );
          }

          const fileBuffer = await part.toBuffer();

          uploadInput = {
            fileBuffer,
            mimeType: part.mimetype,
            originalFileName: part.filename,
            sizeBytes: fileBuffer.byteLength,
          };

          continue;
        }

        if (part.fieldname === "incidentReportId") {
          incidentReportId =
            typeof part.value === "string" && part.value.length > 0
              ? part.value
              : null;
        }

        if (part.fieldname === "workOrderId") {
          workOrderId =
            typeof part.value === "string" && part.value.length > 0
              ? part.value
              : null;
        }
      }

      if (!uploadInput) {
        throw new BadRequestError("A file is required.");
      }

      return {
        data: await routes.services.uploads.createAttachment({
          actor,
          ...uploadInput,
          incidentReportId,
          workOrderId,
        }),
      };
    },
  );

  return Promise.resolve();
};

export default uploadRoutes;

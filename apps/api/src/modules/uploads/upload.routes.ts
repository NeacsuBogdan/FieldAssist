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

const createOccurredAt = () => new Date().toISOString();
const withOptionalRealtimeId = (
  key: "incidentId" | "workOrderId",
  value: string | null,
) => (value ? { [key]: value } : {});

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

      const data = await routes.services.uploads.createAttachment({
        actor,
        ...uploadInput,
        incidentReportId,
        workOrderId,
      });

      if (data.workOrderId) {
        routes.realtime.emitWorkOrderUpdated({
          occurredAt: createOccurredAt(),
          workOrderId: data.workOrderId,
        });
      }

      if (data.incidentReportId && data.workOrderId) {
        routes.realtime.emitIncidentUpdated({
          incidentId: data.incidentReportId,
          occurredAt: createOccurredAt(),
          workOrderId: data.workOrderId,
        });
      }

      routes.realtime.emitActivityLogged({
        entityId: data.id,
        entityType: "ATTACHMENT",
        occurredAt: createOccurredAt(),
        ...withOptionalRealtimeId("incidentId", data.incidentReportId),
        ...withOptionalRealtimeId("workOrderId", data.workOrderId),
      });

      return {
        data,
      };
    },
  );

  return Promise.resolve();
};

export default uploadRoutes;

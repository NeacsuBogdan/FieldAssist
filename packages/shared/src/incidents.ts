import { z } from "zod";

import { AuthUserSchema } from "./auth.js";
import { createApiResponseSchema } from "./common.js";
import {
  IncidentSeveritySchema,
  IncidentStatusSchema,
  WorkOrderStatusSchema,
} from "./work-orders.js";

export const AttachmentMetadataSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().min(1),
  incidentReportId: z.string().nullable(),
  mimeType: z.string().min(1),
  originalFileName: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  storageKey: z.string().min(1),
  uploadedBy: AuthUserSchema,
  workOrderId: z.string().nullable(),
});

export const IncidentWorkOrderSummarySchema = z.object({
  code: z.string().min(1),
  id: z.string().min(1),
  status: WorkOrderStatusSchema,
  title: z.string().min(1),
});

export const IncidentStepSummarySchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: z.string().min(1),
});

export const IncidentListItemSchema = z.object({
  attachmentCount: z.number().int().nonnegative(),
  category: z.string().min(1),
  createdAt: z.string().datetime(),
  id: z.string().min(1),
  reporter: AuthUserSchema,
  severity: IncidentSeveritySchema,
  status: IncidentStatusSchema,
  step: IncidentStepSummarySchema.nullable(),
  summary: z.string().min(1),
  updatedAt: z.string().datetime(),
  workOrder: IncidentWorkOrderSummarySchema,
});

export const IncidentDetailSchema = IncidentListItemSchema.extend({
  attachments: z.array(AttachmentMetadataSchema),
  details: z.string().min(1),
});

export const CreateIncidentRequestSchema = z.object({
  category: z.string().min(1).max(80),
  details: z.string().min(1).max(4000),
  severity: IncidentSeveritySchema,
  stepExecutionId: z.string().min(1).nullable().optional(),
  summary: z.string().min(1).max(160),
  workOrderId: z.string().min(1),
});

export const UpdateIncidentRequestSchema = z
  .object({
    category: z.string().min(1).max(80).optional(),
    details: z.string().min(1).max(4000).optional(),
    severity: IncidentSeveritySchema.optional(),
    status: IncidentStatusSchema.optional(),
    summary: z.string().min(1).max(160).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

export const IncidentListResponseSchema = createApiResponseSchema(
  z.array(IncidentListItemSchema),
);
export const IncidentDetailResponseSchema = createApiResponseSchema(
  IncidentDetailSchema,
);
export const AttachmentUploadResponseSchema = createApiResponseSchema(
  AttachmentMetadataSchema,
);

export type AttachmentMetadata = z.infer<typeof AttachmentMetadataSchema>;
export type IncidentListItem = z.infer<typeof IncidentListItemSchema>;
export type IncidentDetail = z.infer<typeof IncidentDetailSchema>;
export type CreateIncidentRequest = z.infer<typeof CreateIncidentRequestSchema>;
export type UpdateIncidentRequest = z.infer<typeof UpdateIncidentRequestSchema>;

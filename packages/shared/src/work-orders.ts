import { z } from "zod";

import { AuthUserSchema } from "./auth.js";
import { createApiResponseSchema } from "./common.js";

const NullableDateTimeSchema = z.string().datetime().nullable();

export const WorkOrderPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);
export const WorkOrderStatusSchema = z.enum([
  "ASSIGNED",
  "IN_PROGRESS",
  "PAUSED",
  "BLOCKED",
  "COMPLETED",
]);
export const StepStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "SKIPPED",
]);
export const IncidentSeveritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);
export const IncidentStatusSchema = z.enum([
  "OPEN",
  "ACKNOWLEDGED",
  "RESOLVED",
]);

export const AssetSummarySchema = z.object({
  id: z.string().min(1),
  location: z.string().min(1),
  model: z.string().min(1),
  name: z.string().min(1),
  serialNumber: z.string().min(1),
});

export const WorkflowTemplateSummarySchema = z.object({
  description: z.string().min(1),
  id: z.string().min(1),
  name: z.string().min(1),
});

export const WorkOrderStepSchema = z.object({
  completedAt: NullableDateTimeSchema,
  expectedOutcome: z.string().nullable(),
  id: z.string().min(1),
  instruction: z.string().min(1),
  notes: z.string().nullable(),
  order: z.number().int().nonnegative(),
  status: StepStatusSchema,
  templateStepId: z.string().min(1),
  title: z.string().min(1),
  voiceLabel: z.string().nullable(),
});

export const WorkOrderIncidentSummarySchema = z.object({
  category: z.string().min(1),
  createdAt: z.string().datetime(),
  id: z.string().min(1),
  severity: IncidentSeveritySchema,
  status: IncidentStatusSchema,
  summary: z.string().min(1),
});

export const WorkOrderListItemSchema = z.object({
  asset: AssetSummarySchema,
  assignedTechnician: AuthUserSchema,
  code: z.string().min(1),
  completedAt: NullableDateTimeSchema,
  description: z.string().min(1),
  dueAt: NullableDateTimeSchema,
  id: z.string().min(1),
  nextStepLabel: z.string().nullable(),
  priority: WorkOrderPrioritySchema,
  progressPercent: z.number().int().min(0).max(100),
  startedAt: NullableDateTimeSchema,
  status: WorkOrderStatusSchema,
  title: z.string().min(1),
});

export const WorkOrderDetailSchema = WorkOrderListItemSchema.extend({
  incidents: z.array(WorkOrderIncidentSummarySchema),
  steps: z.array(WorkOrderStepSchema),
  template: WorkflowTemplateSummarySchema,
});

export const DashboardSummarySchema = z.object({
  activeWorkOrders: z.number().int().nonnegative(),
  assignedWorkOrders: z.number().int().nonnegative(),
  blockedWorkOrders: z.number().int().nonnegative(),
  openIncidents: z.number().int().nonnegative(),
  techniciansActive: z.number().int().nonnegative(),
});

export const ActivityLogItemSchema = z.object({
  action: z.string().min(1),
  actor: AuthUserSchema.nullable(),
  createdAt: z.string().datetime(),
  entityId: z.string().min(1),
  entityType: z.string().min(1),
  id: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

export const WorkOrderListResponseSchema = createApiResponseSchema(
  z.array(WorkOrderListItemSchema),
);
export const WorkOrderDetailResponseSchema = createApiResponseSchema(
  WorkOrderDetailSchema,
);
export const DashboardSummaryResponseSchema = createApiResponseSchema(
  DashboardSummarySchema,
);
export const ActivityLogResponseSchema = createApiResponseSchema(
  z.array(ActivityLogItemSchema),
);

export type WorkOrderPriority = z.infer<typeof WorkOrderPrioritySchema>;
export type WorkOrderStatus = z.infer<typeof WorkOrderStatusSchema>;
export type StepStatus = z.infer<typeof StepStatusSchema>;
export type IncidentSeverity = z.infer<typeof IncidentSeveritySchema>;
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;
export type WorkOrderListItem = z.infer<typeof WorkOrderListItemSchema>;
export type WorkOrderDetail = z.infer<typeof WorkOrderDetailSchema>;
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
export type ActivityLogItem = z.infer<typeof ActivityLogItemSchema>;

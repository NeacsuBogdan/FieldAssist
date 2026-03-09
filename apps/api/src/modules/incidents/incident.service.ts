import type {
  CreateIncidentRequest,
  IncidentDetail,
  IncidentListItem,
  IncidentStatus,
  UpdateIncidentRequest,
} from "@fieldassist/shared";
import type { Prisma, PrismaClient } from "@prisma/client";
import { IncidentStatus as PrismaIncidentStatus } from "@prisma/client";

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../lib/errors.js";
import type { ActivityLogService } from "../activity/activity.service.js";
import type { AuthContext } from "../auth/auth.types.js";

const incidentInclude = {
  attachments: {
    include: {
      uploadedByUser: {
        select: {
          email: true,
          fullName: true,
          id: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },
  reporter: {
    select: {
      email: true,
      fullName: true,
      id: true,
      role: true,
    },
  },
  stepExecution: {
    include: {
      templateStep: {
        select: {
          order: true,
          title: true,
        },
      },
    },
  },
  workOrder: {
    select: {
      assignedToUserId: true,
      code: true,
      id: true,
      status: true,
      title: true,
    },
  },
} satisfies Prisma.IncidentReportInclude;

type IncidentRecord = Prisma.IncidentReportGetPayload<{
  include: typeof incidentInclude;
}>;

type GetIncidentInput = {
  actor: AuthContext;
  incidentId: string;
};

type ListIncidentsInput = {
  actor: AuthContext;
  status?: IncidentStatus;
};

type CreateIncidentInput = {
  actor: AuthContext;
  input: CreateIncidentRequest;
};

type UpdateIncidentInput = {
  actor: AuthContext;
  incidentId: string;
  input: UpdateIncidentRequest;
};

export interface IncidentService {
  createIncident(input: CreateIncidentInput): Promise<IncidentDetail>;
  getIncidentById(input: GetIncidentInput): Promise<IncidentDetail>;
  listIncidents(input: ListIncidentsInput): Promise<IncidentListItem[]>;
  updateIncident(input: UpdateIncidentInput): Promise<IncidentDetail>;
}

const mapIncidentRecord = (record: IncidentRecord): IncidentDetail => ({
  attachmentCount: record.attachments.length,
  attachments: record.attachments.map((attachment) => ({
    createdAt: attachment.createdAt.toISOString(),
    id: attachment.id,
    incidentReportId: attachment.incidentReportId,
    mimeType: attachment.mimeType,
    originalFileName: attachment.originalFileName,
    sizeBytes: attachment.sizeBytes,
    storageKey: attachment.storageKey,
    uploadedBy: {
      email: attachment.uploadedByUser.email,
      fullName: attachment.uploadedByUser.fullName,
      id: attachment.uploadedByUser.id,
      role: attachment.uploadedByUser.role,
    },
    workOrderId: attachment.workOrderId,
  })),
  category: record.category,
  createdAt: record.createdAt.toISOString(),
  details: record.details,
  id: record.id,
  reporter: {
    email: record.reporter.email,
    fullName: record.reporter.fullName,
    id: record.reporter.id,
    role: record.reporter.role,
  },
  severity: record.severity,
  status: record.status,
  step: record.stepExecution
    ? {
        id: record.stepExecution.id,
        order: record.stepExecution.templateStep.order,
        title: record.stepExecution.templateStep.title,
      }
    : null,
  summary: record.summary,
  updatedAt: record.updatedAt.toISOString(),
  workOrder: {
    code: record.workOrder.code,
    id: record.workOrder.id,
    status: record.workOrder.status,
    title: record.workOrder.title,
  },
});

const ensureIncidentAccess = (
  record: IncidentRecord,
  actor: AuthContext,
): void => {
  if (actor.role === "SUPERVISOR") {
    return;
  }

  if (
    record.workOrder.assignedToUserId !== actor.userId &&
    record.reporter.id !== actor.userId
  ) {
    throw new ForbiddenError("This incident is outside of your assigned work.");
  }
};

export const createIncidentService = ({
  activityLogService,
  prisma,
}: {
  activityLogService: ActivityLogService;
  prisma: PrismaClient;
}): IncidentService => {
  const getIncidentRecord = async (
    incidentId: string,
  ): Promise<IncidentRecord> => {
    const incident = await prisma.incidentReport.findUnique({
      include: incidentInclude,
      where: {
        id: incidentId,
      },
    });

    if (!incident) {
      throw new NotFoundError("Incident report was not found.");
    }

    return incident;
  };

  const getIncidentDetailForActor = async (
    actor: AuthContext,
    incidentId: string,
  ) => {
    const record = await getIncidentRecord(incidentId);
    ensureIncidentAccess(record, actor);
    return mapIncidentRecord(record);
  };

  return {
    createIncident: async ({ actor, input }) => {
      const workOrder = await prisma.workOrder.findUnique({
        include: {
          stepExecutions: {
            include: {
              templateStep: {
                select: {
                  order: true,
                  title: true,
                },
              },
            },
          },
        },
        where: {
          id: input.workOrderId,
        },
      });

      if (!workOrder) {
        throw new NotFoundError("Work order was not found.");
      }

      if (
        actor.role === "TECHNICIAN" &&
        workOrder.assignedToUserId !== actor.userId
      ) {
        throw new ForbiddenError("This work order is not assigned to you.");
      }

      if (workOrder.status === "COMPLETED") {
        throw new ConflictError(
          "Incidents cannot be filed against completed work orders.",
        );
      }

      const selectedStep = input.stepExecutionId
        ? workOrder.stepExecutions.find(
            (step) => step.id === input.stepExecutionId,
          ) ?? null
        : null;

      if (input.stepExecutionId && !selectedStep) {
        throw new NotFoundError("Selected work order step was not found.");
      }

      const incident = await prisma.incidentReport.create({
        data: {
          category: input.category.trim(),
          details: input.details.trim(),
          reporterId: actor.userId,
          severity: input.severity,
          status: PrismaIncidentStatus.OPEN,
          stepExecutionId: selectedStep?.id ?? null,
          summary: input.summary.trim(),
          workOrderId: workOrder.id,
        },
      });

      await activityLogService.log({
        action: "incident.created",
        actorUserId: actor.userId,
        entityId: incident.id,
        entityType: "INCIDENT",
        metadata: {
          severity: input.severity,
          stepExecutionId: selectedStep?.id ?? null,
          workOrderCode: workOrder.code,
          workOrderId: workOrder.id,
        },
      });

      return getIncidentDetailForActor(actor, incident.id);
    },
    getIncidentById: async ({ actor, incidentId }) =>
      getIncidentDetailForActor(actor, incidentId),
    listIncidents: async ({ actor, status }) => {
      const where: Prisma.IncidentReportWhereInput = {
        ...(status
          ? {
              status,
            }
          : {}),
        ...(actor.role === "TECHNICIAN"
          ? {
              OR: [
                {
                  reporterId: actor.userId,
                },
                {
                  workOrder: {
                    assignedToUserId: actor.userId,
                  },
                },
              ],
            }
          : {}),
      };

      const incidents = await prisma.incidentReport.findMany({
        include: incidentInclude,
        orderBy: [
          {
            status: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
        where,
      });

      return incidents.map((incident) => mapIncidentRecord(incident));
    },
    updateIncident: async ({ actor, incidentId, input }) => {
      const existingIncident = await getIncidentRecord(incidentId);
      ensureIncidentAccess(existingIncident, actor);

      const data: Prisma.IncidentReportUpdateInput = {};

      if (input.category !== undefined) {
        data.category = input.category.trim();
      }

      if (input.details !== undefined) {
        data.details = input.details.trim();
      }

      if (input.severity !== undefined) {
        data.severity = input.severity;
      }

      if (input.status !== undefined) {
        data.status = input.status;
      }

      if (input.summary !== undefined) {
        data.summary = input.summary.trim();
      }

      await prisma.incidentReport.update({
        data,
        where: {
          id: incidentId,
        },
      });

      await activityLogService.log({
        action: "incident.updated",
        actorUserId: actor.userId,
        entityId: incidentId,
        entityType: "INCIDENT",
        metadata: {
          category: input.category,
          severity: input.severity,
          status: input.status,
          summary: input.summary,
        },
      });

      return getIncidentDetailForActor(actor, incidentId);
    },
  };
};

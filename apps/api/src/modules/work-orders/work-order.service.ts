import type {
  WorkOrderDetail,
  WorkOrderListItem,
  WorkOrderStatus,
} from "@fieldassist/shared";
import { WorkOrderStatusSchema } from "@fieldassist/shared";
import type { Prisma, PrismaClient, StepStatus } from "@prisma/client";
import { WorkOrderStatus as PrismaWorkOrderStatus } from "@prisma/client";

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../lib/errors.js";
import type { ActivityLogService } from "../activity/activity.service.js";
import type { AuthContext } from "../auth/auth.types.js";

const workOrderInclude = {
  asset: {
    select: {
      id: true,
      location: true,
      model: true,
      name: true,
      serialNumber: true,
    },
  },
  assignedTo: {
    select: {
      email: true,
      fullName: true,
      id: true,
      role: true,
    },
  },
  incidents: {
    orderBy: {
      createdAt: "desc",
    },
    select: {
      category: true,
      createdAt: true,
      id: true,
      severity: true,
      status: true,
      summary: true,
    },
  },
  stepExecutions: {
    include: {
      templateStep: {
        select: {
          expectedOutcome: true,
          id: true,
          instruction: true,
          order: true,
          title: true,
          voiceLabel: true,
        },
      },
    },
  },
  template: {
    select: {
      description: true,
      id: true,
      name: true,
    },
  },
} satisfies Prisma.WorkOrderInclude;

type WorkOrderRecord = Prisma.WorkOrderGetPayload<{
  include: typeof workOrderInclude;
}>;

type ListWorkOrdersInput = {
  actor: AuthContext;
  status?: WorkOrderStatus;
};

type MutateWorkOrderInput = {
  actor: AuthContext;
  workOrderId: string;
};

export interface WorkOrderService {
  completeWorkOrder(input: MutateWorkOrderInput): Promise<WorkOrderDetail>;
  getWorkOrderById(input: MutateWorkOrderInput): Promise<WorkOrderDetail>;
  listWorkOrders(input: ListWorkOrdersInput): Promise<WorkOrderListItem[]>;
  pauseWorkOrder(input: MutateWorkOrderInput): Promise<WorkOrderDetail>;
  startWorkOrder(input: MutateWorkOrderInput): Promise<WorkOrderDetail>;
}

const formatDate = (value: Date | null): string | null =>
  value?.toISOString() ?? null;

const sortStepExecutions = (record: WorkOrderRecord) =>
  [...record.stepExecutions].sort(
    (left, right) => left.templateStep.order - right.templateStep.order,
  );

const calculateProgress = (steps: Array<{ status: StepStatus }>): number => {
  if (steps.length === 0) {
    return 0;
  }

  const completedCount = steps.filter(
    (step) => step.status === "COMPLETED" || step.status === "SKIPPED",
  ).length;

  return Math.round((completedCount / steps.length) * 100);
};

const getNextStepLabel = (record: WorkOrderRecord): string | null => {
  const nextStep = sortStepExecutions(record).find(
    (step) => step.status === "IN_PROGRESS" || step.status === "PENDING",
  );

  return nextStep?.templateStep.title ?? null;
};

const mapWorkOrderListItem = (record: WorkOrderRecord): WorkOrderListItem => ({
  asset: {
    id: record.asset.id,
    location: record.asset.location,
    model: record.asset.model,
    name: record.asset.name,
    serialNumber: record.asset.serialNumber,
  },
  assignedTechnician: {
    email: record.assignedTo.email,
    fullName: record.assignedTo.fullName,
    id: record.assignedTo.id,
    role: record.assignedTo.role,
  },
  code: record.code,
  completedAt: formatDate(record.completedAt),
  description: record.description,
  dueAt: formatDate(record.dueAt),
  id: record.id,
  nextStepLabel: getNextStepLabel(record),
  priority: record.priority,
  progressPercent: calculateProgress(record.stepExecutions),
  startedAt: formatDate(record.startedAt),
  status: record.status,
  title: record.title,
});

const mapWorkOrderDetail = (record: WorkOrderRecord): WorkOrderDetail => ({
  ...mapWorkOrderListItem(record),
  incidents: record.incidents.map((incident) => ({
    category: incident.category,
    createdAt: incident.createdAt.toISOString(),
    id: incident.id,
    severity: incident.severity,
    status: incident.status,
    summary: incident.summary,
  })),
  steps: sortStepExecutions(record).map((step) => ({
    completedAt: formatDate(step.completedAt),
    expectedOutcome: step.templateStep.expectedOutcome,
    id: step.id,
    instruction: step.templateStep.instruction,
    notes: step.notes,
    order: step.templateStep.order,
    status: step.status,
    templateStepId: step.templateStep.id,
    title: step.templateStep.title,
    voiceLabel: step.templateStep.voiceLabel,
  })),
  template: {
    description: record.template.description,
    id: record.template.id,
    name: record.template.name,
  },
});

const ensureAccess = (record: WorkOrderRecord, actor: AuthContext): void => {
  if (actor.role === "SUPERVISOR") {
    return;
  }

  if (record.assignedTo.id !== actor.userId) {
    throw new ForbiddenError("This work order is not assigned to you.");
  }
};

const ensureMutableStatus = (
  status: WorkOrderRecord["status"],
  allowedStatuses: WorkOrderRecord["status"][],
  message: string,
): void => {
  if (!allowedStatuses.includes(status)) {
    throw new ConflictError(message);
  }
};

export const createWorkOrderService = ({
  activityLogService,
  prisma,
}: {
  activityLogService: ActivityLogService;
  prisma: PrismaClient;
}): WorkOrderService => {
  const getWorkOrderRecord = async (
    workOrderId: string,
  ): Promise<WorkOrderRecord> => {
    const record = await prisma.workOrder.findUnique({
      include: workOrderInclude,
      where: {
        id: workOrderId,
      },
    });

    if (!record) {
      throw new NotFoundError("Work order was not found.");
    }

    return record;
  };

  const getWorkOrderDetailForActor = async (
    actor: AuthContext,
    workOrderId: string,
  ): Promise<WorkOrderDetail> => {
    const record = await getWorkOrderRecord(workOrderId);
    ensureAccess(record, actor);
    return mapWorkOrderDetail(record);
  };

  return {
    completeWorkOrder: async ({ actor, workOrderId }) => {
      const record = await getWorkOrderRecord(workOrderId);
      ensureAccess(record, actor);
      ensureMutableStatus(
        record.status,
        [PrismaWorkOrderStatus.IN_PROGRESS, PrismaWorkOrderStatus.PAUSED],
        "Only active work orders can be completed.",
      );

      const hasIncompleteSteps = record.stepExecutions.some(
        (step) => step.status !== "COMPLETED" && step.status !== "SKIPPED",
      );

      if (hasIncompleteSteps) {
        throw new ConflictError(
          "All workflow steps must be completed before closing the work order.",
        );
      }

      await prisma.workOrder.update({
        data: {
          completedAt: new Date(),
          status: PrismaWorkOrderStatus.COMPLETED,
        },
        where: {
          id: workOrderId,
        },
      });

      await activityLogService.log({
        action: "work-order.completed",
        actorUserId: actor.userId,
        entityId: workOrderId,
        entityType: "WORK_ORDER",
        metadata: {
          status: PrismaWorkOrderStatus.COMPLETED,
        },
      });

      return getWorkOrderDetailForActor(actor, workOrderId);
    },
    getWorkOrderById: async ({ actor, workOrderId }) =>
      getWorkOrderDetailForActor(actor, workOrderId),
    listWorkOrders: async ({ actor, status }) => {
      const parsedStatus = status
        ? WorkOrderStatusSchema.parse(status)
        : undefined;
      const where: Prisma.WorkOrderWhereInput = {
        ...(actor.role === "TECHNICIAN"
          ? {
              assignedToUserId: actor.userId,
            }
          : {}),
        ...(parsedStatus
          ? {
              status: parsedStatus,
            }
          : {}),
      };
      const records = await prisma.workOrder.findMany({
        include: workOrderInclude,
        orderBy: [
          {
            dueAt: "asc",
          },
          {
            updatedAt: "desc",
          },
        ],
        where,
      });

      return records.map(mapWorkOrderListItem);
    },
    pauseWorkOrder: async ({ actor, workOrderId }) => {
      const record = await getWorkOrderRecord(workOrderId);
      ensureAccess(record, actor);
      ensureMutableStatus(
        record.status,
        [PrismaWorkOrderStatus.IN_PROGRESS],
        "Only in-progress work orders can be paused.",
      );

      await prisma.workOrder.update({
        data: {
          status: PrismaWorkOrderStatus.PAUSED,
        },
        where: {
          id: workOrderId,
        },
      });

      await activityLogService.log({
        action: "work-order.paused",
        actorUserId: actor.userId,
        entityId: workOrderId,
        entityType: "WORK_ORDER",
        metadata: {
          status: PrismaWorkOrderStatus.PAUSED,
        },
      });

      return getWorkOrderDetailForActor(actor, workOrderId);
    },
    startWorkOrder: async ({ actor, workOrderId }) => {
      const record = await getWorkOrderRecord(workOrderId);
      ensureAccess(record, actor);

      if (record.status === PrismaWorkOrderStatus.COMPLETED) {
        throw new ConflictError("Completed work orders cannot be restarted.");
      }

      if (record.status !== PrismaWorkOrderStatus.IN_PROGRESS) {
        await prisma.workOrder.update({
          data: {
            startedAt: record.startedAt ?? new Date(),
            status: PrismaWorkOrderStatus.IN_PROGRESS,
          },
          where: {
            id: workOrderId,
          },
        });

        await activityLogService.log({
          action: "work-order.started",
          actorUserId: actor.userId,
          entityId: workOrderId,
          entityType: "WORK_ORDER",
          metadata: {
            status: PrismaWorkOrderStatus.IN_PROGRESS,
          },
        });
      }

      return getWorkOrderDetailForActor(actor, workOrderId);
    },
  };
};

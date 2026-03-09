import type { ActivityLogItem, DashboardSummary } from "@fieldassist/shared";
import { WorkOrderStatus as PrismaWorkOrderStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

const activeStatuses = [
  PrismaWorkOrderStatus.IN_PROGRESS,
  PrismaWorkOrderStatus.PAUSED,
  PrismaWorkOrderStatus.BLOCKED,
] as const;

const toMetadataRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

export interface DashboardService {
  getActivity(limit?: number): Promise<ActivityLogItem[]>;
  getSummary(): Promise<DashboardSummary>;
}

export const createDashboardService = (
  prisma: PrismaClient,
): DashboardService => ({
  getActivity: async (limit = 10) => {
    const records = await prisma.activityLog.findMany({
      include: {
        actorUser: {
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
      take: limit,
    });

    return records.map((record) => ({
      action: record.action,
      actor: record.actorUser
        ? {
            email: record.actorUser.email,
            fullName: record.actorUser.fullName,
            id: record.actorUser.id,
            role: record.actorUser.role,
          }
        : null,
      createdAt: record.createdAt.toISOString(),
      entityId: record.entityId,
      entityType: record.entityType,
      id: record.id,
      metadata: toMetadataRecord(record.metadataJson),
    }));
  },
  getSummary: async () => {
    const [
      assignedWorkOrders,
      blockedWorkOrders,
      openIncidents,
      activeWorkOrders,
      technicianIds,
    ] = await Promise.all([
      prisma.workOrder.count({
        where: {
          status: PrismaWorkOrderStatus.ASSIGNED,
        },
      }),
      prisma.workOrder.count({
        where: {
          status: PrismaWorkOrderStatus.BLOCKED,
        },
      }),
      prisma.incidentReport.count({
        where: {
          status: "OPEN",
        },
      }),
      prisma.workOrder.count({
        where: {
          status: {
            in: [...activeStatuses],
          },
        },
      }),
      prisma.workOrder.findMany({
        distinct: ["assignedToUserId"],
        select: {
          assignedToUserId: true,
        },
        where: {
          status: {
            in: [...activeStatuses],
          },
        },
      }),
    ]);

    return {
      activeWorkOrders,
      assignedWorkOrders,
      blockedWorkOrders,
      openIncidents,
      techniciansActive: technicianIds.length,
    };
  },
});

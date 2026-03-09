import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export type ActivityLogInput = {
  action: string;
  actorUserId?: string | null;
  entityId: string;
  entityType: string;
  metadata?: Prisma.InputJsonValue | null;
};

export interface ActivityLogService {
  log(input: ActivityLogInput): Promise<void>;
}

export const createActivityLogService = (
  prisma: PrismaClient,
): ActivityLogService => ({
  log: async (input) => {
    await prisma.activityLog.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId ?? null,
        entityId: input.entityId,
        entityType: input.entityType,
        metadataJson: input.metadata ?? Prisma.JsonNull,
      },
    });
  },
});

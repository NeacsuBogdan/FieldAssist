import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";

import type { AttachmentMetadata } from "@fieldassist/shared";
import type { PrismaClient } from "@prisma/client";

import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors.js";
import type { ActivityLogService } from "../activity/activity.service.js";
import type { AuthContext } from "../auth/auth.types.js";

type CreateAttachmentInput = {
  actor: AuthContext;
  fileBuffer: Buffer;
  incidentReportId?: string | null;
  mimeType: string;
  originalFileName: string;
  sizeBytes: number;
  workOrderId?: string | null;
};

export interface UploadService {
  createAttachment(input: CreateAttachmentInput): Promise<AttachmentMetadata>;
}

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const createUploadService = ({
  activityLogService,
  prisma,
  uploadsDir,
}: {
  activityLogService: ActivityLogService;
  prisma: PrismaClient;
  uploadsDir: string;
}): UploadService => ({
  createAttachment: async ({
    actor,
    fileBuffer,
    incidentReportId,
    mimeType,
    originalFileName,
    sizeBytes,
    workOrderId,
  }) => {
    if (!workOrderId && !incidentReportId) {
      throw new BadRequestError(
        "Attachments must be linked to a work order or incident.",
      );
    }

    const incident = incidentReportId
      ? await prisma.incidentReport.findUnique({
          include: {
            workOrder: {
              select: {
                assignedToUserId: true,
                code: true,
                id: true,
              },
            },
          },
          where: {
            id: incidentReportId,
          },
        })
      : null;

    if (incidentReportId && !incident) {
      throw new NotFoundError("Incident report was not found.");
    }

    const resolvedWorkOrderId = workOrderId ?? incident?.workOrderId ?? null;

    if (!resolvedWorkOrderId) {
      throw new BadRequestError("A work order reference is required.");
    }

    const workOrder = incident
      ? incident.workOrder
      : await prisma.workOrder.findUnique({
          select: {
            assignedToUserId: true,
            code: true,
            id: true,
          },
          where: {
            id: resolvedWorkOrderId,
          },
        });

    if (!workOrder) {
      throw new NotFoundError("Work order was not found.");
    }

    if (incident && workOrderId && incident.workOrderId !== workOrderId) {
      throw new ConflictError(
        "The provided incident does not belong to the specified work order.",
      );
    }

    if (
      actor.role === "TECHNICIAN" &&
      workOrder.assignedToUserId !== actor.userId
    ) {
      throw new ForbiddenError("This work order is not assigned to you.");
    }

    const safeBaseName = sanitizeFileName(originalFileName);
    const extension = extname(safeBaseName);
    const baseName =
      safeBaseName.slice(
        0,
        extension ? Math.max(1, safeBaseName.length - extension.length) : undefined,
      ) || "attachment";
    const storageKey = incident
      ? `local/incidents/${incident.id}/${baseName}-${randomUUID()}${extension}`
      : `local/work-orders/${workOrder.id}/${baseName}-${randomUUID()}${extension}`;
    const absolutePath = resolve(process.cwd(), uploadsDir, storageKey);

    await mkdir(dirname(absolutePath), {
      recursive: true,
    });
    await writeFile(absolutePath, fileBuffer);

    const attachment = await prisma.attachment.create({
      data: {
        incidentReportId: incident?.id ?? null,
        mimeType,
        originalFileName,
        sizeBytes,
        storageKey,
        uploadedByUserId: actor.userId,
        workOrderId: workOrder.id,
      },
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
    });

    await activityLogService.log({
      action: "attachment.uploaded",
      actorUserId: actor.userId,
      entityId: attachment.id,
      entityType: "ATTACHMENT",
      metadata: {
        incidentReportId: attachment.incidentReportId,
        mimeType,
        originalFileName,
        sizeBytes,
        workOrderCode: workOrder.code,
        workOrderId: workOrder.id,
      },
    });

    return {
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
    };
  },
});

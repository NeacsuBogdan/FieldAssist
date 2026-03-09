import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

const userRole = {
  SUPERVISOR: "SUPERVISOR",
  TECHNICIAN: "TECHNICIAN",
} as const;

const workOrderPriority = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
} as const;

const workOrderStatus = {
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
} as const;

const stepStatus = {
  COMPLETED: "COMPLETED",
  IN_PROGRESS: "IN_PROGRESS",
  PENDING: "PENDING",
} as const;

const incidentSeverity = {
  MEDIUM: "MEDIUM",
} as const;

const incidentStatus = {
  OPEN: "OPEN",
} as const;

const demoPassword = "FieldAssist123!";
const createdAt = new Date("2026-03-09T07:00:00.000Z");
const startedAt = new Date("2026-03-09T08:15:00.000Z");
const firstStepCompletedAt = new Date("2026-03-09T08:35:00.000Z");
const incidentCreatedAt = new Date("2026-03-09T09:10:00.000Z");

const seed = async (): Promise<void> => {
  const passwordHash = await hashPassword(demoPassword);

  await prisma.attachment.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.incidentReport.deleteMany();
  await prisma.workOrderStepExecution.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.workflowTemplateStep.deleteMany();
  await prisma.workflowTemplate.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        createdAt,
        email: "technician@fieldassist.local",
        fullName: "Mara Ionescu",
        id: "user-tech-demo",
        passwordHash,
        role: userRole.TECHNICIAN,
        updatedAt: createdAt,
      },
      {
        createdAt,
        email: "supervisor@fieldassist.local",
        fullName: "Alex Stan",
        id: "user-supervisor-demo",
        passwordHash,
        role: userRole.SUPERVISOR,
        updatedAt: createdAt,
      },
    ],
  });

  await prisma.asset.createMany({
    data: [
      {
        createdAt,
        id: "asset-feed-pump-7",
        location: "Boiler Hall / Line 2",
        model: "Grundfos CRN 32-4",
        name: "Feed Pump 7",
        serialNumber: "FP7-2024-118",
        updatedAt: createdAt,
      },
      {
        createdAt,
        id: "asset-sensor-rack-2",
        location: "Packaging Zone / Bay 4",
        model: "Siemens ET200SP",
        name: "Sensor Rack 2",
        serialNumber: "SR2-2023-552",
        updatedAt: createdAt,
      },
    ],
  });

  await prisma.workflowTemplate.createMany({
    data: [
      {
        createdAt,
        description:
          "Inspect vibration, seals, and restore the pump safely to service.",
        id: "template-pump-inspection",
        name: "Pump Inspection",
        updatedAt: createdAt,
      },
      {
        createdAt,
        description:
          "Recover the affected sensor rack and confirm comms before handoff.",
        id: "template-sensor-recovery",
        name: "Sensor Rack Recovery",
        updatedAt: createdAt,
      },
    ],
  });

  await prisma.workflowTemplateStep.createMany({
    data: [
      {
        createdAt,
        expectedOutcome:
          "Area is safe and lockout / PPE controls are confirmed.",
        id: "template-pump-step-1",
        instruction:
          "Confirm PPE, isolation state, and safe access around the pump housing.",
        order: 1,
        templateId: "template-pump-inspection",
        title: "Verify safe access",
        updatedAt: createdAt,
        voiceLabel: "verify safe access",
      },
      {
        createdAt,
        expectedOutcome:
          "Visible leaks, seal wear, or unusual vibration points are identified.",
        id: "template-pump-step-2",
        instruction:
          "Inspect seal condition and capture vibration observations at the motor and bearing points.",
        order: 2,
        templateId: "template-pump-inspection",
        title: "Inspect seals and vibration",
        updatedAt: createdAt,
        voiceLabel: "inspect pump seals",
      },
      {
        createdAt,
        expectedOutcome:
          "Readings are captured and the pump is ready for supervisor review.",
        id: "template-pump-step-3",
        instruction:
          "Log final notes, confirm area condition, and prepare the work order for closure.",
        order: 3,
        templateId: "template-pump-inspection",
        title: "Capture findings and restore",
        updatedAt: createdAt,
        voiceLabel: "capture findings",
      },
      {
        createdAt,
        expectedOutcome: "Affected cabinet and upstream alarms are identified.",
        id: "template-sensor-step-1",
        instruction:
          "Review the active fault, verify cabinet state, and confirm the affected line segment.",
        order: 1,
        templateId: "template-sensor-recovery",
        title: "Confirm fault scope",
        updatedAt: createdAt,
        voiceLabel: "confirm fault scope",
      },
      {
        createdAt,
        expectedOutcome:
          "Rack connections are restored and controller comms are stable.",
        id: "template-sensor-step-2",
        instruction:
          "Reseat the comms module, inspect connectors, and restart the rack if required.",
        order: 2,
        templateId: "template-sensor-recovery",
        title: "Restore rack communications",
        updatedAt: createdAt,
        voiceLabel: "restore rack comms",
      },
      {
        createdAt,
        expectedOutcome:
          "Sensors report healthy status and the line can return to normal operation.",
        id: "template-sensor-step-3",
        instruction:
          "Validate live telemetry and record the recovery outcome for handoff.",
        order: 3,
        templateId: "template-sensor-recovery",
        title: "Validate telemetry",
        updatedAt: createdAt,
        voiceLabel: "validate telemetry",
      },
    ],
  });

  await prisma.workOrder.createMany({
    data: [
      {
        assetId: "asset-feed-pump-7",
        assignedToUserId: "user-tech-demo",
        code: "WO-2403",
        completedAt: null,
        createdAt,
        description:
          "Investigate increased vibration reported during the morning round.",
        dueAt: new Date("2026-03-09T15:00:00.000Z"),
        id: "work-order-pump-2403",
        priority: workOrderPriority.HIGH,
        startedAt,
        status: workOrderStatus.IN_PROGRESS,
        templateId: "template-pump-inspection",
        title: "Inspect feed pump vibration",
        updatedAt: incidentCreatedAt,
      },
      {
        assetId: "asset-sensor-rack-2",
        assignedToUserId: "user-tech-demo",
        code: "WO-2404",
        completedAt: null,
        createdAt,
        description:
          "Recover intermittent comms loss on the packaging line sensor rack.",
        dueAt: new Date("2026-03-09T18:00:00.000Z"),
        id: "work-order-sensor-2404",
        priority: workOrderPriority.MEDIUM,
        startedAt: null,
        status: workOrderStatus.ASSIGNED,
        templateId: "template-sensor-recovery",
        title: "Recover sensor rack communications",
        updatedAt: createdAt,
      },
    ],
  });

  await prisma.workOrderStepExecution.createMany({
    data: [
      {
        completedAt: firstStepCompletedAt,
        createdAt: startedAt,
        id: "execution-pump-1",
        notes: "Lockout verified with operations lead. Safe access confirmed.",
        status: stepStatus.COMPLETED,
        templateStepId: "template-pump-step-1",
        updatedAt: firstStepCompletedAt,
        workOrderId: "work-order-pump-2403",
      },
      {
        completedAt: null,
        createdAt: firstStepCompletedAt,
        id: "execution-pump-2",
        notes:
          "Vibration elevated near seal housing. Visual wear present on seal face.",
        status: stepStatus.IN_PROGRESS,
        templateStepId: "template-pump-step-2",
        updatedAt: incidentCreatedAt,
        workOrderId: "work-order-pump-2403",
      },
      {
        completedAt: null,
        createdAt,
        id: "execution-pump-3",
        notes: null,
        status: stepStatus.PENDING,
        templateStepId: "template-pump-step-3",
        updatedAt: createdAt,
        workOrderId: "work-order-pump-2403",
      },
      {
        completedAt: null,
        createdAt,
        id: "execution-sensor-1",
        notes: null,
        status: stepStatus.PENDING,
        templateStepId: "template-sensor-step-1",
        updatedAt: createdAt,
        workOrderId: "work-order-sensor-2404",
      },
      {
        completedAt: null,
        createdAt,
        id: "execution-sensor-2",
        notes: null,
        status: stepStatus.PENDING,
        templateStepId: "template-sensor-step-2",
        updatedAt: createdAt,
        workOrderId: "work-order-sensor-2404",
      },
      {
        completedAt: null,
        createdAt,
        id: "execution-sensor-3",
        notes: null,
        status: stepStatus.PENDING,
        templateStepId: "template-sensor-step-3",
        updatedAt: createdAt,
        workOrderId: "work-order-sensor-2404",
      },
    ],
  });

  await prisma.incidentReport.create({
    data: {
      category: "MECHANICAL",
      createdAt: incidentCreatedAt,
      details:
        "Seal wear is visible on the pump housing and the vibration level feels above the morning baseline.",
      id: "incident-pump-seal-wear",
      reporterId: "user-tech-demo",
      severity: incidentSeverity.MEDIUM,
      status: incidentStatus.OPEN,
      stepExecutionId: "execution-pump-2",
      summary: "Seal wear detected during inspection",
      updatedAt: incidentCreatedAt,
      workOrderId: "work-order-pump-2403",
    },
  });

  await prisma.attachment.create({
    data: {
      createdAt: incidentCreatedAt,
      id: "attachment-incident-pump-1",
      incidentReportId: "incident-pump-seal-wear",
      mimeType: "image/jpeg",
      originalFileName: "pump-seal-closeup.jpg",
      sizeBytes: 248731,
      storageKey:
        "local/incidents/incident-pump-seal-wear/pump-seal-closeup.jpg",
      uploadedByUserId: "user-tech-demo",
      workOrderId: "work-order-pump-2403",
    },
  });

  await prisma.activityLog.createMany({
    data: [
      {
        action: "work-order.created",
        actorUserId: "user-supervisor-demo",
        createdAt,
        entityId: "work-order-pump-2403",
        entityType: "WORK_ORDER",
        id: "activity-work-order-pump-created",
        metadataJson: {
          code: "WO-2403",
          status: workOrderStatus.IN_PROGRESS,
        },
      },
      {
        action: "work-order.started",
        actorUserId: "user-tech-demo",
        createdAt: startedAt,
        entityId: "work-order-pump-2403",
        entityType: "WORK_ORDER",
        id: "activity-work-order-pump-started",
        metadataJson: {
          code: "WO-2403",
          status: workOrderStatus.IN_PROGRESS,
        },
      },
      {
        action: "incident.created",
        actorUserId: "user-tech-demo",
        createdAt: incidentCreatedAt,
        entityId: "incident-pump-seal-wear",
        entityType: "INCIDENT",
        id: "activity-incident-created",
        metadataJson: {
          severity: incidentSeverity.MEDIUM,
          workOrderCode: "WO-2403",
        },
      },
      {
        action: "work-order.created",
        actorUserId: "user-supervisor-demo",
        createdAt,
        entityId: "work-order-sensor-2404",
        entityType: "WORK_ORDER",
        id: "activity-work-order-sensor-created",
        metadataJson: {
          code: "WO-2404",
          status: workOrderStatus.ASSIGNED,
        },
      },
    ],
  });
};

seed()
  .then(async () => {
    await prisma.$disconnect();
    console.info("Seeded demo users:");
    console.info("- technician@fieldassist.local / FieldAssist123!");
    console.info("- supervisor@fieldassist.local / FieldAssist123!");
    console.info(
      "Seeded 2 assets, 2 workflow templates, 2 work orders, 1 incident, and 4 activity log entries.",
    );
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });

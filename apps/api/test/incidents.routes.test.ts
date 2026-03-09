import type {
  AttachmentMetadata,
  AuthUser,
  IncidentDetail,
  IncidentListItem,
} from "@fieldassist/shared";
import { describe, expect, it, vi } from "vitest";

import { buildApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import type { AuthService } from "../src/modules/auth/auth.types.js";
import type { DashboardService } from "../src/modules/dashboard/dashboard.service.js";
import type { IncidentService } from "../src/modules/incidents/incident.service.js";
import type { UploadService } from "../src/modules/uploads/upload.service.js";
import type { WorkOrderService } from "../src/modules/work-orders/work-order.service.js";

const baseConfig: AppConfig = {
  CORS_ORIGIN: "http://localhost:5173",
  DATABASE_URL:
    "postgresql://fieldassist:fieldassist@localhost:5432/fieldassist_test?schema=public",
  HOST: "127.0.0.1",
  JWT_SECRET: "test-secret-with-at-least-32-characters",
  LOG_LEVEL: "error",
  NODE_ENV: "test",
  PORT: 4100,
  UPLOADS_DIR: "uploads-test",
};

const technicianUser: AuthUser = {
  email: "technician@fieldassist.local",
  fullName: "Mara Ionescu",
  id: "user-tech-demo",
  role: "TECHNICIAN",
};

const supervisorUser: AuthUser = {
  email: "supervisor@fieldassist.local",
  fullName: "Alex Stan",
  id: "user-supervisor-demo",
  role: "SUPERVISOR",
};

const attachment: AttachmentMetadata = {
  createdAt: "2026-03-09T09:18:00.000Z",
  id: "attachment-incident-pump-1",
  incidentReportId: "incident-pump-seal-wear",
  mimeType: "image/jpeg",
  originalFileName: "pump-seal-closeup.jpg",
  sizeBytes: 248731,
  storageKey: "local/incidents/incident-pump-seal-wear/pump-seal-closeup.jpg",
  uploadedBy: technicianUser,
  workOrderId: "work-order-pump-2403",
};

const incidentListItem: IncidentListItem = {
  attachmentCount: 1,
  category: "MECHANICAL",
  createdAt: "2026-03-09T09:10:00.000Z",
  id: "incident-pump-seal-wear",
  reporter: technicianUser,
  severity: "MEDIUM",
  status: "OPEN",
  step: {
    id: "execution-pump-2",
    order: 2,
    title: "Inspect seals and vibration",
  },
  summary: "Seal wear detected during inspection",
  updatedAt: "2026-03-09T09:10:00.000Z",
  workOrder: {
    code: "WO-2403",
    id: "work-order-pump-2403",
    status: "IN_PROGRESS",
    title: "Inspect feed pump vibration",
  },
};

const incidentDetail: IncidentDetail = {
  ...incidentListItem,
  attachments: [attachment],
  details:
    "Seal wear is visible on the pump housing and vibration is above the morning baseline.",
};

const createAuthServiceMock = (user: AuthUser): AuthService => ({
  getMe: vi.fn(() => Promise.resolve(user)),
  login: vi.fn(() =>
    Promise.resolve({
      token: "token",
      user,
    }),
  ),
  logout: vi.fn(() =>
    Promise.resolve({
      success: true as const,
    }),
  ),
});

const createIncidentServiceMock = (): {
  mocks: {
    createIncident: ReturnType<typeof vi.fn>;
    getIncidentById: ReturnType<typeof vi.fn>;
    listIncidents: ReturnType<typeof vi.fn>;
    updateIncident: ReturnType<typeof vi.fn>;
  };
  service: IncidentService;
} => {
  const createIncident = vi.fn(() => Promise.resolve(incidentDetail));
  const getIncidentById = vi.fn(() => Promise.resolve(incidentDetail));
  const listIncidents = vi.fn(() => Promise.resolve([incidentListItem]));
  const updateIncident = vi.fn(() => Promise.resolve(incidentDetail));

  return {
    mocks: {
      createIncident,
      getIncidentById,
      listIncidents,
      updateIncident,
    },
    service: {
      createIncident,
      getIncidentById,
      listIncidents,
      updateIncident,
    },
  };
};

const createDashboardServiceStub = (): DashboardService => ({
  getActivity: vi.fn(() => Promise.resolve([])),
  getSummary: vi.fn(() =>
    Promise.resolve({
      activeWorkOrders: 0,
      assignedWorkOrders: 0,
      blockedWorkOrders: 0,
      openIncidents: 0,
      techniciansActive: 0,
    }),
  ),
});

const createWorkOrderServiceStub = (): WorkOrderService => ({
  completeStep: vi.fn(),
  completeWorkOrder: vi.fn(),
  getWorkOrderById: vi.fn(),
  listWorkOrders: vi.fn(),
  pauseWorkOrder: vi.fn(),
  startStep: vi.fn(),
  startWorkOrder: vi.fn(),
  updateStep: vi.fn(),
});

const createUploadServiceStub = (): UploadService => ({
  createAttachment: vi.fn(),
});

describe("incident routes", () => {
  it("lists incidents for a supervisor", async () => {
    const incidents = createIncidentServiceMock();
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: createAuthServiceMock(supervisorUser),
        dashboard: createDashboardServiceStub(),
        incidents: incidents.service,
        uploads: createUploadServiceStub(),
        workOrders: createWorkOrderServiceStub(),
      },
    });
    const token = app.jwt.sign({
      role: supervisorUser.role,
      sub: supervisorUser.id,
    });

    const response = await app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: "/api/v1/incidents?status=OPEN",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [incidentListItem],
    });
    expect(incidents.mocks.listIncidents.mock.calls).toEqual([
      [
        {
          actor: {
            role: "SUPERVISOR",
            userId: supervisorUser.id,
          },
          status: "OPEN",
        },
      ],
    ]);

    await app.close();
  });

  it("creates an incident for the authenticated technician", async () => {
    const incidents = createIncidentServiceMock();
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: createAuthServiceMock(technicianUser),
        dashboard: createDashboardServiceStub(),
        incidents: incidents.service,
        uploads: createUploadServiceStub(),
        workOrders: createWorkOrderServiceStub(),
      },
    });
    const token = app.jwt.sign({
      role: technicianUser.role,
      sub: technicianUser.id,
    });

    const response = await app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "POST",
      payload: {
        category: "MECHANICAL",
        details:
          "Seal wear is visible on the pump housing and vibration is above the morning baseline.",
        severity: "MEDIUM",
        stepExecutionId: "execution-pump-2",
        summary: "Seal wear detected during inspection",
        workOrderId: "work-order-pump-2403",
      },
      url: "/api/v1/incidents",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: incidentDetail,
    });
    expect(incidents.mocks.createIncident.mock.calls).toEqual([
      [
        {
          actor: {
            role: "TECHNICIAN",
            userId: technicianUser.id,
          },
          input: {
            category: "MECHANICAL",
            details:
              "Seal wear is visible on the pump housing and vibration is above the morning baseline.",
            severity: "MEDIUM",
            stepExecutionId: "execution-pump-2",
            summary: "Seal wear detected during inspection",
            workOrderId: "work-order-pump-2403",
          },
        },
      ],
    ]);

    await app.close();
  });

  it("updates incident state for a supervisor", async () => {
    const incidents = createIncidentServiceMock();
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: createAuthServiceMock(supervisorUser),
        dashboard: createDashboardServiceStub(),
        incidents: incidents.service,
        uploads: createUploadServiceStub(),
        workOrders: createWorkOrderServiceStub(),
      },
    });
    const token = app.jwt.sign({
      role: supervisorUser.role,
      sub: supervisorUser.id,
    });

    const response = await app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "PATCH",
      payload: {
        status: "ACKNOWLEDGED",
      },
      url: "/api/v1/incidents/incident-pump-seal-wear",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: incidentDetail,
    });
    expect(incidents.mocks.updateIncident.mock.calls).toEqual([
      [
        {
          actor: {
            role: "SUPERVISOR",
            userId: supervisorUser.id,
          },
          incidentId: "incident-pump-seal-wear",
          input: {
            status: "ACKNOWLEDGED",
          },
        },
      ],
    ]);

    await app.close();
  });

  it("blocks technicians from supervisor incident routes", async () => {
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: createAuthServiceMock(technicianUser),
        dashboard: createDashboardServiceStub(),
        incidents: createIncidentServiceMock().service,
        uploads: createUploadServiceStub(),
        workOrders: createWorkOrderServiceStub(),
      },
    });
    const token = app.jwt.sign({
      role: technicianUser.role,
      sub: technicianUser.id,
    });

    const response = await app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: "/api/v1/incidents",
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to access this resource.",
      },
    });

    await app.close();
  });
});

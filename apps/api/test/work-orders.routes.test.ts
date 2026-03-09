import type {
  AuthUser,
  DashboardSummary,
  WorkOrderDetail,
  WorkOrderListItem,
} from "@fieldassist/shared";
import { describe, expect, it, vi } from "vitest";

import { buildApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import type { AuthService } from "../src/modules/auth/auth.types.js";
import type { DashboardService } from "../src/modules/dashboard/dashboard.service.js";
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

const workOrderListItem: WorkOrderListItem = {
  asset: {
    id: "asset-feed-pump-7",
    location: "Boiler Hall / Line 2",
    model: "Grundfos CRN 32-4",
    name: "Feed Pump 7",
    serialNumber: "FP7-2024-118",
  },
  assignedTechnician: technicianUser,
  code: "WO-2403",
  completedAt: null,
  description:
    "Investigate increased vibration reported during the morning round.",
  dueAt: "2026-03-09T15:00:00.000Z",
  id: "work-order-pump-2403",
  nextStepLabel: "Inspect seals and vibration",
  priority: "HIGH",
  progressPercent: 33,
  startedAt: "2026-03-09T08:15:00.000Z",
  status: "IN_PROGRESS",
  title: "Inspect feed pump vibration",
};

const workOrderDetail: WorkOrderDetail = {
  ...workOrderListItem,
  incidents: [
    {
      category: "MECHANICAL",
      createdAt: "2026-03-09T09:10:00.000Z",
      id: "incident-pump-seal-wear",
      severity: "MEDIUM",
      status: "OPEN",
      summary: "Seal wear detected during inspection",
    },
  ],
  steps: [
    {
      completedAt: "2026-03-09T08:35:00.000Z",
      expectedOutcome: "Area is safe and lockout / PPE controls are confirmed.",
      id: "execution-pump-1",
      instruction:
        "Confirm PPE, isolation state, and safe access around the pump housing.",
      notes: "Lockout verified with operations lead. Safe access confirmed.",
      order: 1,
      status: "COMPLETED",
      templateStepId: "template-pump-step-1",
      title: "Verify safe access",
      voiceLabel: "verify safe access",
    },
    {
      completedAt: null,
      expectedOutcome:
        "Visible leaks, seal wear, or unusual vibration points are identified.",
      id: "execution-pump-2",
      instruction:
        "Inspect seal condition and capture vibration observations at the motor and bearing points.",
      notes:
        "Vibration elevated near seal housing. Visual wear present on seal face.",
      order: 2,
      status: "IN_PROGRESS",
      templateStepId: "template-pump-step-2",
      title: "Inspect seals and vibration",
      voiceLabel: "inspect pump seals",
    },
    {
      completedAt: null,
      expectedOutcome:
        "Readings are captured and the pump is ready for supervisor review.",
      id: "execution-pump-3",
      instruction:
        "Log final notes, confirm area condition, and prepare the work order for closure.",
      notes: null,
      order: 3,
      status: "PENDING",
      templateStepId: "template-pump-step-3",
      title: "Capture findings and restore",
      voiceLabel: "capture findings",
    },
  ],
  template: {
    description:
      "Inspect vibration, seals, and restore the pump safely to service.",
    id: "template-pump-inspection",
    name: "Pump Inspection",
  },
};

const dashboardSummary: DashboardSummary = {
  activeWorkOrders: 1,
  assignedWorkOrders: 1,
  blockedWorkOrders: 0,
  openIncidents: 1,
  techniciansActive: 1,
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

const createWorkOrderServiceMock = (): {
  mocks: {
    getWorkOrderById: ReturnType<typeof vi.fn>;
    listWorkOrders: ReturnType<typeof vi.fn>;
    startWorkOrder: ReturnType<typeof vi.fn>;
  };
  service: WorkOrderService;
} => {
  const listWorkOrders = vi.fn(() => Promise.resolve([workOrderListItem]));
  const getWorkOrderById = vi.fn(() => Promise.resolve(workOrderDetail));
  const startWorkOrder = vi.fn(() => Promise.resolve(workOrderDetail));
  const pauseWorkOrder = vi.fn(() => Promise.resolve(workOrderDetail));
  const completeWorkOrder = vi.fn(() => Promise.resolve(workOrderDetail));

  return {
    mocks: {
      getWorkOrderById,
      listWorkOrders,
      startWorkOrder,
    },
    service: {
      completeWorkOrder,
      getWorkOrderById,
      listWorkOrders,
      pauseWorkOrder,
      startWorkOrder,
    },
  };
};

const createDashboardServiceMock = (): {
  mocks: {
    getActivity: ReturnType<typeof vi.fn>;
    getSummary: ReturnType<typeof vi.fn>;
  };
  service: DashboardService;
} => {
  const getSummary = vi.fn(() => Promise.resolve(dashboardSummary));
  const getActivity = vi.fn(() => Promise.resolve([]));

  return {
    mocks: {
      getActivity,
      getSummary,
    },
    service: {
      getActivity,
      getSummary,
    },
  };
};

describe("work order and dashboard routes", () => {
  it("lists work orders for the authenticated technician", async () => {
    const workOrders = createWorkOrderServiceMock();
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: createAuthServiceMock(technicianUser),
        dashboard: createDashboardServiceMock().service,
        workOrders: workOrders.service,
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
      url: "/api/v1/work-orders?status=IN_PROGRESS",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [workOrderListItem],
    });
    expect(workOrders.mocks.listWorkOrders.mock.calls).toEqual([
      [
        {
          actor: {
            role: "TECHNICIAN",
            userId: technicianUser.id,
          },
          status: "IN_PROGRESS",
        },
      ],
    ]);

    await app.close();
  });

  it("returns work order detail for the authenticated technician", async () => {
    const workOrders = createWorkOrderServiceMock();
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: createAuthServiceMock(technicianUser),
        dashboard: createDashboardServiceMock().service,
        workOrders: workOrders.service,
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
      url: "/api/v1/work-orders/work-order-pump-2403",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: workOrderDetail,
    });
    expect(workOrders.mocks.getWorkOrderById.mock.calls).toEqual([
      [
        {
          actor: {
            role: "TECHNICIAN",
            userId: technicianUser.id,
          },
          workOrderId: "work-order-pump-2403",
        },
      ],
    ]);

    await app.close();
  });

  it("starts a work order for the assigned technician", async () => {
    const workOrders = createWorkOrderServiceMock();
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: createAuthServiceMock(technicianUser),
        dashboard: createDashboardServiceMock().service,
        workOrders: workOrders.service,
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
      url: "/api/v1/work-orders/work-order-pump-2403/start",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: workOrderDetail,
    });
    expect(workOrders.mocks.startWorkOrder.mock.calls).toEqual([
      [
        {
          actor: {
            role: "TECHNICIAN",
            userId: technicianUser.id,
          },
          workOrderId: "work-order-pump-2403",
        },
      ],
    ]);

    await app.close();
  });

  it("returns dashboard summary for a supervisor", async () => {
    const dashboard = createDashboardServiceMock();
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: createAuthServiceMock(supervisorUser),
        dashboard: dashboard.service,
        workOrders: createWorkOrderServiceMock().service,
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
      url: "/api/v1/dashboard/summary",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: dashboardSummary,
    });
    expect(dashboard.mocks.getSummary.mock.calls).toEqual([[]]);

    await app.close();
  });

  it("blocks technicians from supervisor dashboard routes", async () => {
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: createAuthServiceMock(technicianUser),
        dashboard: createDashboardServiceMock().service,
        workOrders: createWorkOrderServiceMock().service,
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
      url: "/api/v1/dashboard/summary",
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

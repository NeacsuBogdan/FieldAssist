import type { WorkOrderDetail } from "@fieldassist/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/auth-store";
import { workOrdersApi } from "@/features/work-orders/work-orders-api";

import { WorkOrderDetailPage } from "./work-order-detail-page";

vi.mock("@/features/work-orders/work-orders-api", () => ({
  workOrderQueryKeys: {
    detail: (workOrderId: string) => ["work-order", workOrderId],
    list: () => ["work-orders"],
  },
  workOrdersApi: {
    completeStep: vi.fn(),
    completeWorkOrder: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
    pauseWorkOrder: vi.fn(),
    startStep: vi.fn(),
    startWorkOrder: vi.fn(),
    updateStep: vi.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        retry: false,
      },
    },
  });

const completedSafetyStep: WorkOrderDetail["steps"][number] = {
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
};

const activeInspectionStep: WorkOrderDetail["steps"][number] = {
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
};

const pendingRestoreStep: WorkOrderDetail["steps"][number] = {
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
};

const inProgressWorkOrder: WorkOrderDetail = {
  asset: {
    id: "asset-feed-pump-7",
    location: "Boiler Hall / Line 2",
    model: "Grundfos CRN 32-4",
    name: "Feed Pump 7",
    serialNumber: "FP7-2024-118",
  },
  assignedTechnician: {
    email: "technician@fieldassist.local",
    fullName: "Mara Ionescu",
    id: "user-tech-demo",
    role: "TECHNICIAN",
  },
  code: "WO-2403",
  completedAt: null,
  description:
    "Investigate increased vibration reported during the morning round.",
  dueAt: "2026-03-09T15:00:00.000Z",
  id: "work-order-pump-2403",
  incidents: [],
  nextStepLabel: "Inspect seals and vibration",
  priority: "HIGH",
  progressPercent: 33,
  startedAt: "2026-03-09T08:15:00.000Z",
  status: "IN_PROGRESS",
  steps: [completedSafetyStep, activeInspectionStep, pendingRestoreStep],
  template: {
    description:
      "Inspect vibration, seals, and restore the pump safely to service.",
    id: "template-pump-inspection",
    name: "Pump Inspection",
  },
  title: "Inspect feed pump vibration",
};

const updatedWorkOrder: WorkOrderDetail = {
  ...inProgressWorkOrder,
  nextStepLabel: "Capture findings and restore",
  progressPercent: 67,
  steps: [
    completedSafetyStep,
    {
      ...activeInspectionStep,
      completedAt: "2026-03-09T09:12:00.000Z",
      notes: "Seal housing shows localized wear and elevated vibration.",
      status: "COMPLETED",
    },
    {
      ...pendingRestoreStep,
      status: "IN_PROGRESS",
    },
  ],
};

beforeEach(() => {
  window.localStorage.clear();
  useAuthStore.setState({
    token: "session-token",
    user: inProgressWorkOrder.assignedTechnician,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("WorkOrderDetailPage", () => {
  it("lets a technician complete the active step with notes", async () => {
    vi.mocked(workOrdersApi.getById).mockResolvedValue(inProgressWorkOrder);
    vi.mocked(workOrdersApi.completeStep).mockResolvedValue(updatedWorkOrder);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/app/work-orders/work-order-pump-2403"]}>
          <Routes>
            <Route
              element={<WorkOrderDetailPage />}
              path="/app/work-orders/:id"
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("button", {
        name: "Complete Inspect seals and vibration",
      }),
    ).toBeInTheDocument();

    const user = userEvent.setup();

    await user.clear(screen.getByLabelText("Current step notes"));
    await user.type(
      screen.getByLabelText("Current step notes"),
      "Seal housing shows localized wear and elevated vibration.",
    );
    await user.click(
      screen.getByRole("button", { name: "Complete Inspect seals and vibration" }),
    );

    await waitFor(() => {
      expect(workOrdersApi.completeStep).toHaveBeenCalledWith(
        "work-order-pump-2403",
        "execution-pump-2",
        {
          notes: "Seal housing shows localized wear and elevated vibration.",
        },
      );
    });

    expect(
      await screen.findByRole("button", {
        name: "Complete Capture findings and restore",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
  });
});

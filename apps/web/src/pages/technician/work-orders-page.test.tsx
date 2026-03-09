import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { workOrdersApi } from "@/features/work-orders/work-orders-api";

import { TechnicianWorkOrdersPage } from "./work-orders-page";

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

afterEach(() => {
  vi.clearAllMocks();
});

describe("TechnicianWorkOrdersPage", () => {
  it("renders the assigned technician queue from the API", async () => {
    vi.mocked(workOrdersApi.list).mockResolvedValue([
      {
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
        nextStepLabel: "Inspect seals and vibration",
        priority: "HIGH",
        progressPercent: 33,
        startedAt: "2026-03-09T08:15:00.000Z",
        status: "IN_PROGRESS",
        title: "Inspect feed pump vibration",
      },
    ]);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <TechnicianWorkOrdersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(workOrdersApi.list).toHaveBeenCalledTimes(1);
      expect(
        screen.getByRole("heading", {
          name: "Inspect feed pump vibration",
        }),
      ).toBeInTheDocument();
      expect(screen.getByText("Inspect seals and vibration")).toBeInTheDocument();
    }, {
      timeout: 3_000,
    });
  });

  it("renders an empty state when no work orders are assigned", async () => {
    vi.mocked(workOrdersApi.list).mockResolvedValue([]);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <TechnicianWorkOrdersPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "No assigned work orders",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Assigned work orders will appear here/i),
    ).toBeInTheDocument();
  });
});

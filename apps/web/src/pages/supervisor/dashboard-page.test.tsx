import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dashboardApi } from "@/features/dashboard/dashboard-api";

import { SupervisorDashboardPage } from "./dashboard-page";

vi.mock("@/features/dashboard/dashboard-api", () => ({
  dashboardApi: {
    getActivity: vi.fn(),
    getSummary: vi.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

afterEach(() => {
  vi.clearAllMocks();
});

describe("SupervisorDashboardPage", () => {
  it("renders summary cards and the empty activity state", async () => {
    vi.mocked(dashboardApi.getSummary).mockResolvedValue({
      activeWorkOrders: 2,
      assignedWorkOrders: 1,
      blockedWorkOrders: 1,
      openIncidents: 0,
      techniciansActive: 1,
    });
    vi.mocked(dashboardApi.getActivity).mockResolvedValue([]);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <SupervisorDashboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(dashboardApi.getSummary).toHaveBeenCalledTimes(1);
      expect(dashboardApi.getActivity).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByRole("heading", {
        name: "Operational snapshot",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Blocked work orders")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(3);
    expect(
      screen.getByRole("heading", {
        name: "No recent activity",
      }),
    ).toBeInTheDocument();
  });
});

import type { IncidentDetail, IncidentListItem } from "@fieldassist/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { incidentsApi } from "@/features/incidents/incidents-api";

import { SupervisorIncidentsPage } from "./incidents-page";

vi.mock("@/features/incidents/incidents-api", () => ({
  incidentQueryKeys: {
    detail: (incidentId: string) => ["incidents", "detail", incidentId],
    list: (status?: string) => ["incidents", "list", status ?? "all"],
  },
  incidentsApi: {
    create: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
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

const incidentListItem: IncidentListItem = {
  attachmentCount: 1,
  category: "MECHANICAL",
  createdAt: "2026-03-09T09:10:00.000Z",
  id: "incident-pump-seal-wear",
  reporter: {
    email: "technician@fieldassist.local",
    fullName: "Mara Ionescu",
    id: "user-tech-demo",
    role: "TECHNICIAN",
  },
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
  attachments: [
    {
      createdAt: "2026-03-09T09:18:00.000Z",
      id: "attachment-incident-pump-1",
      incidentReportId: "incident-pump-seal-wear",
      mimeType: "image/jpeg",
      originalFileName: "pump-seal-closeup.jpg",
      sizeBytes: 248731,
      storageKey:
        "local/incidents/incident-pump-seal-wear/pump-seal-closeup.jpg",
      uploadedBy: incidentListItem.reporter,
      workOrderId: "work-order-pump-2403",
    },
  ],
  details:
    "Seal wear is visible on the pump housing and vibration is above the morning baseline.",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("SupervisorIncidentsPage", () => {
  it("loads incident detail and saves triage updates", async () => {
    vi.mocked(incidentsApi.list).mockResolvedValue([incidentListItem]);
    vi.mocked(incidentsApi.getById).mockResolvedValue(incidentDetail);
    vi.mocked(incidentsApi.update).mockResolvedValue({
      ...incidentDetail,
      status: "ACKNOWLEDGED",
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <SupervisorIncidentsPage />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Seal wear detected during inspection",
      }),
    ).toBeInTheDocument();

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByLabelText("Incident lifecycle status"),
      "ACKNOWLEDGED",
    );
    await user.click(
      screen.getByRole("button", { name: "Save incident triage updates" }),
    );

    await waitFor(() => {
      expect(incidentsApi.update).toHaveBeenCalledWith(
        "incident-pump-seal-wear",
        {
          severity: "MEDIUM",
          status: "ACKNOWLEDGED",
        },
      );
    });

    expect(
      await screen.findByText("Incident triage updates saved."),
    ).toBeInTheDocument();
  });
});

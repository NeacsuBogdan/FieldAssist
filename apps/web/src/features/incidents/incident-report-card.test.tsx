import type { AttachmentMetadata, IncidentDetail, WorkOrderDetail } from "@fieldassist/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IncidentReportCard } from "@/features/incidents/incident-report-card";
import { incidentsApi } from "@/features/incidents/incidents-api";
import { uploadsApi } from "@/features/uploads/uploads-api";

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

vi.mock("@/features/uploads/uploads-api", () => ({
  uploadsApi: {
    uploadAttachment: vi.fn(),
  },
}));

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

const steps: WorkOrderDetail["steps"] = [
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
];

const createdIncident: IncidentDetail = {
  attachmentCount: 0,
  attachments: [],
  category: "MECHANICAL",
  createdAt: "2026-03-09T09:10:00.000Z",
  details:
    "Seal housing shows localized wear and vibration above the morning baseline.",
  id: "incident-pump-seal-wear",
  reporter: {
    email: "technician@fieldassist.local",
    fullName: "Mara Ionescu",
    id: "user-tech-demo",
    role: "TECHNICIAN",
  },
  severity: "HIGH",
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

const uploadedAttachment: AttachmentMetadata = {
  createdAt: "2026-03-09T09:18:00.000Z",
  id: "attachment-incident-pump-1",
  incidentReportId: "incident-pump-seal-wear",
  mimeType: "image/jpeg",
  originalFileName: "pump-seal-closeup.jpg",
  sizeBytes: 248731,
  storageKey: "local/incidents/incident-pump-seal-wear/pump-seal-closeup.jpg",
  uploadedBy: createdIncident.reporter,
  workOrderId: "work-order-pump-2403",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("IncidentReportCard", () => {
  it("creates an incident and uploads an attachment", async () => {
    vi.mocked(incidentsApi.create).mockResolvedValue(createdIncident);
    vi.mocked(uploadsApi.uploadAttachment).mockResolvedValue(uploadedAttachment);

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <IncidentReportCard
          currentStepId="execution-pump-2"
          steps={steps}
          workOrderId="work-order-pump-2403"
        />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();
    const file = new File(["pump-image"], "pump-seal-closeup.jpg", {
      type: "image/jpeg",
    });

    await user.selectOptions(screen.getByLabelText("Incident severity"), "HIGH");
    await user.clear(screen.getByLabelText("Incident summary"));
    await user.type(
      screen.getByLabelText("Incident summary"),
      "Seal wear detected during inspection",
    );
    await user.clear(screen.getByLabelText("Incident details"));
    await user.type(
      screen.getByLabelText("Incident details"),
      "Seal housing shows localized wear and vibration above the morning baseline.",
    );
    await user.upload(screen.getByLabelText("Incident attachment"), file);
    await user.click(
      screen.getByRole("button", { name: "Submit incident report" }),
    );

    await waitFor(() => {
      expect(incidentsApi.create).toHaveBeenCalledWith({
        category: "MECHANICAL",
        details:
          "Seal housing shows localized wear and vibration above the morning baseline.",
        severity: "HIGH",
        stepExecutionId: "execution-pump-2",
        summary: "Seal wear detected during inspection",
        workOrderId: "work-order-pump-2403",
      });
      expect(uploadsApi.uploadAttachment).toHaveBeenCalledWith({
        file,
        incidentReportId: "incident-pump-seal-wear",
        workOrderId: "work-order-pump-2403",
      });
    });

    expect(
      await screen.findByText(
        "Incident submitted and linked to the active work order.",
      ),
    ).toBeInTheDocument();
  });
});

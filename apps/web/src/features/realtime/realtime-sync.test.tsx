import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/auth-store";

import { RealtimeSync } from "./realtime-sync";

const socketHandlers = new Map<string, (payload?: unknown) => void>();

const socketMock = {
  close: vi.fn(),
  off: vi.fn((event: string) => {
    socketHandlers.delete(event);
    return socketMock;
  }),
  on: vi.fn((event: string, handler: (payload?: unknown) => void) => {
    socketHandlers.set(event, handler);
    return socketMock;
  }),
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => socketMock),
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

const renderWithProviders = (
  queryClient: QueryClient,
  children: ReactNode,
) =>
  render(
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  );

beforeEach(() => {
  socketHandlers.clear();
  socketMock.close.mockClear();
  socketMock.off.mockClear();
  socketMock.on.mockClear();
  useAuthStore.setState({
    token: "session-token",
    user: {
      email: "supervisor@fieldassist.local",
      fullName: "Alex Stan",
      id: "user-supervisor-demo",
      role: "SUPERVISOR",
    },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("RealtimeSync", () => {
  it("invalidates related queries when work order and incident events arrive", async () => {
    const queryClient = createTestQueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderWithProviders(
      queryClient,
      <RealtimeSync>
        <div>workspace</div>
      </RealtimeSync>,
    );

    socketHandlers.get("work-order.updated")?.({
      occurredAt: "2026-03-09T10:00:00.000Z",
      workOrderId: "work-order-pump-2403",
    });
    socketHandlers.get("incident.created")?.({
      incidentId: "incident-pump-seal-wear",
      occurredAt: "2026-03-09T10:01:00.000Z",
      workOrderId: "work-order-pump-2403",
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["work-order", "work-order-pump-2403"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["work-orders"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["incidents"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["incidents", "detail", "incident-pump-seal-wear"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["dashboard", "summary"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["dashboard", "activity"],
      });
    });
  });
});

import { useQueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { io } from "socket.io-client";

import { useAuthStore } from "@/features/auth/auth-store";
import { incidentQueryKeys } from "@/features/incidents/incidents-api";
import { useRealtimeStore } from "@/features/realtime/realtime-store";
import { workOrderQueryKeys } from "@/features/work-orders/work-orders-api";
import { env } from "@/lib/env";

type IncidentRealtimePayload = {
  incidentId: string;
  occurredAt: string;
  workOrderId: string;
};

type StepRealtimePayload = {
  occurredAt: string;
  stepExecutionId: string;
  workOrderId: string;
};

type WorkOrderRealtimePayload = {
  occurredAt: string;
  workOrderId: string;
};

const getSocketBaseUrl = () =>
  new URL(env.apiBaseUrl, window.location.origin).origin;

export const RealtimeSync = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const setRealtimeStatus = useRealtimeStore((state) => state.setStatus);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!token || !user) {
      setRealtimeStatus("offline");
      return;
    }

    setRealtimeStatus("connecting");

    const socket = io(getSocketBaseUrl(), {
      auth: {
        token,
      },
      transports: ["websocket"],
    });

    const invalidateDashboard = () => {
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", "activity"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", "summary"],
      });
    };

    const invalidateIncident = ({
      incidentId,
      workOrderId,
    }: IncidentRealtimePayload) => {
      void queryClient.invalidateQueries({
        queryKey: incidentQueryKeys.detail(incidentId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["incidents"],
      });
      void queryClient.invalidateQueries({
        queryKey: workOrderQueryKeys.detail(workOrderId),
      });
      void queryClient.invalidateQueries({
        queryKey: workOrderQueryKeys.list(),
      });
      invalidateDashboard();
    };

    const invalidateWorkOrder = ({ workOrderId }: WorkOrderRealtimePayload) => {
      void queryClient.invalidateQueries({
        queryKey: workOrderQueryKeys.detail(workOrderId),
      });
      void queryClient.invalidateQueries({
        queryKey: workOrderQueryKeys.list(),
      });
      invalidateDashboard();
    };

    const handleStepUpdated = ({ workOrderId }: StepRealtimePayload) => {
      invalidateWorkOrder({
        occurredAt: new Date().toISOString(),
        workOrderId,
      });
    };

    const handleConnect = () => {
      setRealtimeStatus("live");
    };

    const handleDisconnect = () => {
      setRealtimeStatus("offline");
    };

    socket.on("activity.logged", invalidateDashboard);
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleDisconnect);
    socket.on("dashboard.summary.updated", invalidateDashboard);
    socket.on("disconnect", handleDisconnect);
    socket.on("incident.created", invalidateIncident);
    socket.on("incident.updated", invalidateIncident);
    socket.on("step.updated", handleStepUpdated);
    socket.on("work-order.updated", invalidateWorkOrder);

    return () => {
      socket.off("activity.logged", invalidateDashboard);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleDisconnect);
      socket.off("dashboard.summary.updated", invalidateDashboard);
      socket.off("disconnect", handleDisconnect);
      socket.off("incident.created", invalidateIncident);
      socket.off("incident.updated", invalidateIncident);
      socket.off("step.updated", handleStepUpdated);
      socket.off("work-order.updated", invalidateWorkOrder);
      socket.close();
      setRealtimeStatus("offline");
    };
  }, [queryClient, setRealtimeStatus, token, user]);

  return children;
};

import type { UserRole } from "@fieldassist/shared";
import type { FastifyInstance } from "fastify";
import { Server } from "socket.io";

type AuthenticatedSocketContext = {
  role: UserRole;
  userId: string;
};

type ActivityLoggedPayload = {
  entityId: string;
  entityType: string;
  incidentId?: string;
  occurredAt: string;
  stepExecutionId?: string;
  workOrderId?: string;
};

type DashboardSummaryUpdatedPayload = {
  occurredAt: string;
};

type IncidentEventPayload = {
  incidentId: string;
  occurredAt: string;
  workOrderId: string;
};

type StepUpdatedPayload = {
  occurredAt: string;
  stepExecutionId: string;
  workOrderId: string;
};

type WorkOrderUpdatedPayload = {
  occurredAt: string;
  workOrderId: string;
};

type ClientToServerEvents = Record<string, never>;

type ServerToClientEvents = {
  "activity.logged": (payload: ActivityLoggedPayload) => void;
  "dashboard.summary.updated": (
    payload: DashboardSummaryUpdatedPayload,
  ) => void;
  "incident.created": (payload: IncidentEventPayload) => void;
  "incident.updated": (payload: IncidentEventPayload) => void;
  "step.updated": (payload: StepUpdatedPayload) => void;
  "work-order.updated": (payload: WorkOrderUpdatedPayload) => void;
};

type InterServerEvents = Record<string, never>;

type SocketData = {
  authContext?: AuthenticatedSocketContext;
};

export interface RealtimeGateway {
  close(): Promise<void>;
  emitActivityLogged(payload: ActivityLoggedPayload): void;
  emitDashboardSummaryUpdated(payload?: DashboardSummaryUpdatedPayload): void;
  emitIncidentCreated(payload: IncidentEventPayload): void;
  emitIncidentUpdated(payload: IncidentEventPayload): void;
  emitStepUpdated(payload: StepUpdatedPayload): void;
  emitWorkOrderUpdated(payload: WorkOrderUpdatedPayload): void;
}

const getSocketToken = (
  authorizationHeader: string | string[] | undefined,
  handshakeToken: unknown,
): string | null => {
  if (typeof handshakeToken === "string" && handshakeToken.trim().length > 0) {
    return handshakeToken.trim().replace(/^Bearer\s+/i, "");
  }

  if (typeof authorizationHeader === "string") {
    return authorizationHeader.replace(/^Bearer\s+/i, "").trim();
  }

  return null;
};

const createOccurredAt = () => new Date().toISOString();

export const createRealtimeGateway = ({
  app,
  corsOrigin,
}: {
  app: FastifyInstance;
  corsOrigin: string;
}): RealtimeGateway => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(app.server, {
    cors: {
      credentials: false,
      origin: corsOrigin,
    },
  });

  io.use((socket, next) => {
    try {
      const token = getSocketToken(
        socket.handshake.headers.authorization,
        socket.handshake.auth.token,
      );

      if (!token) {
        throw new Error("Authentication is required.");
      }

      const payload = app.jwt.verify<AuthenticatedSocketContext & {
        sub: string;
      }>(token);

      socket.data.authContext = {
        role: payload.role,
        userId: payload.sub,
      };

      next();
    } catch {
      next(new Error("Authentication is required."));
    }
  });

  io.on("connection", (socket) => {
    const authContext = socket.data.authContext;

    if (!authContext) {
      socket.disconnect();
      return;
    }

    void socket.join("authenticated");
    void socket.join(`role:${authContext.role}`);
    void socket.join(`user:${authContext.userId}`);
  });

  return {
    close: () =>
      new Promise((resolve) => {
        void io.close(() => resolve());
      }),
    emitActivityLogged: (payload) => {
      io.to("authenticated").emit("activity.logged", payload);
    },
    emitDashboardSummaryUpdated: (payload) => {
      io.to("authenticated").emit("dashboard.summary.updated", {
        occurredAt: createOccurredAt(),
        ...payload,
      });
    },
    emitIncidentCreated: (payload) => {
      io.to("authenticated").emit("incident.created", payload);
    },
    emitIncidentUpdated: (payload) => {
      io.to("authenticated").emit("incident.updated", payload);
    },
    emitStepUpdated: (payload) => {
      io.to("authenticated").emit("step.updated", payload);
    },
    emitWorkOrderUpdated: (payload) => {
      io.to("authenticated").emit("work-order.updated", payload);
    },
  };
};

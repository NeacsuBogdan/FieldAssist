import type { AuthUser } from "@fieldassist/shared";
import type { ReactElement } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { authApi } from "@/features/auth/auth-api";
import { useAuthStore } from "@/features/auth/auth-store";
import { LoginPage } from "@/pages/login-page";
import { SupervisorDashboardPage } from "@/pages/supervisor/dashboard-page";
import { SupervisorIncidentsPage } from "@/pages/supervisor/incidents-page";
import { TechnicianWorkOrdersPage } from "@/pages/technician/work-orders-page";
import { WorkOrderDetailPage } from "@/pages/work-order-detail-page";

const roleHomeMap: Record<AuthUser["role"], string> = {
  SUPERVISOR: "/app/dashboard",
  TECHNICIAN: "/app/work-orders",
};

const RequireAuth = ({
  allowedRoles,
}: {
  allowedRoles?: AuthUser["role"][];
}) => {
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate replace to={roleHomeMap[user.role]} />;
  }

  return (
    <AppShell
      onLogout={async () => {
        try {
          await authApi.logout();
        } finally {
          clearSession();
        }
      }}
      user={user}
    />
  );
};

const RequireRole = ({
  allowedRoles,
  element,
}: {
  allowedRoles: AuthUser["role"][];
  element: ReactElement;
}) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate replace to={roleHomeMap[user.role]} />;
  }

  return element;
};

const RoleHomeRedirect = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return <Navigate replace to={roleHomeMap[user.role]} />;
};

const router = createBrowserRouter([
  {
    element: <LoginPage />,
    path: "/login",
  },
  {
    children: [
      {
        element: <RoleHomeRedirect />,
        index: true,
      },
      {
        element: (
          <RequireRole
            allowedRoles={["TECHNICIAN"]}
            element={<TechnicianWorkOrdersPage />}
          />
        ),
        path: "work-orders",
      },
      {
        element: <WorkOrderDetailPage />,
        path: "work-orders/:id",
      },
      {
        element: (
          <RequireRole
            allowedRoles={["SUPERVISOR"]}
            element={<SupervisorDashboardPage />}
          />
        ),
        path: "dashboard",
      },
      {
        element: (
          <RequireRole
            allowedRoles={["SUPERVISOR"]}
            element={<SupervisorIncidentsPage />}
          />
        ),
        path: "incidents",
      },
    ],
    element: <RequireAuth />,
    path: "/app",
  },
  {
    element: <Navigate replace to="/app" />,
    path: "*",
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;

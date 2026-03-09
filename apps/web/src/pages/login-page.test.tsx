import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "@/features/auth/auth-api";
import { useAuthStore } from "@/features/auth/auth-store";

import { LoginPage } from "./login-page";

const navigateMock = vi.fn();

vi.mock("@/features/auth/auth-api", () => ({
  authApi: {
    login: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      retry: false,
    },
  },
});

const technicianUser = {
  email: "technician@fieldassist.local",
  fullName: "Mara Ionescu",
  id: "user-tech-demo",
  role: "TECHNICIAN" as const,
};

beforeEach(() => {
  navigateMock.mockReset();
  window.localStorage.clear();
  useAuthStore.setState({
    token: null,
    user: null,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("submits credentials and routes technicians into the workspace", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: "session-token",
      user: technicianUser,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const user = userEvent.setup();

    await user.clear(screen.getByLabelText("Email"));
    await user.type(
      screen.getByLabelText("Email"),
      "technician@fieldassist.local",
    );
    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "FieldAssist123!");
    await user.click(
      screen.getByRole("button", { name: "Sign in to FieldAssist" }),
    );

    await waitFor(() => {
      expect(vi.mocked(authApi.login).mock.calls[0]?.[0]).toEqual({
        email: "technician@fieldassist.local",
        password: "FieldAssist123!",
      });
    });
    expect(useAuthStore.getState()).toMatchObject({
      token: "session-token",
      user: technicianUser,
    });
    expect(navigateMock).toHaveBeenCalledWith("/app/work-orders", {
      replace: true,
    });
  });
});

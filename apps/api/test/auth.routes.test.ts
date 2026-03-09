import type { AuthSession, AuthUser, LoginRequest } from "@fieldassist/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import { UnauthorizedError } from "../src/lib/errors.js";
import type { AuthService } from "../src/modules/auth/auth.types.js";

const baseConfig: AppConfig = {
  CORS_ORIGIN: "http://localhost:5173",
  DATABASE_URL:
    "postgresql://fieldassist:fieldassist@localhost:5432/fieldassist_test?schema=public",
  HOST: "127.0.0.1",
  JWT_SECRET: "test-secret-with-at-least-32-characters",
  LOG_LEVEL: "error",
  NODE_ENV: "test",
  PORT: 4100,
  UPLOADS_DIR: "uploads-test",
};

const technicianUser: AuthUser = {
  email: "technician@fieldassist.local",
  fullName: "Mara Ionescu",
  id: "tech-1",
  role: "TECHNICIAN",
};

const supervisorUser: AuthUser = {
  email: "supervisor@fieldassist.local",
  fullName: "Alex Stan",
  id: "sup-1",
  role: "SUPERVISOR",
};

const createAuthServiceMock = (options?: {
  loginError?: Error;
}): {
  mocks: {
    getMe: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  service: AuthService;
} => {
  const getMe = vi.fn((userId: string) => {
    if (userId === supervisorUser.id) {
      return Promise.resolve(supervisorUser);
    }

    return Promise.resolve(technicianUser);
  });
  const login = vi.fn((input: LoginRequest): Promise<AuthSession> => {
    void input;

    if (options?.loginError) {
      return Promise.reject(options.loginError);
    }

    return Promise.resolve({
      token: "issued-from-service",
      user: technicianUser,
    });
  });
  const logout = vi.fn(() =>
    Promise.resolve({
      success: true as const,
    }),
  );

  return {
    mocks: {
      getMe,
      login,
      logout,
    },
    service: {
      getMe,
      login,
      logout,
    },
  };
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("auth routes", () => {
  it("returns a session for valid credentials", async () => {
    const auth = createAuthServiceMock();
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: auth.service,
      },
    });

    const response = await app.inject({
      method: "POST",
      payload: {
        email: "technician@fieldassist.local",
        password: "FieldAssist123!",
      },
      url: "/api/v1/auth/login",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        token: "issued-from-service",
        user: technicianUser,
      },
    });
    expect(auth.mocks.login.mock.calls).toEqual([
      [
        {
          email: "technician@fieldassist.local",
          password: "FieldAssist123!",
        },
      ],
    ]);

    await app.close();
  });

  it("rejects invalid credentials", async () => {
    const auth = createAuthServiceMock({
      loginError: new UnauthorizedError("Invalid email or password."),
    });

    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: auth.service,
      },
    });

    const response = await app.inject({
      method: "POST",
      payload: {
        email: "technician@fieldassist.local",
        password: "wrong-password",
      },
      url: "/api/v1/auth/login",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid email or password.",
      },
    });

    await app.close();
  });

  it("rejects unauthenticated access to /me", async () => {
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: createAuthServiceMock().service,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it("returns the current user for a valid token", async () => {
    const auth = createAuthServiceMock();
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: auth.service,
      },
    });
    const token = app.jwt.sign({
      role: technicianUser.role,
      sub: technicianUser.id,
    });

    const response = await app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: "/api/v1/auth/me",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: technicianUser,
    });
    expect(auth.mocks.getMe.mock.calls).toEqual([[technicianUser.id]]);

    await app.close();
  });

  it("blocks users that do not match the required role", async () => {
    const app = await buildApp({
      config: baseConfig,
      logger: false,
      services: {
        auth: createAuthServiceMock().service,
      },
    });
    app.get(
      "/test-only/supervisor",
      {
        preHandler: [app.authorize(["SUPERVISOR"])],
      },
      () => ({
        ok: true,
      }),
    );
    const token = app.jwt.sign({
      role: technicianUser.role,
      sub: technicianUser.id,
    });

    const response = await app.inject({
      headers: {
        authorization: `Bearer ${token}`,
      },
      method: "GET",
      url: "/test-only/supervisor",
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to access this resource.",
      },
    });

    await app.close();
  });
});

import {
  LoginResponseSchema,
  LogoutResponseSchema,
  MeResponseSchema,
  type AuthSession,
  type AuthUser,
  type LoginRequest,
} from "@fieldassist/shared";

import { apiClient } from "@/lib/api-client";

export const authApi = {
  login: async (input: LoginRequest): Promise<AuthSession> => {
    const response = LoginResponseSchema.parse(
      await apiClient.request("/auth/login", {
        body: input,
        method: "POST",
      }),
    );

    return response.data;
  },
  logout: async (): Promise<{
    success: true;
  }> => {
    const response = LogoutResponseSchema.parse(
      await apiClient.request("/auth/logout", {
        method: "POST",
      }),
    );

    return response.data;
  },
  me: async (): Promise<AuthUser> => {
    const response = MeResponseSchema.parse(
      await apiClient.request("/auth/me"),
    );

    return response.data;
  },
};

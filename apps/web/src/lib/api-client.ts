import { useAuthStore } from "@/features/auth/auth-store";

import { env } from "./env";

export class ApiError extends Error {
  public readonly code?: string;
  public readonly statusCode: number;

  public constructor(
    message: string,
    statusCode: number,
    options?: {
      code?: string;
    },
  ) {
    super(message);
    this.statusCode = statusCode;

    if (options?.code) {
      this.code = options.code;
    }
  }
}

const parseJson = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return null;
  }

  return response.json();
};

const getErrorDetails = (
  payload: unknown,
): {
  code?: string;
  message?: string;
} => {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return {};
  }

  const error = payload.error;

  if (!error || typeof error !== "object") {
    return {};
  }

  const details: {
    code?: string;
    message?: string;
  } = {};

  if ("code" in error && typeof error.code === "string") {
    details.code = error.code;
  }

  if ("message" in error && typeof error.message === "string") {
    details.message = error.message;
  }

  return details;
};

export const apiClient = {
  request: async (
    path: string,
    options?: Omit<RequestInit, "body"> & {
      body?: unknown;
    },
  ): Promise<unknown> => {
    const headers = new Headers(options?.headers);
    const token = useAuthStore.getState().token;

    if (options?.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const { body, ...restOptions } = options ?? {};

    const requestInit: RequestInit = {
      ...restOptions,
      headers,
    };

    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }

    const response = await fetch(`${env.apiBaseUrl}${path}`, requestInit);
    const payload = await parseJson(response);
    const errorDetails = getErrorDetails(payload);

    if (!response.ok) {
      if (response.status === 401) {
        useAuthStore.getState().clearSession();
      }

      throw new ApiError(
        errorDetails.message ?? "Request failed.",
        response.status,
        {
          ...(errorDetails.code ? { code: errorDetails.code } : {}),
        },
      );
    }

    return payload;
  },
};

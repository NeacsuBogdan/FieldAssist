import {
  CreateIncidentRequestSchema,
  IncidentDetailResponseSchema,
  IncidentListResponseSchema,
  UpdateIncidentRequestSchema,
  type CreateIncidentRequest,
  type IncidentDetail,
  type IncidentListItem,
  type IncidentStatus,
  type UpdateIncidentRequest,
} from "@fieldassist/shared";

import { apiClient } from "@/lib/api-client";

export const incidentQueryKeys = {
  detail: (incidentId: string) => ["incidents", "detail", incidentId] as const,
  list: (status?: IncidentStatus) =>
    ["incidents", "list", status ?? "all"] as const,
};

export const incidentsApi = {
  create: async (payload: CreateIncidentRequest): Promise<IncidentDetail> => {
    const body = CreateIncidentRequestSchema.parse(payload);
    const response = IncidentDetailResponseSchema.parse(
      await apiClient.request("/incidents", {
        body,
        method: "POST",
      }),
    );

    return response.data;
  },
  getById: async (incidentId: string): Promise<IncidentDetail> => {
    const response = IncidentDetailResponseSchema.parse(
      await apiClient.request(`/incidents/${incidentId}`),
    );

    return response.data;
  },
  list: async (status?: IncidentStatus): Promise<IncidentListItem[]> => {
    const query = status ? `?status=${status}` : "";
    const response = IncidentListResponseSchema.parse(
      await apiClient.request(`/incidents${query}`),
    );

    return response.data;
  },
  update: async (
    incidentId: string,
    payload: UpdateIncidentRequest,
  ): Promise<IncidentDetail> => {
    const body = UpdateIncidentRequestSchema.parse(payload);
    const response = IncidentDetailResponseSchema.parse(
      await apiClient.request(`/incidents/${incidentId}`, {
        body,
        method: "PATCH",
      }),
    );

    return response.data;
  },
};

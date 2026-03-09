import {
  ActivityLogResponseSchema,
  DashboardSummaryResponseSchema,
  type ActivityLogItem,
  type DashboardSummary,
} from "@fieldassist/shared";

import { apiClient } from "@/lib/api-client";

export const dashboardApi = {
  getActivity: async (): Promise<ActivityLogItem[]> => {
    const response = ActivityLogResponseSchema.parse(
      await apiClient.request("/dashboard/activity"),
    );

    return response.data;
  },
  getSummary: async (): Promise<DashboardSummary> => {
    const response = DashboardSummaryResponseSchema.parse(
      await apiClient.request("/dashboard/summary"),
    );

    return response.data;
  },
};

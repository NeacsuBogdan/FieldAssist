import {
  WorkOrderDetailResponseSchema,
  WorkOrderListResponseSchema,
  type WorkOrderDetail,
  type WorkOrderListItem,
} from "@fieldassist/shared";

import { apiClient } from "@/lib/api-client";

export const workOrdersApi = {
  getById: async (workOrderId: string): Promise<WorkOrderDetail> => {
    const response = WorkOrderDetailResponseSchema.parse(
      await apiClient.request(`/work-orders/${workOrderId}`),
    );

    return response.data;
  },
  list: async (): Promise<WorkOrderListItem[]> => {
    const response = WorkOrderListResponseSchema.parse(
      await apiClient.request("/work-orders"),
    );

    return response.data;
  },
};

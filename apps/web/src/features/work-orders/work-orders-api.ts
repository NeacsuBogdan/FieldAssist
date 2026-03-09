import {
  WorkOrderDetailResponseSchema,
  WorkOrderListResponseSchema,
  type UpdateStepRequest,
  type WorkOrderDetail,
  type WorkOrderListItem,
} from "@fieldassist/shared";

import { apiClient } from "@/lib/api-client";

const parseWorkOrderDetail = async (path: string, options?: Parameters<typeof apiClient.request>[1]) => {
  const response = WorkOrderDetailResponseSchema.parse(
    await apiClient.request(path, options),
  );

  return response.data;
};

export const workOrderQueryKeys = {
  detail: (workOrderId: string) => ["work-order", workOrderId] as const,
  list: () => ["work-orders"] as const,
};

export const workOrdersApi = {
  completeStep: (
    workOrderId: string,
    stepExecutionId: string,
    body?: UpdateStepRequest,
  ): Promise<WorkOrderDetail> =>
    parseWorkOrderDetail(
      `/work-orders/${workOrderId}/steps/${stepExecutionId}/complete`,
      {
        body,
        method: "POST",
      },
    ),
  completeWorkOrder: (workOrderId: string): Promise<WorkOrderDetail> =>
    parseWorkOrderDetail(`/work-orders/${workOrderId}/complete`, {
      method: "POST",
    }),
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
  pauseWorkOrder: (workOrderId: string): Promise<WorkOrderDetail> =>
    parseWorkOrderDetail(`/work-orders/${workOrderId}/pause`, {
      method: "POST",
    }),
  startStep: (
    workOrderId: string,
    stepExecutionId: string,
  ): Promise<WorkOrderDetail> =>
    parseWorkOrderDetail(
      `/work-orders/${workOrderId}/steps/${stepExecutionId}/start`,
      {
        method: "POST",
      },
    ),
  startWorkOrder: (workOrderId: string): Promise<WorkOrderDetail> =>
    parseWorkOrderDetail(`/work-orders/${workOrderId}/start`, {
      method: "POST",
    }),
  updateStep: (
    workOrderId: string,
    stepExecutionId: string,
    body: UpdateStepRequest,
  ): Promise<WorkOrderDetail> =>
    parseWorkOrderDetail(`/work-orders/${workOrderId}/steps/${stepExecutionId}`, {
      body,
      method: "PATCH",
    }),
};

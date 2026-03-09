import {
  AttachmentUploadResponseSchema,
  type AttachmentMetadata,
} from "@fieldassist/shared";

import { apiClient } from "@/lib/api-client";

export const uploadsApi = {
  uploadAttachment: async ({
    file,
    incidentReportId,
    workOrderId,
  }: {
    file: File;
    incidentReportId?: string | null;
    workOrderId?: string | null;
  }): Promise<AttachmentMetadata> => {
    const formData = new FormData();

    formData.append("file", file);

    if (incidentReportId) {
      formData.append("incidentReportId", incidentReportId);
    }

    if (workOrderId) {
      formData.append("workOrderId", workOrderId);
    }

    const response = AttachmentUploadResponseSchema.parse(
      await apiClient.request("/uploads", {
        body: formData,
        method: "POST",
      }),
    );

    return response.data;
  },
};

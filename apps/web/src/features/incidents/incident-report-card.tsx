import type { WorkOrderDetail } from "@fieldassist/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/select-input";
import { TextArea } from "@/components/ui/text-area";
import { TextInput } from "@/components/ui/text-input";
import { incidentsApi } from "@/features/incidents/incidents-api";
import { uploadsApi } from "@/features/uploads/uploads-api";
import { workOrderQueryKeys } from "@/features/work-orders/work-orders-api";
import { ApiError } from "@/lib/api-client";

const severityOptions = [
  {
    label: "Low",
    value: "LOW",
  },
  {
    label: "Medium",
    value: "MEDIUM",
  },
  {
    label: "High",
    value: "HIGH",
  },
  {
    label: "Critical",
    value: "CRITICAL",
  },
] as const;

type FeedbackState =
  | {
      message: string;
      tone: "error" | "success" | "warning";
    }
  | null;

export const IncidentReportCard = ({
  currentStepId,
  steps,
  workOrderId,
}: {
  currentStepId?: string | null;
  steps: WorkOrderDetail["steps"];
  workOrderId: string;
}) => {
  const queryClient = useQueryClient();
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [category, setCategory] = useState("MECHANICAL");
  const [details, setDetails] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [selectedStepId, setSelectedStepId] = useState(currentStepId ?? "");
  const [severity, setSeverity] =
    useState<(typeof severityOptions)[number]["value"]>("MEDIUM");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    setSelectedStepId((currentValue) => {
      if (currentValue && steps.some((step) => step.id === currentValue)) {
        return currentValue;
      }

      return currentStepId ?? "";
    });
  }, [currentStepId, steps]);

  const createIncidentMutation = useMutation<
    {
      incidentId: string;
      warningMessage?: string;
    },
    Error,
    void
  >({
    mutationFn: async () => {
      const incident = await incidentsApi.create({
        category,
        details,
        severity,
        stepExecutionId: selectedStepId || null,
        summary,
        workOrderId,
      });

      let warningMessage: string | undefined;

      if (attachmentFile) {
        try {
          await uploadsApi.uploadAttachment({
            file: attachmentFile,
            incidentReportId: incident.id,
            workOrderId,
          });
        } catch (error) {
          warningMessage =
            error instanceof ApiError
              ? `Incident created, but attachment upload failed: ${error.message}`
              : "Incident created, but attachment upload failed.";
        }
      }

      return {
        incidentId: incident.id,
        ...(warningMessage
          ? {
              warningMessage,
            }
          : {}),
      };
    },
    onError: (error) => {
      setFeedback({
        message:
          error instanceof ApiError
            ? error.message
            : "The incident could not be submitted.",
        tone: "error",
      });
    },
    onSuccess: async ({ warningMessage }) => {
      setCategory("MECHANICAL");
      setDetails("");
      setFeedback({
        message:
          warningMessage ??
          "Incident submitted and linked to the active work order.",
        tone: warningMessage ? "warning" : "success",
      });
      setSelectedStepId(currentStepId ?? "");
      setSeverity("MEDIUM");
      setSummary("");
      setAttachmentFile(null);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: workOrderQueryKeys.detail(workOrderId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "summary"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["incidents"],
        }),
      ]);
    },
  });

  return (
    <section className="panel grid gap-5 p-6">
      <div>
        <span className="data-label">Incident reporting</span>
        <h3 className="mt-2 text-2xl font-semibold text-steel-900">
          Escalate the current issue
        </h3>
        <p className="mt-3 text-sm leading-6 text-steel-600">
          Capture the problem while you are still on the job so supervisors can
          triage it with the work order context attached.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectInput
          aria-label="Incident severity"
          data-voice-label="incident severity"
          label="Severity"
          onChange={(event) => {
            setFeedback(null);
            setSeverity(event.target.value as (typeof severityOptions)[number]["value"]);
          }}
          options={severityOptions.map((option) => ({
            label: option.label,
            value: option.value,
          }))}
          value={severity}
        />
        <SelectInput
          aria-label="Linked workflow step"
          data-voice-label="incident linked step"
          label="Linked step"
          onChange={(event) => {
            setFeedback(null);
            setSelectedStepId(event.target.value);
          }}
          options={[
            {
              label: "Entire work order",
              value: "",
            },
            ...steps.map((step) => ({
              label: `Step ${step.order} - ${step.title}`,
              value: step.id,
            })),
          ]}
          value={selectedStepId}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          aria-label="Incident category"
          data-voice-label="incident category"
          label="Category"
          onChange={(event) => {
            setFeedback(null);
            setCategory(event.target.value);
          }}
          placeholder="MECHANICAL"
          value={category}
        />
        <TextInput
          aria-label="Incident summary"
          data-voice-label="incident summary"
          label="Summary"
          onChange={(event) => {
            setFeedback(null);
            setSummary(event.target.value);
          }}
          placeholder="Describe the immediate issue"
          value={summary}
        />
      </div>

      <TextArea
        aria-label="Incident details"
        data-voice-label="incident details"
        label="Details"
        onChange={(event) => {
          setFeedback(null);
          setDetails(event.target.value);
        }}
        placeholder="Capture what you observed, the local impact, and anything the supervisor should know before triage."
        rows={6}
        value={details}
      />

      <label className="grid gap-2 rounded-3xl border border-dashed border-steel-200 bg-steel-50/70 p-4 text-sm text-steel-600">
        <span className="font-medium text-steel-900">Attachment</span>
        <span>
          Optional photo or supporting file. The MVP stores uploads locally and
          records the attachment metadata on the incident.
        </span>
        <input
          aria-label="Incident attachment"
          className="text-sm text-steel-600 file:mr-4 file:rounded-2xl file:border-0 file:bg-steel-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-steel-700"
          onChange={(event) => {
            setFeedback(null);
            setAttachmentFile(event.target.files?.[0] ?? null);
          }}
          type="file"
        />
        {attachmentFile ? (
          <span className="text-sm text-steel-700">
            Selected: {attachmentFile.name}
          </span>
        ) : null}
      </label>

      {feedback ? (
        <div
          className={`rounded-3xl px-4 py-3 text-sm ${
            feedback.tone === "error"
              ? "border border-rose-200 bg-rose-50 text-rose-700"
              : feedback.tone === "warning"
                ? "border border-amber-200 bg-amber-50 text-amber-800"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          aria-label="Submit incident report"
          data-voice-label="submit incident report"
          disabled={
            createIncidentMutation.isPending ||
            category.trim().length === 0 ||
            details.trim().length === 0 ||
            summary.trim().length === 0
          }
          onClick={() => {
            createIncidentMutation.mutate();
          }}
        >
          {createIncidentMutation.isPending
            ? "Submitting incident..."
            : "Submit incident"}
        </Button>
        <Button
          aria-label="Clear incident form"
          data-voice-label="clear incident form"
          disabled={createIncidentMutation.isPending}
          onClick={() => {
            setAttachmentFile(null);
            setCategory("MECHANICAL");
            setDetails("");
            setFeedback(null);
            setSelectedStepId(currentStepId ?? "");
            setSeverity("MEDIUM");
            setSummary("");
          }}
          variant="secondary"
        >
          Clear form
        </Button>
      </div>
    </section>
  );
};

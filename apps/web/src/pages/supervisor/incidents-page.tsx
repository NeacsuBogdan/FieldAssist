import type { IncidentDetail, IncidentListItem } from "@fieldassist/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { ErrorPanel } from "@/components/states/error-panel";
import { LoadingPanel } from "@/components/states/loading-panel";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/select-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { incidentQueryKeys, incidentsApi } from "@/features/incidents/incidents-api";
import { ApiError } from "@/lib/api-client";

const severityOptions = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" },
] as const;

const statusOptions = [
  { label: "Open", value: "OPEN" },
  { label: "Acknowledged", value: "ACKNOWLEDGED" },
  { label: "Resolved", value: "RESOLVED" },
] as const;

type FeedbackState =
  | {
      message: string;
      tone: "error" | "success";
    }
  | null;

const formatFileSize = (value: number) => {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const SupervisorIncidentsPage = () => {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null,
  );
  const [selectedSeverity, setSelectedSeverity] =
    useState<(typeof severityOptions)[number]["value"]>("MEDIUM");
  const [selectedStatus, setSelectedStatus] =
    useState<(typeof statusOptions)[number]["value"]>("OPEN");

  const incidentsQuery = useQuery<IncidentListItem[]>({
    queryFn: () => incidentsApi.list(),
    queryKey: incidentQueryKeys.list(),
  });

  useEffect(() => {
    if (!incidentsQuery.data) {
      return;
    }

    const selectedStillExists = incidentsQuery.data.some(
      (incident) => incident.id === selectedIncidentId,
    );

    if (!selectedStillExists) {
      setSelectedIncidentId(incidentsQuery.data[0]?.id ?? null);
    }
  }, [incidentsQuery.data, selectedIncidentId]);

  const incidentDetailQuery = useQuery<IncidentDetail>({
    enabled: Boolean(selectedIncidentId),
    queryFn: () => incidentsApi.getById(selectedIncidentId ?? ""),
    queryKey: selectedIncidentId
      ? incidentQueryKeys.detail(selectedIncidentId)
      : ["incidents", "detail", "missing-id"],
  });

  useEffect(() => {
    if (!incidentDetailQuery.data) {
      return;
    }

    setSelectedSeverity(incidentDetailQuery.data.severity);
    setSelectedStatus(incidentDetailQuery.data.status);
  }, [incidentDetailQuery.data]);

  const updateIncidentMutation = useMutation<
    IncidentDetail,
    Error,
    {
      incidentId: string;
      severity: (typeof severityOptions)[number]["value"];
      status: (typeof statusOptions)[number]["value"];
    }
  >({
    mutationFn: ({ incidentId, severity, status }) =>
      incidentsApi.update(incidentId, {
        severity,
        status,
      }),
    onError: (error) => {
      setFeedback({
        message:
          error instanceof ApiError
            ? error.message
            : "Incident triage updates could not be saved.",
        tone: "error",
      });
    },
    onSuccess: async (updatedIncident) => {
      setFeedback({
        message: "Incident triage updates saved.",
        tone: "success",
      });
      queryClient.setQueryData(
        incidentQueryKeys.detail(updatedIncident.id),
        updatedIncident,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: incidentQueryKeys.list(),
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "summary"],
        }),
      ]);
    },
  });

  if (incidentsQuery.isPending) {
    return (
      <LoadingPanel
        subtitle="Loading open incidents, triage state, and attachment context from the operations API."
        title="Building incident workspace"
      />
    );
  }

  if (incidentsQuery.isError) {
    return (
      <ErrorPanel
        description="The incident workspace could not be loaded from the API."
        onRetry={() => {
          void incidentsQuery.refetch();
        }}
        title="Incidents are unavailable"
      />
    );
  }

  const selectedIncident = incidentDetailQuery.data ?? null;
  const hasIncidentUpdates =
    selectedIncident !== null &&
    (selectedSeverity !== selectedIncident.severity ||
      selectedStatus !== selectedIncident.status);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="data-label">Supervisor incidents</span>
          <h2 className="mt-2 text-3xl font-semibold text-steel-900">
            Incident workspace
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-steel-600">
          Review frontline incident reports, adjust severity and lifecycle
          state, and keep the team aligned on open operational risk.
        </p>
      </div>

      {incidentsQuery.data.length === 0 ? (
        <div className="panel grid gap-3 p-6">
          <h3 className="text-2xl font-semibold text-steel-900">
            No incidents reported
          </h3>
          <p className="text-sm leading-6 text-steel-600">
            Incident cards will appear here as technicians escalate issues from
            their work orders.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="panel grid gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="data-label">Open queue</span>
                <h3 className="mt-2 text-2xl font-semibold text-steel-900">
                  Reported incidents
                </h3>
              </div>
              <div className="rounded-2xl bg-steel-900 px-3 py-2 text-white">
                <div className="data-label text-white/60">Total</div>
                <div className="mt-1 text-xl font-semibold">
                  {incidentsQuery.data.length}
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {incidentsQuery.data.map((incident) => {
                const isSelected = incident.id === selectedIncidentId;

                return (
                  <button
                    className={`grid gap-3 rounded-3xl border p-5 text-left transition ${
                      isSelected
                        ? "border-steel-900 bg-steel-900 text-white"
                        : "border-steel-100 bg-steel-50/70 text-steel-900 hover:border-steel-200 hover:bg-white"
                    }`}
                    key={incident.id}
                    onClick={() => {
                      setFeedback(null);
                      setSelectedIncidentId(incident.id);
                    }}
                    type="button"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge
                        className={isSelected ? "bg-white/20 text-white" : ""}
                        value={incident.severity}
                      />
                      <StatusBadge
                        className={isSelected ? "bg-white/20 text-white" : ""}
                        value={incident.status}
                      />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {incident.summary}
                      </div>
                      <div
                        className={`mt-2 text-sm ${
                          isSelected ? "text-white/80" : "text-steel-600"
                        }`}
                      >
                        {incident.workOrder.code} - {incident.workOrder.title}
                      </div>
                    </div>
                    <div
                      className={`text-xs uppercase tracking-[0.24em] ${
                        isSelected ? "text-white/60" : "text-steel-400"
                      }`}
                    >
                      {new Date(incident.createdAt).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel grid gap-5 p-6">
            {incidentDetailQuery.isPending || !selectedIncident ? (
              <LoadingPanel
                subtitle="Loading the selected incident record and attachments."
                title="Opening incident"
              />
            ) : incidentDetailQuery.isError ? (
              <ErrorPanel
                description="The selected incident could not be loaded."
                onRetry={() => {
                  void incidentDetailQuery.refetch();
                }}
                title="Incident detail is unavailable"
              />
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="data-label">Selected incident</span>
                    <h3 className="mt-2 text-2xl font-semibold text-steel-900">
                      {selectedIncident.summary}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={selectedIncident.severity} />
                    <StatusBadge value={selectedIncident.status} />
                  </div>
                </div>

                <div className="grid gap-4 rounded-3xl bg-steel-50/80 p-5 md:grid-cols-2">
                  <div>
                    <div className="data-label">Work order</div>
                    <div className="mt-2 text-base font-semibold text-steel-900">
                      {selectedIncident.workOrder.code}
                    </div>
                    <div className="mt-1 text-sm text-steel-600">
                      {selectedIncident.workOrder.title}
                    </div>
                  </div>
                  <div>
                    <div className="data-label">Reporter</div>
                    <div className="mt-2 text-base font-semibold text-steel-900">
                      {selectedIncident.reporter.fullName}
                    </div>
                    <div className="mt-1 text-sm text-steel-600">
                      {selectedIncident.reporter.email}
                    </div>
                  </div>
                  <div>
                    <div className="data-label">Linked step</div>
                    <div className="mt-2 text-sm text-steel-600">
                      {selectedIncident.step
                        ? `Step ${selectedIncident.step.order} - ${selectedIncident.step.title}`
                        : "Applies to the entire work order"}
                    </div>
                  </div>
                  <div>
                    <div className="data-label">Reported</div>
                    <div className="mt-2 text-sm text-steel-600">
                      {new Date(selectedIncident.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="data-label">Details</div>
                  <p className="mt-2 text-sm leading-7 text-steel-700">
                    {selectedIncident.details}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <SelectInput
                    aria-label="Incident triage severity"
                    label="Severity"
                    onChange={(event) => {
                      setFeedback(null);
                      setSelectedSeverity(
                        event.target.value as (typeof severityOptions)[number]["value"],
                      );
                    }}
                    options={severityOptions}
                    value={selectedSeverity}
                  />
                  <SelectInput
                    aria-label="Incident lifecycle status"
                    label="Status"
                    onChange={(event) => {
                      setFeedback(null);
                      setSelectedStatus(
                        event.target.value as (typeof statusOptions)[number]["value"],
                      );
                    }}
                    options={statusOptions}
                    value={selectedStatus}
                  />
                </div>

                {feedback ? (
                  <div
                    className={`rounded-3xl px-4 py-3 text-sm ${
                      feedback.tone === "error"
                        ? "border border-rose-200 bg-rose-50 text-rose-700"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                    role={feedback.tone === "error" ? "alert" : "status"}
                  >
                    {feedback.message}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    aria-label="Save incident triage updates"
                    data-voice-label="save incident triage updates"
                    disabled={!hasIncidentUpdates || updateIncidentMutation.isPending}
                    onClick={() => {
                      updateIncidentMutation.mutate({
                        incidentId: selectedIncident.id,
                        severity: selectedSeverity,
                        status: selectedStatus,
                      });
                    }}
                  >
                    {updateIncidentMutation.isPending
                      ? "Saving updates..."
                      : "Save triage updates"}
                  </Button>
                  <Button
                    aria-label="Set incident to resolved"
                    data-voice-label="resolve incident"
                    disabled={
                      updateIncidentMutation.isPending ||
                      selectedStatus === "RESOLVED"
                    }
                    onClick={() => {
                      setSelectedStatus("RESOLVED");
                    }}
                    variant="secondary"
                  >
                    Mark resolved
                  </Button>
                </div>

                <div className="grid gap-3">
                  <div className="data-label">Attachments</div>
                  {selectedIncident.attachments.length > 0 ? (
                    selectedIncident.attachments.map((attachment) => (
                      <article
                        className="rounded-3xl border border-steel-100 bg-steel-50/70 p-4"
                        key={attachment.id}
                      >
                        <div className="text-base font-semibold text-steel-900">
                          {attachment.originalFileName}
                        </div>
                        <div className="mt-2 text-sm text-steel-600">
                          {attachment.mimeType} - {formatFileSize(attachment.sizeBytes)}
                        </div>
                        <div className="mt-2 text-xs uppercase tracking-[0.24em] text-steel-400">
                          Uploaded by {attachment.uploadedBy.fullName}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-steel-200 bg-steel-50/60 px-4 py-5 text-sm text-steel-600">
                      No attachments uploaded for this incident.
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

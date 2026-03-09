import type { WorkOrderDetail, WorkOrderListItem } from "@fieldassist/shared";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { ErrorPanel } from "@/components/states/error-panel";
import { LoadingPanel } from "@/components/states/loading-panel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextArea } from "@/components/ui/text-area";
import { useAuthStore } from "@/features/auth/auth-store";
import {
  workOrderQueryKeys,
  workOrdersApi,
} from "@/features/work-orders/work-orders-api";
import { ApiError } from "@/lib/api-client";

type WorkOrderMutationInput =
  | {
      kind: "complete-step";
      notes: string;
      stepExecutionId: string;
    }
  | {
      kind: "complete-work-order";
    }
  | {
      kind: "pause-work-order";
    }
  | {
      kind: "save-step-notes";
      notes: string;
      stepExecutionId: string;
    }
  | {
      kind: "start-step";
      stepExecutionId: string;
    }
  | {
      kind: "start-work-order";
    };

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "No due time";

const isFinishedStep = (status: WorkOrderDetail["steps"][number]["status"]) =>
  status === "COMPLETED" || status === "SKIPPED";

const getActionableStep = (workOrder: WorkOrderDetail) =>
  workOrder.steps.find((step) => step.status === "IN_PROGRESS") ??
  workOrder.steps.find((step) => step.status === "PENDING") ??
  null;

const createStepDrafts = (workOrder: WorkOrderDetail) =>
  Object.fromEntries(
    workOrder.steps.map((step) => [step.id, step.notes ?? ""]),
  ) as Record<string, string>;

const normalizeNotes = (notes: string) => {
  const trimmed = notes.trim();

  return trimmed.length > 0 ? trimmed : null;
};

const syncWorkOrderCache = (
  queryClient: QueryClient,
  updatedWorkOrder: WorkOrderDetail,
) => {
  queryClient.setQueryData(
    workOrderQueryKeys.detail(updatedWorkOrder.id),
    updatedWorkOrder,
  );
  queryClient.setQueryData<WorkOrderListItem[] | undefined>(
    workOrderQueryKeys.list(),
    (currentWorkOrders) =>
      currentWorkOrders?.map((item) =>
        item.id === updatedWorkOrder.id ? updatedWorkOrder : item,
      ),
  );
};

const describeNextAction = (workOrder: WorkOrderDetail) => {
  if (workOrder.status === "COMPLETED") {
    return "Workflow complete";
  }

  const currentStep = getActionableStep(workOrder);

  if (!currentStep) {
    return "Awaiting workflow action";
  }

  if (currentStep.status === "IN_PROGRESS") {
    return `Current step: ${currentStep.title}`;
  }

  return `Next step: ${currentStep.title}`;
};

export const WorkOrderDetailPage = () => {
  const params = useParams();
  const workOrderId = params.id;
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [actionError, setActionError] = useState<string | null>(null);
  const [draftNotesByStepId, setDraftNotesByStepId] = useState<
    Record<string, string>
  >({});

  const workOrderQuery = useQuery<WorkOrderDetail>({
    enabled: Boolean(workOrderId),
    queryFn: () => workOrdersApi.getById(workOrderId ?? ""),
    queryKey: workOrderId
      ? workOrderQueryKeys.detail(workOrderId)
      : ["work-order", "missing-id"],
  });

  useEffect(() => {
    if (!workOrderQuery.data) {
      return;
    }

    setDraftNotesByStepId(createStepDrafts(workOrderQuery.data));
  }, [workOrderQuery.data]);

  const actionMutation = useMutation<WorkOrderDetail, Error, WorkOrderMutationInput>(
    {
      mutationFn: async (input) => {
        if (!workOrderId) {
          throw new Error("A work order identifier is required.");
        }

        switch (input.kind) {
          case "complete-step":
            return workOrdersApi.completeStep(workOrderId, input.stepExecutionId, {
              notes: normalizeNotes(input.notes),
            });
          case "complete-work-order":
            return workOrdersApi.completeWorkOrder(workOrderId);
          case "pause-work-order":
            return workOrdersApi.pauseWorkOrder(workOrderId);
          case "save-step-notes":
            return workOrdersApi.updateStep(workOrderId, input.stepExecutionId, {
              notes: normalizeNotes(input.notes),
            });
          case "start-step":
            return workOrdersApi.startStep(workOrderId, input.stepExecutionId);
          case "start-work-order":
            return workOrdersApi.startWorkOrder(workOrderId);
        }
      },
      onError: (error) => {
        setActionError(
          error instanceof ApiError
            ? error.message
            : "The requested work order action could not be completed.",
        );
      },
      onSuccess: (updatedWorkOrder) => {
        setActionError(null);
        syncWorkOrderCache(queryClient, updatedWorkOrder);
        setDraftNotesByStepId(createStepDrafts(updatedWorkOrder));
      },
    },
  );

  if (!workOrderId) {
    return (
      <ErrorPanel
        description="The requested work order is missing an identifier."
        title="Work order not found"
      />
    );
  }

  if (workOrderQuery.isPending) {
    return (
      <LoadingPanel
        subtitle="Loading asset context, workflow steps, and incident visibility for this order."
        title="Opening work order"
      />
    );
  }

  if (workOrderQuery.isError) {
    return (
      <ErrorPanel
        description="The requested work order could not be loaded."
        onRetry={() => {
          void workOrderQuery.refetch();
        }}
        title="Unable to open work order"
      />
    );
  }

  const workOrder = workOrderQuery.data;
  const isTechnician = user?.role === "TECHNICIAN";
  const currentStep = getActionableStep(workOrder);
  const allStepsComplete = workOrder.steps.every((step) =>
    isFinishedStep(step.status),
  );
  const currentStepNotes = currentStep ? draftNotesByStepId[currentStep.id] ?? "" : "";
  const hasCurrentStepNoteChanges = currentStep
    ? currentStepNotes !== (currentStep.notes ?? "")
    : false;
  const latestIncident = workOrder.incidents[0] ?? null;
  const actionState = actionMutation.variables;

  const isPendingAction = (
    kind: WorkOrderMutationInput["kind"],
    stepExecutionId?: string,
  ) => {
    if (!actionMutation.isPending || !actionState || actionState.kind !== kind) {
      return false;
    }

    if (!stepExecutionId) {
      return true;
    }

    return "stepExecutionId" in actionState
      ? actionState.stepExecutionId === stepExecutionId
      : false;
  };

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="panel grid gap-6 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="data-label">{workOrder.code}</span>
            <StatusBadge value={workOrder.status} />
            <StatusBadge value={workOrder.priority} />
            <span className="rounded-full bg-steel-100 px-3 py-1 text-xs font-medium text-steel-700">
              {describeNextAction(workOrder)}
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-semibold text-steel-900">
              {workOrder.title}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-steel-600">
              {workOrder.description}
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-steel-900 p-5 text-white">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="data-label text-white/60">Workflow progress</div>
                <div className="mt-2 text-4xl font-semibold">
                  {workOrder.progressPercent}%
                </div>
              </div>
              <div className="text-sm text-white/70">
                {workOrder.steps.filter((step) => isFinishedStep(step.status)).length}{" "}
                of {workOrder.steps.length} steps closed
              </div>
            </div>
            <div
              aria-label={`Workflow progress ${workOrder.progressPercent} percent`}
              className="h-3 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-amber-400 transition-[width]"
                style={{
                  width: `${workOrder.progressPercent}%`,
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-steel-50 p-4">
              <div className="data-label">Asset</div>
              <div className="mt-2 text-lg font-semibold text-steel-900">
                {workOrder.asset.name}
              </div>
              <div className="mt-1 text-sm text-steel-600">
                {workOrder.asset.location}
              </div>
            </div>
            <div className="rounded-3xl bg-steel-50 p-4">
              <div className="data-label">Template</div>
              <div className="mt-2 text-lg font-semibold text-steel-900">
                {workOrder.template.name}
              </div>
              <div className="mt-1 text-sm text-steel-600">
                {workOrder.template.description}
              </div>
            </div>
            <div className="rounded-3xl bg-steel-50 p-4">
              <div className="data-label">Due</div>
              <div className="mt-2 text-lg font-semibold text-steel-900">
                {formatDateTime(workOrder.dueAt)}
              </div>
              <div className="mt-1 text-sm text-steel-600">
                Assigned to {workOrder.assignedTechnician.fullName}
              </div>
            </div>
          </div>

          {isTechnician ? (
            <div className="flex flex-wrap gap-3 border-t border-steel-100 pt-2">
              {allStepsComplete && workOrder.status !== "COMPLETED" ? (
                <Button
                  aria-label="Complete work order"
                  data-voice-label="complete work order"
                  disabled={actionMutation.isPending}
                  onClick={() => {
                    actionMutation.mutate({
                      kind: "complete-work-order",
                    });
                  }}
                >
                  {isPendingAction("complete-work-order")
                    ? "Closing order..."
                    : "Complete work order"}
                </Button>
              ) : null}

              {workOrder.status === "ASSIGNED" ? (
                <Button
                  aria-label="Start work order"
                  data-voice-label="start work order"
                  disabled={actionMutation.isPending}
                  onClick={() => {
                    actionMutation.mutate({
                      kind: "start-work-order",
                    });
                  }}
                >
                  {isPendingAction("start-work-order")
                    ? "Starting order..."
                    : "Start work order"}
                </Button>
              ) : null}

              {workOrder.status === "PAUSED" && !allStepsComplete ? (
                <Button
                  aria-label="Resume work order"
                  data-voice-label="resume work order"
                  disabled={actionMutation.isPending}
                  onClick={() => {
                    actionMutation.mutate({
                      kind: "start-work-order",
                    });
                  }}
                >
                  {isPendingAction("start-work-order")
                    ? "Resuming order..."
                    : "Resume work order"}
                </Button>
              ) : null}

              {workOrder.status === "IN_PROGRESS" ? (
                <Button
                  aria-label="Pause work order"
                  data-voice-label="pause work order"
                  disabled={actionMutation.isPending}
                  onClick={() => {
                    actionMutation.mutate({
                      kind: "pause-work-order",
                    });
                  }}
                  variant="secondary"
                >
                  {isPendingAction("pause-work-order")
                    ? "Pausing order..."
                    : "Pause work order"}
                </Button>
              ) : null}
            </div>
          ) : null}

          {actionError ? (
            <div
              aria-live="polite"
              className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {actionError}
            </div>
          ) : null}
        </div>

        <aside className="panel grid gap-5 p-6">
          <div>
            <div className="data-label">
              {isTechnician ? "Execution focus" : "Supervisor view"}
            </div>
            <h3 className="mt-2 text-2xl font-semibold text-steel-900">
              {isTechnician
                ? currentStep
                  ? currentStep.status === "IN_PROGRESS"
                    ? "Stay on the active step"
                    : "Prepare the next step"
                  : "Work order ready for closure"
                : "Live work order context"}
            </h3>
            <p className="mt-3 text-sm leading-6 text-steel-600">
              {isTechnician
                ? "Primary actions stay centered on the current step so the workflow remains readable on a narrow device or headset companion display."
                : "Review the assigned technician, incident state, and current workflow progress from a single overview panel."}
            </p>
          </div>

          <div className="grid gap-4 rounded-3xl bg-steel-50/80 p-4">
            <div>
              <div className="data-label">Assigned technician</div>
              <div className="mt-2 text-lg font-semibold text-steel-900">
                {workOrder.assignedTechnician.fullName}
              </div>
              <div className="mt-1 text-sm text-steel-600">
                {workOrder.assignedTechnician.email}
              </div>
            </div>
            <div>
              <div className="data-label">Latest incident</div>
              {latestIncident ? (
                <div className="mt-2 grid gap-2 rounded-3xl bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={latestIncident.severity} />
                    <StatusBadge value={latestIncident.status} />
                  </div>
                  <div className="text-base font-semibold text-steel-900">
                    {latestIncident.summary}
                  </div>
                  <div className="text-sm text-steel-600">
                    {latestIncident.category}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-steel-600">
                  No incidents reported for this work order.
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="panel grid gap-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="data-label">Current execution</span>
              <h3 className="mt-2 text-2xl font-semibold text-steel-900">
                {currentStep ? currentStep.title : "Workflow complete"}
              </h3>
            </div>
            {currentStep ? <StatusBadge value={currentStep.status} /> : null}
          </div>

          {currentStep ? (
            <>
              <div className="grid gap-4 rounded-3xl bg-steel-50/80 p-5">
                <div>
                  <div className="data-label">Instruction</div>
                  <p className="mt-2 text-sm leading-7 text-steel-700">
                    {currentStep.instruction}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="data-label">Expected outcome</div>
                    <div className="mt-2 text-sm text-steel-600">
                      {currentStep.expectedOutcome ??
                        "No expected outcome captured for this step."}
                    </div>
                  </div>
                  <div>
                    <div className="data-label">Voice label</div>
                    <div className="mt-2 text-sm font-medium text-steel-900">
                      {currentStep.voiceLabel ?? "Not configured"}
                    </div>
                  </div>
                </div>
              </div>

              <TextArea
                aria-label="Current step notes"
                data-voice-label="step notes"
                disabled={
                  !isTechnician ||
                  workOrder.status !== "IN_PROGRESS" ||
                  currentStep.status !== "IN_PROGRESS"
                }
                label="Step notes"
                onChange={(event) => {
                  setActionError(null);
                  setDraftNotesByStepId((currentDrafts) => ({
                    ...currentDrafts,
                    [currentStep.id]: event.target.value,
                  }));
                }}
                placeholder="Capture observations, measurements, or follow-up details."
                rows={5}
                value={currentStepNotes}
              />

              {isTechnician ? (
                <div className="flex flex-wrap gap-3">
                  {currentStep.status === "PENDING" &&
                  workOrder.status === "IN_PROGRESS" ? (
                    <Button
                      aria-label={`Start ${currentStep.title}`}
                      data-voice-label={`start ${currentStep.voiceLabel ?? currentStep.title}`}
                      disabled={actionMutation.isPending}
                      onClick={() => {
                        actionMutation.mutate({
                          kind: "start-step",
                          stepExecutionId: currentStep.id,
                        });
                      }}
                    >
                      {isPendingAction("start-step", currentStep.id)
                        ? "Starting step..."
                        : "Start current step"}
                    </Button>
                  ) : null}

                  {currentStep.status === "IN_PROGRESS" ? (
                    <>
                      <Button
                        aria-label="Save current step notes"
                        data-voice-label="save notes"
                        disabled={
                          actionMutation.isPending || !hasCurrentStepNoteChanges
                        }
                        onClick={() => {
                          actionMutation.mutate({
                            kind: "save-step-notes",
                            notes: currentStepNotes,
                            stepExecutionId: currentStep.id,
                          });
                        }}
                        variant="secondary"
                      >
                        {isPendingAction("save-step-notes", currentStep.id)
                          ? "Saving notes..."
                          : "Save notes"}
                      </Button>
                      <Button
                        aria-label={`Complete ${currentStep.title}`}
                        data-voice-label={`complete ${currentStep.voiceLabel ?? currentStep.title}`}
                        disabled={actionMutation.isPending}
                        onClick={() => {
                          actionMutation.mutate({
                            kind: "complete-step",
                            notes: currentStepNotes,
                            stepExecutionId: currentStep.id,
                          });
                        }}
                      >
                        {isPendingAction("complete-step", currentStep.id)
                          ? "Completing step..."
                          : "Complete current step"}
                      </Button>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-3xl border border-steel-100 bg-steel-50/70 px-4 py-3 text-sm text-steel-600">
                  Step execution controls are available only to the assigned
                  technician.
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
              All workflow steps are complete. The work order is ready to close
              once final review is done.
            </div>
          )}
        </section>

        <section className="panel grid gap-4 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="data-label">Workflow timeline</span>
              <h3 className="mt-2 text-2xl font-semibold text-steel-900">
                Step progression
              </h3>
            </div>
            <p className="max-w-xl text-sm leading-6 text-steel-600">
              Each step stays concise and readable so technicians can confirm
              the next action quickly without digging through dense detail.
            </p>
          </div>

          <div className="grid gap-4">
            {workOrder.steps.map((step) => {
              const isCurrentStep = currentStep?.id === step.id;

              return (
                <article
                  className={`rounded-3xl border p-5 transition ${
                    isCurrentStep
                      ? "border-amber-300 bg-amber-50/80"
                      : "border-steel-100 bg-steel-50/70"
                  }`}
                  key={step.id}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="data-label">Step {step.order}</span>
                        <StatusBadge value={step.status} />
                        {isCurrentStep ? (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-steel-700">
                            Active focus
                          </span>
                        ) : null}
                      </div>
                      <h4 className="text-xl font-semibold text-steel-900">
                        {step.title}
                      </h4>
                      <p className="text-sm leading-6 text-steel-600">
                        {step.instruction}
                      </p>
                    </div>
                    <div className="min-w-44 rounded-2xl bg-white px-4 py-3 text-sm text-steel-600">
                      <div className="data-label">Voice label</div>
                      <div className="mt-2 font-medium text-steel-900">
                        {step.voiceLabel ?? "Not set"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="data-label">Expected outcome</div>
                      <div className="mt-2 text-sm text-steel-600">
                        {step.expectedOutcome ??
                          "No expected outcome captured."}
                      </div>
                    </div>
                    <div>
                      <div className="data-label">Latest notes</div>
                      <div className="mt-2 text-sm text-steel-600">
                        {step.notes ?? "No notes added yet."}
                      </div>
                    </div>
                  </div>

                  {step.completedAt ? (
                    <div className="mt-4 text-xs font-medium uppercase tracking-[0.24em] text-steel-400">
                      Completed {new Date(step.completedAt).toLocaleString()}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
};

import type { WorkOrderDetail } from "@fieldassist/shared";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { ErrorPanel } from "@/components/states/error-panel";
import { LoadingPanel } from "@/components/states/loading-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { workOrdersApi } from "@/features/work-orders/work-orders-api";

export const WorkOrderDetailPage = () => {
  const params = useParams();
  const workOrderId = params.id;
  const workOrderQuery = useQuery<WorkOrderDetail>({
    enabled: Boolean(workOrderId),
    queryFn: () => workOrdersApi.getById(workOrderId ?? ""),
    queryKey: ["work-order", workOrderId],
  });

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

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="panel grid gap-5 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="data-label">{workOrder.code}</span>
            <StatusBadge value={workOrder.status} />
            <StatusBadge value={workOrder.priority} />
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-steel-900">
              {workOrder.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-steel-600">
              {workOrder.description}
            </p>
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
            <div className="rounded-3xl bg-steel-900 p-4 text-white">
              <div className="data-label text-white/60">Progress</div>
              <div className="mt-2 text-3xl font-semibold">
                {workOrder.progressPercent}%
              </div>
              <div className="mt-1 text-sm text-white/70">
                {workOrder.incidents.length} incident
                {workOrder.incidents.length === 1 ? "" : "s"} linked
              </div>
            </div>
          </div>
        </section>

        <section className="panel grid gap-4 p-6">
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
            <div className="data-label">Due</div>
            <div className="mt-2 text-base font-medium text-steel-900">
              {workOrder.dueAt
                ? new Date(workOrder.dueAt).toLocaleString()
                : "No due time"}
            </div>
          </div>
          <div>
            <div className="data-label">Latest incident</div>
            {workOrder.incidents[0] ? (
              <div className="mt-2 grid gap-2 rounded-3xl bg-rose-50 p-4">
                <StatusBadge value={workOrder.incidents[0].severity} />
                <div className="text-base font-semibold text-steel-900">
                  {workOrder.incidents[0].summary}
                </div>
                <div className="text-sm text-steel-600">
                  {workOrder.incidents[0].category}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-steel-600">
                No incidents reported.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="panel grid gap-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="data-label">Workflow</span>
            <h3 className="mt-2 text-2xl font-semibold text-steel-900">
              Step progression
            </h3>
          </div>
          <p className="max-w-xl text-sm leading-6 text-steel-600">
            Step controls and notes will be expanded in the technician workflow
            stage. The current screen already exposes the execution state and
            incident context.
          </p>
        </div>
        <div className="grid gap-4">
          {workOrder.steps.map((step: WorkOrderDetail["steps"][number]) => (
            <article
              className="rounded-3xl border border-steel-100 bg-steel-50/70 p-5"
              key={step.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="data-label">Step {step.order}</span>
                    <StatusBadge value={step.status} />
                  </div>
                  <h4 className="text-xl font-semibold text-steel-900">
                    {step.title}
                  </h4>
                  <p className="text-sm leading-6 text-steel-600">
                    {step.instruction}
                  </p>
                </div>
                <div className="max-w-xs rounded-2xl bg-white px-4 py-3 text-sm text-steel-600">
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
                    {step.expectedOutcome ?? "No expected outcome captured."}
                  </div>
                </div>
                <div>
                  <div className="data-label">Latest notes</div>
                  <div className="mt-2 text-sm text-steel-600">
                    {step.notes ?? "No notes added yet."}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

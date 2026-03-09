import type { WorkOrderListItem } from "@fieldassist/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { ErrorPanel } from "@/components/states/error-panel";
import { EmptyPanel } from "@/components/states/empty-panel";
import { LoadingPanel } from "@/components/states/loading-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { workOrdersApi } from "@/features/work-orders/work-orders-api";

export const TechnicianWorkOrdersPage = () => {
  const workOrdersQuery = useQuery<WorkOrderListItem[]>({
    queryFn: workOrdersApi.list,
    queryKey: ["work-orders"],
  });

  if (workOrdersQuery.isPending) {
    return (
      <LoadingPanel
        subtitle="Pulling assigned work orders and current progress from the operations API."
        title="Loading assigned work"
      />
    );
  }

  if (workOrdersQuery.isError) {
    return (
      <ErrorPanel
        description="The work order queue could not be loaded. Check that the API is running and try again."
        onRetry={() => {
          void workOrdersQuery.refetch();
        }}
        title="Work orders are unavailable"
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="data-label">Technician queue</span>
          <h2 className="mt-2 text-3xl font-semibold text-steel-900">
            Assigned work orders
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-steel-600">
          Choose the active order and move through the workflow with large,
          device-friendly controls.
        </p>
      </div>

      {workOrdersQuery.data.length === 0 ? (
        <EmptyPanel
          description="Assigned work orders will appear here as soon as they are scheduled. Live sync keeps this queue current without a manual refresh."
          title="No assigned work orders"
        />
      ) : (
        <div className="grid gap-4">
          {workOrdersQuery.data.map((workOrder: WorkOrderListItem) => (
            <Link
              className="panel grid gap-4 p-5 transition hover:-translate-y-0.5 hover:border-steel-200"
              data-voice-label={`open ${workOrder.code.toLowerCase()}`}
              key={workOrder.id}
              to={`/app/work-orders/${workOrder.id}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="data-label">{workOrder.code}</span>
                    <StatusBadge value={workOrder.status} />
                    <StatusBadge value={workOrder.priority} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-steel-900">
                      {workOrder.title}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-steel-600">
                      {workOrder.description}
                    </p>
                  </div>
                </div>
                <div className="rounded-3xl bg-steel-50 px-4 py-3 text-right">
                  <div className="data-label">Progress</div>
                  <div className="mt-2 text-3xl font-semibold text-steel-900">
                    {workOrder.progressPercent}%
                  </div>
                </div>
              </div>

              <div className="grid gap-4 border-t border-steel-100 pt-4 sm:grid-cols-3">
                <div>
                  <div className="data-label">Asset</div>
                  <div className="mt-2 text-base font-medium text-steel-900">
                    {workOrder.asset.name}
                  </div>
                  <div className="mt-1 text-sm text-steel-600">
                    {workOrder.asset.location}
                  </div>
                </div>
                <div>
                  <div className="data-label">Next step</div>
                  <div className="mt-2 text-base font-medium text-steel-900">
                    {workOrder.nextStepLabel ?? "Awaiting workflow start"}
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

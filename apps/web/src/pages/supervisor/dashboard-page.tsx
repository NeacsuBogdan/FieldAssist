import type { ActivityLogItem, DashboardSummary } from "@fieldassist/shared";
import { useQuery } from "@tanstack/react-query";

import { ErrorPanel } from "@/components/states/error-panel";
import { LoadingPanel } from "@/components/states/loading-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { dashboardApi } from "@/features/dashboard/dashboard-api";

const summaryCards: Array<{
  key: keyof DashboardSummary;
  label: string;
}> = [
  { key: "activeWorkOrders", label: "Active work orders" },
  { key: "assignedWorkOrders", label: "Assigned work orders" },
  { key: "openIncidents", label: "Open incidents" },
  { key: "techniciansActive", label: "Technicians active" },
];

export const SupervisorDashboardPage = () => {
  const summaryQuery = useQuery<DashboardSummary>({
    queryFn: dashboardApi.getSummary,
    queryKey: ["dashboard", "summary"],
  });
  const activityQuery = useQuery<ActivityLogItem[]>({
    queryFn: dashboardApi.getActivity,
    queryKey: ["dashboard", "activity"],
  });

  if (summaryQuery.isPending || activityQuery.isPending) {
    return (
      <LoadingPanel
        subtitle="Loading active work totals and the current operational timeline."
        title="Building supervisor dashboard"
      />
    );
  }

  if (summaryQuery.isError || activityQuery.isError) {
    return (
      <ErrorPanel
        description="The supervisor dashboard could not be loaded from the API."
        onRetry={() => {
          void summaryQuery.refetch();
          void activityQuery.refetch();
        }}
        title="Dashboard data is unavailable"
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="data-label">Supervisor oversight</span>
          <h2 className="mt-2 text-3xl font-semibold text-steel-900">
            Operational snapshot
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-steel-600">
          High-signal visibility into active jobs, open incidents, and the live
          operational timeline.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <section className="panel p-5" key={card.key}>
            <div className="data-label">{card.label}</div>
            <div className="mt-3 text-4xl font-semibold text-steel-900">
              {summaryQuery.data[card.key]}
            </div>
          </section>
        ))}
      </div>

      <section className="panel grid gap-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="data-label">Activity timeline</span>
            <h3 className="mt-2 text-2xl font-semibold text-steel-900">
              Recent events
            </h3>
          </div>
        </div>
        <div className="grid gap-4">
          {activityQuery.data.map((item: ActivityLogItem) => (
            <article
              className="grid gap-3 rounded-3xl border border-steel-100 bg-steel-50/70 p-5"
              key={item.id}
            >
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge value={item.entityType} />
                <span className="data-label">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="text-lg font-semibold text-steel-900">
                {item.action}
              </div>
              <div className="text-sm text-steel-600">
                {item.actor
                  ? `${item.actor.fullName} - ${item.actor.role.toLowerCase()}`
                  : "System"}{" "}
                - {item.entityId}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

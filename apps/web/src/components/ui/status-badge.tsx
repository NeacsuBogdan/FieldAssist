import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  ACKNOWLEDGED: "bg-sky-50 text-sky-700",
  ASSIGNED: "bg-slate-100 text-slate-700",
  BLOCKED: "bg-rose-50 text-rose-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CRITICAL: "bg-rose-50 text-rose-700",
  HIGH: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-cyan-50 text-cyan-700",
  LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-orange-50 text-orange-700",
  OPEN: "bg-rose-50 text-rose-700",
  PAUSED: "bg-stone-100 text-stone-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  SKIPPED: "bg-stone-100 text-stone-700",
};

export const StatusBadge = ({
  className,
  value,
}: {
  className?: string;
  value: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em]",
      statusStyles[value] ?? "bg-slate-100 text-slate-700",
      className,
    )}
  >
    {value.replaceAll("_", " ")}
  </span>
);

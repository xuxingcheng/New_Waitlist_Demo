import clsx from "clsx";
import type { TicketStatus } from "@/lib/db/types";

const statusStyles: Record<TicketStatus, string> = {
  WAITING: "border-slate-200 bg-slate-100 text-slate-700",
  NEEDS_CONFIRMATION: "border-amber-200 bg-amber-100 text-amber-800",
  CONFIRMED: "border-emerald-200 bg-emerald-100 text-emerald-800",
  DELAYED: "border-violet-200 bg-violet-100 text-violet-800",
  CHECK_IN_REQUIRED: "border-blue-200 bg-blue-100 text-blue-800",
  CHECKED_IN: "border-cyan-200 bg-cyan-100 text-cyan-800",
  SEATED: "border-orange-200 bg-orange-100 text-orange-800",
  FINISHED: "border-slate-200 bg-slate-50 text-slate-500",
  CANCELLED: "border-zinc-200 bg-zinc-100 text-zinc-600"
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-bold uppercase tracking-normal",
        statusStyles[status]
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

import { BarChart3 } from "lucide-react";
import type { DiningRecord } from "@/lib/db/types";

interface WaitTimePanelProps {
  averageDiningMinutes: number;
  partySizeAverageMinutes: Record<string, number>;
  diningRecords: DiningRecord[];
}

export function WaitTimePanel({
  averageDiningMinutes,
  partySizeAverageMinutes,
  diningRecords
}: WaitTimePanelProps) {
  return (
    <section className="queue-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-700" aria-hidden />
        <h2 className="text-lg font-black text-ink">Wait-Time Learning</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500">
            Current average
          </p>
          <p className="mt-1 text-3xl font-black text-ink">
            {averageDiningMinutes} min
          </p>
        </div>
        {Object.entries(partySizeAverageMinutes).map(([bucket, average]) => (
          <div key={bucket} className="rounded-md border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-normal text-slate-500">
              Party {bucket}
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-800">
              {average} min
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
        <div className="grid grid-cols-4 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-normal text-slate-500">
          <span>Ticket</span>
          <span>Party</span>
          <span>Table</span>
          <span>Duration</span>
        </div>
        <div className="divide-y divide-slate-100 bg-white">
          {diningRecords.slice(0, 5).map((record) => (
            <div
              key={record.id}
              className="grid grid-cols-4 px-3 py-2 text-sm text-slate-700"
            >
              <span className="font-bold">{record.ticketId.slice(0, 10)}</span>
              <span>{record.partySize}</span>
              <span>{record.tableId}</span>
              <span>{record.diningDurationMinutes} min</span>
            </div>
          ))}
          {diningRecords.length === 0 ? (
            <p className="px-3 py-5 text-sm text-slate-500">
              Dining records will appear after staff finishes a seated party.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

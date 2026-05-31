"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, BellRing, CheckCircle2, Clock3, MoveDown, Utensils } from "lucide-react";
import { DemoControls } from "@/components/DemoControls";
import { QueueTable } from "@/components/QueueTable";
import { VirtualGroupView } from "@/components/VirtualGroupView";
import { WaitTimePanel } from "@/components/WaitTimePanel";
import { useQueueSnapshot } from "@/lib/hooks/useQueueSnapshot";

const laneConfig = [
  {
    label: "Waiting",
    statuses: ["WAITING", "CONFIRMED"],
    icon: Clock3,
    color: "text-slate-700 bg-slate-100"
  },
  {
    label: "Confirm",
    statuses: ["NEEDS_CONFIRMATION"],
    icon: BellRing,
    color: "text-amber-800 bg-amber-100"
  },
  {
    label: "Delayed",
    statuses: ["DELAYED"],
    icon: MoveDown,
    color: "text-violet-800 bg-violet-100"
  },
  {
    label: "Check-in",
    statuses: ["CHECK_IN_REQUIRED", "CHECKED_IN"],
    icon: CheckCircle2,
    color: "text-blue-800 bg-blue-100"
  },
  {
    label: "Dining",
    statuses: ["SEATED", "FINISHED"],
    icon: Utensils,
    color: "text-orange-800 bg-orange-100"
  }
];

export default function DemoPage() {
  const { snapshot, loading, error, runAction } = useQueueSnapshot();
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");

  const selectedTicket = useMemo(
    () => snapshot?.tickets.find((ticket) => ticket.id === selectedTicketId),
    [selectedTicketId, snapshot?.tickets]
  );

  useEffect(() => {
    const firstAvailableTable = snapshot?.tables.find(
      (table) => table.status === "AVAILABLE"
    );

    if (!selectedTableId && firstAvailableTable) {
      setSelectedTableId(firstAvailableTable.id);
    }
  }, [selectedTableId, snapshot?.tables]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-normal text-emerald-700">
            Simulation
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-ink">
            Smart queue movement
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            The simulation exposes the algorithm path from queue number to online
            confirmation, delay, final check-in, seating, and dining history.
          </p>
        </div>
        {snapshot?.lastEvent ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
            {snapshot.lastEvent}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      {loading || !snapshot ? (
        <div className="queue-card p-8 text-center text-slate-500">
          Loading simulation...
        </div>
      ) : (
        <>
          <section className="queue-card p-4">
            <div className="grid gap-3 lg:grid-cols-5">
              {laneConfig.map((lane, index) => {
                const Icon = lane.icon;
                const count = snapshot.tickets.filter((ticket) =>
                  lane.statuses.includes(ticket.status)
                ).length;

                return (
                  <article
                    key={lane.label}
                    className="relative rounded-md border border-slate-200 bg-white p-4"
                  >
                    <div
                      className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md ${lane.color}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h2 className="text-base font-black text-ink">{lane.label}</h2>
                    <p className="mt-1 text-3xl font-black text-ink">{count}</p>
                    {index < laneConfig.length - 1 ? (
                      <ArrowDown
                        className="absolute -bottom-5 left-1/2 h-5 w-5 -translate-x-1/2 text-slate-400 lg:-right-5 lg:bottom-auto lg:left-auto lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0 lg:-rotate-90"
                        aria-hidden
                      />
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <DemoControls
            selectedTicket={selectedTicket}
            selectedTableId={selectedTableId}
            tables={snapshot.tables}
            onTableChange={setSelectedTableId}
            runAction={runAction}
          />
          <VirtualGroupView tickets={snapshot.activeTickets} />
          <QueueTable
            tickets={snapshot.tickets}
            selectedTicketId={selectedTicketId}
            onSelectTicket={setSelectedTicketId}
            includeCompleted
            title="Queue, Dining, and History"
            description="Select active, seated, or finished tickets to inspect each state transition."
            emptyMessage="No tickets yet."
          />
          <WaitTimePanel
            averageDiningMinutes={snapshot.averageDiningMinutes}
            partySizeAverageMinutes={snapshot.partySizeAverageMinutes}
            diningRecords={snapshot.diningRecords}
          />
        </>
      )}
    </main>
  );
}

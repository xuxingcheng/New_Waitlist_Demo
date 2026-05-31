"use client";

import { useEffect, useMemo, useState } from "react";
import { DemoControls } from "@/components/DemoControls";
import { QueueTable } from "@/components/QueueTable";
import { TableStatusPanel } from "@/components/TableStatusPanel";
import { WaitTimePanel } from "@/components/WaitTimePanel";
import { useQueueSnapshot } from "@/lib/hooks/useQueueSnapshot";

export default function AdminPage() {
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
            Staff
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-ink">
            Queue operations
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Staff can trigger confirmations, delay missed confirmations, call
            guests into final check-in, seat checked-in parties, and finish dining.
          </p>
        </div>
        {snapshot?.lastEvent ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
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
          Loading dashboard...
        </div>
      ) : (
        <>
          <DemoControls
            selectedTicket={selectedTicket}
            selectedTableId={selectedTableId}
            tables={snapshot.tables}
            onTableChange={setSelectedTableId}
            runAction={runAction}
          />
          <QueueTable
            tickets={snapshot.tickets}
            selectedTicketId={selectedTicketId}
            onSelectTicket={setSelectedTicketId}
            includeCompleted
            title="Queue, Dining, and History"
            description="Select active, seated, or finished tickets. Seated tickets can be finished from the controls."
            emptyMessage="No tickets yet."
          />
          <TableStatusPanel
            tables={snapshot.tables}
            tickets={snapshot.tickets}
            onSelectTicket={setSelectedTicketId}
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

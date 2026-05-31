import { Armchair } from "lucide-react";
import type { QueueTicket, RestaurantTable } from "@/lib/db/types";

interface TableStatusPanelProps {
  tables: RestaurantTable[];
  tickets: QueueTicket[];
  onSelectTicket?: (ticketId: string) => void;
}

export function TableStatusPanel({
  tables,
  tickets,
  onSelectTicket
}: TableStatusPanelProps) {
  return (
    <section className="queue-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Armchair className="h-5 w-5 text-emerald-700" aria-hidden />
        <h2 className="text-lg font-black text-ink">Tables</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tables.map((table) => {
          const currentTicket = tickets.find(
            (ticket) => ticket.id === table.currentTicketId
          );

          return (
            <article
              key={table.id}
              className="rounded-md border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-ink">{table.name}</h3>
                  <p className="text-sm text-slate-500">Capacity {table.capacity}</p>
                </div>
                <span
                  className={
                    table.status === "AVAILABLE"
                      ? "rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800"
                      : "rounded-md bg-orange-100 px-2 py-1 text-xs font-bold text-orange-800"
                  }
                >
                  {table.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {currentTicket
                  ? `${currentTicket.ticketNumber} ${currentTicket.customerName}`
                  : "Ready for the next matching party."}
              </p>
              {currentTicket && onSelectTicket ? (
                <button
                  className="action-button mt-3 w-full"
                  type="button"
                  onClick={() => onSelectTicket(currentTicket.id)}
                  title="Select seated ticket for dining actions"
                >
                  Select seated
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

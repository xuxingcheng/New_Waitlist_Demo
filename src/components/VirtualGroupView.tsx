import { Layers3 } from "lucide-react";
import type { QueueTicket } from "@/lib/db/types";
import { StatusBadge } from "./StatusBadge";

interface VirtualGroupViewProps {
  tickets: QueueTicket[];
}

export function VirtualGroupView({ tickets }: VirtualGroupViewProps) {
  const groups = tickets.reduce<Record<number, QueueTicket[]>>((acc, ticket) => {
    if (ticket.virtualGroup <= 0) {
      return acc;
    }

    acc[ticket.virtualGroup] = [...(acc[ticket.virtualGroup] ?? []), ticket];
    return acc;
  }, {});

  return (
    <section className="queue-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Layers3 className="h-5 w-5 text-violet-700" aria-hidden />
        <h2 className="text-lg font-black text-ink">Virtual Waiting Groups</h2>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {Object.entries(groups).map(([group, groupTickets]) => (
          <article key={group} className="rounded-md border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-3 py-2">
              <h3 className="font-black text-ink">Group {group}</h3>
              <p className="text-xs text-slate-500">Positions move after delays.</p>
            </div>
            <div className="space-y-2 p-3">
              {groupTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="font-black text-ink">
                      {ticket.position}. {ticket.ticketNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ticket.customerName}, party {ticket.partySize}
                    </p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
              ))}
            </div>
          </article>
        ))}
        {Object.keys(groups).length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">
            Add customers to see virtual electronic waiting-seat groups.
          </p>
        ) : null}
      </div>
    </section>
  );
}

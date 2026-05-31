"use client";

import clsx from "clsx";
import type { QueueTicket } from "@/lib/db/types";
import { formatClock, formatMinutes } from "@/lib/utils/time";
import { StatusBadge } from "./StatusBadge";

interface QueueTableProps {
  tickets: QueueTicket[];
  selectedTicketId?: string;
  onSelectTicket?: (ticketId: string) => void;
  includeCompleted?: boolean;
  title?: string;
  description?: string;
  emptyMessage?: string;
}

export function QueueTable({
  tickets,
  selectedTicketId,
  onSelectTicket,
  includeCompleted = false,
  title = "Active Queue",
  description = "Positions update after every confirmation, delay, check-in, and seating.",
  emptyMessage = "No active tickets yet."
}: QueueTableProps) {
  const visibleTickets = includeCompleted
    ? tickets
    : tickets.filter((ticket) => ticket.position > 0);

  return (
    <div className="queue-card overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-4">
        <div>
          <h2 className="text-lg font-black text-ink">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
          {visibleTickets.length} tickets
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-normal text-slate-500">
            <tr>
              <th className="px-4 py-3 font-bold">No.</th>
              <th className="px-4 py-3 font-bold">Guest</th>
              <th className="px-4 py-3 font-bold">Party</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Position</th>
              <th className="px-4 py-3 font-bold">Group</th>
              <th className="px-4 py-3 font-bold">Last confirm</th>
              <th className="px-4 py-3 font-bold">Due</th>
              <th className="px-4 py-3 font-bold">Wait</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {visibleTickets.map((ticket) => (
              <tr
                key={ticket.id}
                className={clsx(
                  "transition",
                  onSelectTicket ? "cursor-pointer hover:bg-emerald-50/60" : "",
                  selectedTicketId === ticket.id ? "bg-emerald-50" : ""
                )}
                onClick={() => onSelectTicket?.(ticket.id)}
              >
                <td className="px-4 py-3 font-black text-ink">
                  {ticket.ticketNumber}
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-slate-900">
                    {ticket.customerName}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{ticket.partySize}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">
                  {ticket.position || "-"}
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">
                  {ticket.virtualGroup || "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatClock(ticket.lastConfirmationAt)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatClock(ticket.confirmationDueAt)}
                </td>
                <td className="px-4 py-3 font-bold text-emerald-800">
                  {formatMinutes(ticket.estimatedWaitMinutes)}
                </td>
              </tr>
            ))}
            {visibleTickets.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={9}>
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

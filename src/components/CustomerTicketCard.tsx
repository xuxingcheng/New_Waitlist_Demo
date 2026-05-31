"use client";

import {
  Check,
  Clock3,
  MoveDown,
  QrCode,
  Ticket,
  TimerReset
} from "lucide-react";
import type { QueueTicket } from "@/lib/db/types";
import { formatClock, formatMinutes } from "@/lib/utils/time";
import { StatusBadge } from "./StatusBadge";

interface CustomerTicketCardProps {
  ticket: QueueTicket;
  onConfirm: () => void;
  onDelay: () => void;
  onCheckIn: () => void;
}

export function CustomerTicketCard({
  ticket,
  onConfirm,
  onDelay,
  onCheckIn
}: CustomerTicketCardProps) {
  const canConfirm = ticket.status === "NEEDS_CONFIRMATION";
  const canDelay = [
    "WAITING",
    "NEEDS_CONFIRMATION",
    "CONFIRMED",
    "CHECK_IN_REQUIRED"
  ].includes(ticket.status);
  const canCheckIn = ticket.status === "CHECK_IN_REQUIRED";

  return (
    <article className="queue-card overflow-hidden">
      <div className="border-b border-slate-100 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Your queue number</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-ink text-lg font-black text-white">
                <Ticket className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="text-4xl font-black tracking-normal text-ink">
                {ticket.ticketNumber}
              </h2>
            </div>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-100">
        <div className="bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500">
            Position
          </p>
          <p className="mt-1 text-3xl font-black text-ink">
            {ticket.position || "-"}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500">
            Virtual group
          </p>
          <p className="mt-1 text-3xl font-black text-ink">
            {ticket.virtualGroup || "-"}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500">
            Estimated wait
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-800">
            {formatMinutes(ticket.estimatedWaitMinutes)}
          </p>
        </div>
        <div className="bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500">
            Party
          </p>
          <p className="mt-1 text-2xl font-black text-ink">
            {ticket.partySize} guests
          </p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {canConfirm ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Please confirm that you are still waiting.
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Due by {formatClock(ticket.confirmationDueAt)}. Missing it moves
                  you back instead of removing you.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {canCheckIn ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-start gap-3">
              <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden />
              <div>
                <p className="text-sm font-bold text-blue-900">
                  Your table is almost ready.
                </p>
                <p className="mt-1 text-sm text-blue-800">
                  Complete final check-in so staff can seat your party.
                </p>
              </div>
            </div>
            <div className="mt-3 grid h-24 w-24 grid-cols-4 gap-1 rounded-md bg-white p-2 shadow-sm">
              {Array.from({ length: 16 }).map((_, index) => (
                <span
                  key={index}
                  className={
                    index % 3 === 0 || index === 5 || index === 14
                      ? "rounded-sm bg-ink"
                      : "rounded-sm bg-slate-200"
                  }
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-3">
          <button
            className="primary-button"
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            title="Confirm online"
          >
            <Check className="h-4 w-4" aria-hidden />
            Confirm
          </button>
          <button
            className="action-button"
            type="button"
            onClick={onDelay}
            disabled={!canDelay}
            title="Move to the next virtual waiting group"
          >
            <MoveDown className="h-4 w-4" aria-hidden />
            Delay
          </button>
          <button
            className="action-button"
            type="button"
            onClick={onCheckIn}
            disabled={!canCheckIn}
            title="Complete final check-in"
          >
            <TimerReset className="h-4 w-4" aria-hidden />
            Check in
          </button>
        </div>
      </div>
    </article>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, RefreshCw, UserPlus } from "lucide-react";
import { CustomerTicketCard } from "@/components/CustomerTicketCard";
import { StatusBadge } from "@/components/StatusBadge";
import { queueRepository } from "@/lib/db/mockQueueRepository";
import { useQueueSnapshot } from "@/lib/hooks/useQueueSnapshot";
import { formatMinutes } from "@/lib/utils/time";

const CURRENT_TICKET_KEY = "smart-restaurant-queue-demo:current-ticket";

export default function CustomerPage() {
  const { snapshot, loading, error, refresh, runAction } = useQueueSnapshot();
  const [customerName, setCustomerName] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [currentTicketId, setCurrentTicketId] = useState<string>("");

  useEffect(() => {
    const savedTicketId = window.localStorage.getItem(CURRENT_TICKET_KEY);

    if (savedTicketId) {
      setCurrentTicketId(savedTicketId);
    }
  }, []);

  const currentTicket = useMemo(
    () => snapshot?.tickets.find((ticket) => ticket.id === currentTicketId),
    [currentTicketId, snapshot?.tickets]
  );

  async function handleCreateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ticket = await runAction(() =>
      queueRepository.createTicket({ customerName, partySize })
    );

    if (ticket) {
      setCurrentTicketId(ticket.id);
      window.localStorage.setItem(CURRENT_TICKET_KEY, ticket.id);
      setCustomerName("");
      setPartySize(2);
      await refresh();
    }
  }

  function selectTicket(ticketId: string) {
    setCurrentTicketId(ticketId);
    window.localStorage.setItem(CURRENT_TICKET_KEY, ticketId);
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(320px,420px)_1fr] lg:px-8">
      <section className="space-y-5">
        <div>
          <p className="text-sm font-black uppercase tracking-normal text-emerald-700">
            Customer
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-ink">
            Take a number
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Guests can join remotely, receive queue updates, confirm online,
            delay themselves, and check in near their turn.
          </p>
        </div>

        <form className="queue-card space-y-4 p-5" onSubmit={handleCreateTicket}>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Name</span>
            <input
              className="input-field mt-1"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Mia"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Party size</span>
            <input
              className="input-field mt-1"
              type="number"
              min={1}
              max={12}
              value={partySize}
              onChange={(event) => setPartySize(Number(event.target.value))}
              required
            />
          </label>
          <button
            className="primary-button w-full"
            type="submit"
            disabled={!customerName.trim()}
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            Take queue number
          </button>
        </form>

        <div className="queue-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-ink">Ticket view</h2>
            <button className="action-button" type="button" onClick={() => void refresh()}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Refresh
            </button>
          </div>
          <select
            className="input-field mt-3"
            value={currentTicketId}
            onChange={(event) => selectTicket(event.target.value)}
          >
            <option value="">Choose ticket</option>
            {snapshot?.tickets.map((ticket) => (
              <option key={ticket.id} value={ticket.id}>
                {ticket.ticketNumber} {ticket.customerName}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
            {error}
          </div>
        ) : null}
      </section>

      <section className="space-y-5">
        {loading ? (
          <div className="queue-card p-8 text-center text-slate-500">
            Loading queue...
          </div>
        ) : currentTicket ? (
          <CustomerTicketCard
            ticket={currentTicket}
            onConfirm={() =>
              void runAction(() => queueRepository.confirmTicket(currentTicket.id))
            }
            onDelay={() =>
              void runAction(() =>
                queueRepository.delayTicket(currentTicket.id, "CUSTOMER_REQUEST")
              )
            }
            onCheckIn={() =>
              void runAction(() => queueRepository.checkInTicket(currentTicket.id))
            }
          />
        ) : (
          <div className="queue-card p-8 text-center text-slate-500">
            Create or choose a ticket to view queue status.
          </div>
        )}

        <section className="queue-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-700" aria-hidden />
            <h2 className="text-lg font-black text-ink">Live Queue</h2>
          </div>
          <div className="space-y-2">
            {snapshot?.activeTickets.slice(0, 6).map((ticket) => (
              <button
                key={ticket.id}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50"
                type="button"
                onClick={() => selectTicket(ticket.id)}
              >
                <span>
                  <span className="font-black text-ink">
                    {ticket.position}. {ticket.ticketNumber}
                  </span>
                  <span className="ml-2 text-sm text-slate-500">
                    Group {ticket.virtualGroup}, {formatMinutes(ticket.estimatedWaitMinutes)}
                  </span>
                </span>
                <StatusBadge status={ticket.status} />
              </button>
            ))}
            {snapshot?.activeTickets.length === 0 ? (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
                No guests are currently waiting.
              </p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}

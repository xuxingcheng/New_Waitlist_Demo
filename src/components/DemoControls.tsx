"use client";

import {
  Bell,
  Check,
  Clock3,
  Megaphone,
  MoveDown,
  Play,
  RefreshCw,
  RotateCcw,
  TimerReset,
  UserRoundCheck,
  Users,
  Utensils
} from "lucide-react";
import { queueRepository } from "@/lib/db/mockQueueRepository";
import type { QueueTicket, RestaurantTable } from "@/lib/db/types";

interface DemoControlsProps {
  selectedTicket?: QueueTicket;
  selectedTableId: string;
  tables: RestaurantTable[];
  onTableChange: (tableId: string) => void;
  runAction: <T>(action: () => Promise<T>) => Promise<T | null>;
}

function hasSelectedTicket(ticket?: QueueTicket): ticket is QueueTicket {
  return Boolean(ticket);
}

export function DemoControls({
  selectedTicket,
  selectedTableId,
  tables,
  onTableChange,
  runAction
}: DemoControlsProps) {
  const availableTables = tables.filter((table) => table.status === "AVAILABLE");
  const canSeat =
    selectedTicket?.status === "CHECKED_IN" &&
    selectedTableId &&
    availableTables.some((table) => table.id === selectedTableId);

  return (
    <section className="queue-card p-4">
      <div className="mb-4">
        <h2 className="text-lg font-black text-ink">Smart Queue Controls</h2>
        <p className="text-sm text-slate-500">
          Selected ticket:{" "}
          <span className="font-bold text-slate-800">
            {selectedTicket
              ? `${selectedTicket.ticketNumber} ${selectedTicket.customerName}`
              : "None"}
          </span>
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <button
          className="primary-button"
          type="button"
          onClick={() => void runAction(() => queueRepository.addSampleCustomers())}
          title="Add sample customers"
        >
          <Users className="h-4 w-4" aria-hidden />
          Add sample
        </button>
        <button
          className="action-button"
          type="button"
          onClick={() => void runAction(() => queueRepository.runAlgorithmStep())}
          title="Run one smart queue algorithm step"
        >
          <Play className="h-4 w-4" aria-hidden />
          Run step
        </button>
        <button
          className="action-button"
          type="button"
          onClick={() => void runAction(() => queueRepository.triggerConfirmationRound())}
          title="Trigger online confirmation"
        >
          <Bell className="h-4 w-4" aria-hidden />
          Confirm round
        </button>
        <button
          className="action-button"
          type="button"
          onClick={() => void runAction(() => queueRepository.simulateTimePassing(10))}
          title="Simulate time passing"
        >
          <Clock3 className="h-4 w-4" aria-hidden />
          +10 min
        </button>
        <button
          className="action-button"
          type="button"
          onClick={() => void runAction(() => queueRepository.callNextCustomer())}
          title="Call the next customer"
        >
          <Megaphone className="h-4 w-4" aria-hidden />
          Call next
        </button>
        <button
          className="action-button"
          type="button"
          onClick={() => void runAction(() => queueRepository.recalculateWaitTimes())}
          title="Recalculate positions and estimates"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Recalculate
        </button>
        <button
          className="danger-button"
          type="button"
          onClick={() => void runAction(() => queueRepository.resetDemo())}
          title="Reset demo data"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset
        </button>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="mb-3 text-sm font-black uppercase tracking-normal text-slate-500">
          Selected ticket actions
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <button
            className="action-button"
            type="button"
            disabled={!hasSelectedTicket(selectedTicket)}
            onClick={() =>
              selectedTicket
                ? void runAction(() => queueRepository.confirmTicket(selectedTicket.id))
                : undefined
            }
            title="Confirm selected customer"
          >
            <Check className="h-4 w-4" aria-hidden />
            Confirm selected
          </button>
          <button
            className="action-button"
            type="button"
            disabled={!hasSelectedTicket(selectedTicket)}
            onClick={() =>
              selectedTicket
                ? void runAction(() =>
                    queueRepository.delayTicket(
                      selectedTicket.id,
                      "MISSED_CONFIRMATION"
                    )
                  )
                : undefined
            }
            title="Simulate missed confirmation"
          >
            <MoveDown className="h-4 w-4" aria-hidden />
            Miss confirm
          </button>
          <button
            className="action-button"
            type="button"
            disabled={!hasSelectedTicket(selectedTicket)}
            onClick={() =>
              selectedTicket
                ? void runAction(() =>
                    queueRepository.delayTicket(
                      selectedTicket.id,
                      "CUSTOMER_REQUEST"
                    )
                  )
                : undefined
            }
            title="Customer requests delay"
          >
            <MoveDown className="h-4 w-4" aria-hidden />
            Request delay
          </button>
          <button
            className="action-button"
            type="button"
            disabled={!hasSelectedTicket(selectedTicket)}
            onClick={() =>
              selectedTicket
                ? void runAction(() =>
                    queueRepository.requireCheckInTicket(selectedTicket.id)
                  )
                : undefined
            }
            title="Require final check-in"
          >
            <TimerReset className="h-4 w-4" aria-hidden />
            Require check-in
          </button>
          <button
            className="action-button"
            type="button"
            disabled={!hasSelectedTicket(selectedTicket)}
            onClick={() =>
              selectedTicket
                ? void runAction(() => queueRepository.checkInTicket(selectedTicket.id))
                : undefined
            }
            title="Check in selected customer"
          >
            <UserRoundCheck className="h-4 w-4" aria-hidden />
            Check in
          </button>
          <div className="flex min-w-0 gap-2">
            <select
              className="input-field"
              value={selectedTableId}
              onChange={(event) => onTableChange(event.target.value)}
              title="Choose table for seating"
            >
              <option value="">Table</option>
              {availableTables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name} ({table.capacity})
                </option>
              ))}
            </select>
            <button
              className="action-button shrink-0"
              type="button"
              disabled={!canSeat || !selectedTicket}
              onClick={() =>
                selectedTicket
                  ? void runAction(() =>
                      queueRepository.seatTicket(selectedTicket.id, selectedTableId)
                    )
                  : undefined
              }
              title="Seat selected customer"
            >
              <Utensils className="h-4 w-4" aria-hidden />
              Seat
            </button>
          </div>
          <button
            className="action-button"
            type="button"
            disabled={selectedTicket?.status !== "SEATED"}
            onClick={() =>
              selectedTicket
                ? void runAction(() => queueRepository.finishDining(selectedTicket.id))
                : undefined
            }
            title="Finish dining"
          >
            <Utensils className="h-4 w-4" aria-hidden />
            Finish dining
          </button>
        </div>
      </div>
    </section>
  );
}

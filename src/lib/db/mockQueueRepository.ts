import {
  recalculateQueue,
  delayTicketInQueue,
  isActiveQueueTicket,
  runSmartQueueStep,
  sortByQueueOrder,
  triggerConfirmationRoundForTickets
} from "@/lib/algorithm/queueAlgorithm";
import { transitionTicketStatus } from "@/lib/algorithm/stateMachine";
import {
  getAverageDiningMinutes,
  getPartySizeAverages
} from "@/lib/algorithm/waitTimeEstimator";
import { sampleCustomers, seedDiningRecords, seedTables } from "@/data/seed";
import type {
  CreateTicketInput,
  DelayReason,
  DiningRecord,
  QueueMutationResult,
  QueueSnapshot,
  QueueTicket,
  RestaurantTable
} from "./types";
import type { QueueDemoRepository } from "./queueRepository";
import {
  minutesBetween,
  nowIso,
  subtractMinutes
} from "@/lib/utils/time";
import { formatTicketNumber } from "@/lib/utils/ticketNumber";

const STORAGE_KEY = "smart-restaurant-queue-demo:v1";

interface PersistedQueueState {
  tickets: QueueTicket[];
  diningRecords: DiningRecord[];
  tables: RestaurantTable[];
  nextTicketSequence: number;
  lastEvent?: string;
}

function cloneTables(): RestaurantTable[] {
  return seedTables.map((table) => ({ ...table }));
}

function cloneDiningRecords(): DiningRecord[] {
  return seedDiningRecords.map((record) => ({ ...record }));
}

function getInitialState(): PersistedQueueState {
  return {
    tickets: [],
    diningRecords: cloneDiningRecords(),
    tables: cloneTables(),
    nextTicketSequence: 1,
    lastEvent: "Demo ready. Add customers or take a number."
  };
}

function createId(prefix: string): string {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}-${randomId}`;
}

function loadState(): PersistedQueueState {
  if (typeof window === "undefined") {
    return getInitialState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const initialState = getInitialState();
    saveState(initialState);
    return initialState;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedQueueState;
    return {
      ...getInitialState(),
      ...parsed,
      tables: parsed.tables?.length ? parsed.tables : cloneTables(),
      diningRecords: parsed.diningRecords ?? []
    };
  } catch {
    const initialState = getInitialState();
    saveState(initialState);
    return initialState;
  }
}

function saveState(state: PersistedQueueState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getTicketOrThrow(state: PersistedQueueState, ticketId: string): QueueTicket {
  const ticket = state.tickets.find((current) => current.id === ticketId);

  if (!ticket) {
    throw new Error("Ticket not found.");
  }

  return ticket;
}

function makeSnapshot(state: PersistedQueueState): QueueSnapshot {
  const activeTickets = state.tickets
    .filter(isActiveQueueTicket)
    .sort(sortByQueueOrder);

  return {
    tickets: [...state.tickets].sort((a, b) => {
      if (isActiveQueueTicket(a) && isActiveQueueTicket(b)) {
        return sortByQueueOrder(a, b);
      }

      if (isActiveQueueTicket(a)) {
        return -1;
      }

      if (isActiveQueueTicket(b)) {
        return 1;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }),
    activeTickets,
    tables: state.tables,
    diningRecords: [...state.diningRecords].sort(
      (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
    ),
    averageDiningMinutes: getAverageDiningMinutes(state.diningRecords),
    partySizeAverageMinutes: getPartySizeAverages(state.diningRecords),
    lastEvent: state.lastEvent
  };
}

function persistAndSnapshot(
  state: PersistedQueueState,
  lastEvent: string
): QueueSnapshot {
  const updatedAt = nowIso();
  const nextState: PersistedQueueState = {
    ...state,
    tickets: recalculateQueue(
      state.tickets,
      state.diningRecords,
      state.tables,
      updatedAt
    ),
    lastEvent
  };

  saveState(nextState);
  return makeSnapshot(nextState);
}

export class MockQueueRepository implements QueueDemoRepository {
  async createTicket(input: CreateTicketInput): Promise<QueueTicket> {
    const state = loadState();
    const createdAt = nowIso();
    const ticketNumber = formatTicketNumber(state.nextTicketSequence);
    const activeCount = state.tickets.filter(isActiveQueueTicket).length;
    const ticket: QueueTicket = {
      id: createId("ticket"),
      ticketNumber,
      customerName: input.customerName.trim(),
      partySize: input.partySize,
      status: "WAITING",
      position: activeCount + 1,
      virtualGroup: 1,
      createdAt,
      updatedAt: createdAt,
      confirmationCount: 0,
      missedConfirmationCount: 0,
      estimatedWaitMinutes: 0,
      delayHistory: []
    };

    const snapshot = persistAndSnapshot(
      {
        ...state,
        tickets: [...state.tickets, ticket],
        nextTicketSequence: state.nextTicketSequence + 1
      },
      `${ticket.ticketNumber} joined the queue.`
    );

    return snapshot.tickets.find((current) => current.id === ticket.id) ?? ticket;
  }

  async getTicket(ticketId: string): Promise<QueueTicket | null> {
    const state = loadState();
    const snapshot = persistAndSnapshot(state, state.lastEvent ?? "Queue refreshed.");
    return snapshot.tickets.find((ticket) => ticket.id === ticketId) ?? null;
  }

  async listActiveTickets(): Promise<QueueTicket[]> {
    const snapshot = await this.getSnapshot();
    return snapshot.activeTickets;
  }

  async updateTicket(
    ticketId: string,
    updates: Partial<QueueTicket>
  ): Promise<QueueTicket> {
    const state = loadState();
    const updatedAt = nowIso();
    const tickets = state.tickets.map((ticket) => {
      if (ticket.id !== ticketId) {
        return ticket;
      }

      if (updates.status) {
        transitionTicketStatus(ticket, updates.status, updatedAt);
      }

      return {
        ...ticket,
        ...updates,
        updatedAt
      };
    });
    const snapshot = persistAndSnapshot(
      { ...state, tickets },
      "Ticket details updated."
    );
    const updatedTicket = snapshot.tickets.find((ticket) => ticket.id === ticketId);

    if (!updatedTicket) {
      throw new Error("Ticket not found.");
    }

    return updatedTicket;
  }

  async confirmTicket(ticketId: string): Promise<QueueTicket> {
    const state = loadState();
    const now = nowIso();
    const tickets = state.tickets.map((ticket) => {
      if (ticket.id !== ticketId) {
        return ticket;
      }

      const confirmed = transitionTicketStatus(ticket, "CONFIRMED", now);
      return {
        ...confirmed,
        lastConfirmationAt: now,
        confirmationDueAt: undefined,
        confirmationCount: confirmed.confirmationCount + 1
      };
    });
    const ticket = getTicketOrThrow(state, ticketId);
    const snapshot = persistAndSnapshot(
      { ...state, tickets },
      `${ticket.ticketNumber} confirmed online and stayed active.`
    );

    return getTicketOrThrow(
      {
        ...state,
        tickets: snapshot.tickets,
        diningRecords: snapshot.diningRecords,
        tables: snapshot.tables,
        nextTicketSequence: state.nextTicketSequence
      },
      ticketId
    );
  }

  async delayTicket(
    ticketId: string,
    reason: DelayReason
  ): Promise<QueueTicket> {
    const state = loadState();
    const now = nowIso();
    const ticket = getTicketOrThrow(state, ticketId);
    const tickets = delayTicketInQueue(state.tickets, ticketId, reason, now);
    const message =
      reason === "MISSED_CONFIRMATION"
        ? `${ticket.ticketNumber} missed confirmation and moved back one position.`
        : `${ticket.ticketNumber} moved to the next virtual waiting group.`;
    const snapshot = persistAndSnapshot({ ...state, tickets }, message);

    return getTicketOrThrow(
      {
        ...state,
        tickets: snapshot.tickets,
        diningRecords: snapshot.diningRecords,
        tables: snapshot.tables,
        nextTicketSequence: state.nextTicketSequence
      },
      ticketId
    );
  }

  async checkInTicket(ticketId: string): Promise<QueueTicket> {
    const state = loadState();
    const now = nowIso();
    const ticket = getTicketOrThrow(state, ticketId);
    const tickets = state.tickets.map((current) => {
      if (current.id !== ticketId) {
        return current;
      }

      return {
        ...transitionTicketStatus(current, "CHECKED_IN", now),
        checkedInAt: now
      };
    });
    const snapshot = persistAndSnapshot(
      { ...state, tickets },
      `${ticket.ticketNumber} completed final check-in.`
    );

    return getTicketOrThrow(
      {
        ...state,
        tickets: snapshot.tickets,
        diningRecords: snapshot.diningRecords,
        tables: snapshot.tables,
        nextTicketSequence: state.nextTicketSequence
      },
      ticketId
    );
  }

  async seatTicket(ticketId: string, tableId: string): Promise<QueueTicket> {
    const state = loadState();
    const now = nowIso();
    const ticket = getTicketOrThrow(state, ticketId);
    const table = state.tables.find((current) => current.id === tableId);

    if (!table) {
      throw new Error("Table not found.");
    }

    if (table.status !== "AVAILABLE") {
      throw new Error(`${table.name} is occupied.`);
    }

    if (table.capacity < ticket.partySize) {
      throw new Error(`${table.name} is too small for party size ${ticket.partySize}.`);
    }

    const tickets = state.tickets.map((current) => {
      if (current.id !== ticketId) {
        return current;
      }

      return {
        ...transitionTicketStatus(current, "SEATED", now),
        seatedAt: now,
        tableId,
        confirmationDueAt: undefined
      };
    });
    const tables = state.tables.map((current) =>
      current.id === tableId
        ? { ...current, status: "OCCUPIED" as const, currentTicketId: ticketId }
        : current
    );
    const snapshot = persistAndSnapshot(
      { ...state, tickets, tables },
      `${ticket.ticketNumber} was seated at ${table.name}.`
    );

    return getTicketOrThrow(
      {
        ...state,
        tickets: snapshot.tickets,
        diningRecords: snapshot.diningRecords,
        tables: snapshot.tables,
        nextTicketSequence: state.nextTicketSequence
      },
      ticketId
    );
  }

  async finishDining(ticketId: string): Promise<QueueTicket> {
    const state = loadState();
    const now = nowIso();
    const ticket = getTicketOrThrow(state, ticketId);

    if (!ticket.tableId || !ticket.seatedAt) {
      throw new Error("Ticket is not seated.");
    }

    const diningDurationMinutes = Math.max(1, minutesBetween(ticket.seatedAt, now));
    const diningRecord: DiningRecord = {
      id: createId("dining"),
      ticketId,
      partySize: ticket.partySize,
      tableId: ticket.tableId,
      seatedAt: ticket.seatedAt,
      finishedAt: now,
      diningDurationMinutes
    };
    const tickets = state.tickets.map((current) => {
      if (current.id !== ticketId) {
        return current;
      }

      return {
        ...transitionTicketStatus(current, "FINISHED", now),
        finishedAt: now
      };
    });
    const tables = state.tables.map((table) =>
      table.currentTicketId === ticketId
        ? { ...table, status: "AVAILABLE" as const, currentTicketId: undefined }
        : table
    );
    const snapshot = persistAndSnapshot(
      {
        ...state,
        tickets,
        tables,
        diningRecords: [...state.diningRecords, diningRecord]
      },
      `${ticket.ticketNumber} finished dining in ${diningDurationMinutes} minutes.`
    );

    return getTicketOrThrow(
      {
        ...state,
        tickets: snapshot.tickets,
        diningRecords: snapshot.diningRecords,
        tables: snapshot.tables,
        nextTicketSequence: state.nextTicketSequence
      },
      ticketId
    );
  }

  async getDiningHistory(): Promise<DiningRecord[]> {
    return (await this.getSnapshot()).diningRecords;
  }

  async addDiningRecord(record: DiningRecord): Promise<DiningRecord> {
    const state = loadState();
    persistAndSnapshot(
      { ...state, diningRecords: [...state.diningRecords, record] },
      "Dining record added."
    );
    return record;
  }

  async getSnapshot(): Promise<QueueSnapshot> {
    const state = loadState();
    return persistAndSnapshot(state, state.lastEvent ?? "Queue refreshed.");
  }

  async addSampleCustomers(): Promise<QueueMutationResult> {
    const state = loadState();
    let nextTicketSequence = state.nextTicketSequence;
    const createdAt = nowIso();
    const existingActiveCount = state.tickets.filter(isActiveQueueTicket).length;
    const ticketsToAdd = sampleCustomers.map((customer, index) => {
      const ticketNumber = formatTicketNumber(nextTicketSequence);
      nextTicketSequence += 1;

      return {
        id: createId("ticket"),
        ticketNumber,
        customerName: customer.customerName,
        partySize: customer.partySize,
        status: "WAITING" as const,
        position: existingActiveCount + index + 1,
        virtualGroup: 1,
        createdAt,
        updatedAt: createdAt,
        confirmationCount: 0,
        missedConfirmationCount: 0,
        estimatedWaitMinutes: 0,
        delayHistory: []
      };
    });
    const snapshot = persistAndSnapshot(
      {
        ...state,
        tickets: [...state.tickets, ...ticketsToAdd],
        nextTicketSequence
      },
      "Sample customers joined the restaurant queue."
    );

    return {
      snapshot,
      message: "Sample customers joined the restaurant queue."
    };
  }

  async triggerConfirmationRound(): Promise<QueueMutationResult> {
    const state = loadState();
    const now = nowIso();
    const tickets = triggerConfirmationRoundForTickets(state.tickets, now);
    const snapshot = persistAndSnapshot(
      { ...state, tickets },
      "Online confirmation round started."
    );

    return {
      snapshot,
      message: "Online confirmation round started."
    };
  }

  async requireCheckInTicket(ticketId: string): Promise<QueueTicket> {
    const state = loadState();
    const now = nowIso();
    const ticket = getTicketOrThrow(state, ticketId);
    const tickets = state.tickets.map((current) => {
      if (current.id !== ticketId) {
        return current;
      }

      return {
        ...transitionTicketStatus(current, "CHECK_IN_REQUIRED", now),
        checkInRequiredAt: now,
        confirmationDueAt: undefined
      };
    });
    const snapshot = persistAndSnapshot(
      { ...state, tickets },
      `${ticket.ticketNumber} is in final check-in.`
    );

    return getTicketOrThrow(
      {
        ...state,
        tickets: snapshot.tickets,
        diningRecords: snapshot.diningRecords,
        tables: snapshot.tables,
        nextTicketSequence: state.nextTicketSequence
      },
      ticketId
    );
  }

  async callNextCustomer(): Promise<QueueMutationResult> {
    const state = loadState();
    const snapshot = persistAndSnapshot(state, state.lastEvent ?? "Queue refreshed.");
    const nextTicket = snapshot.activeTickets.find((ticket) =>
      ["WAITING", "CONFIRMED", "DELAYED"].includes(ticket.status)
    );

    if (!nextTicket) {
      return {
        snapshot,
        message: "No waiting customer is ready to call."
      };
    }

    await this.requireCheckInTicket(nextTicket.id);
    const nextSnapshot = await this.getSnapshot();

    return {
      snapshot: nextSnapshot,
      message: `${nextTicket.ticketNumber} was called for final check-in.`
    };
  }

  async runAlgorithmStep(): Promise<QueueMutationResult> {
    const state = loadState();
    const now = nowIso();
    const result = runSmartQueueStep(
      state.tickets,
      state.diningRecords,
      state.tables,
      now
    );
    const message = result.events.join(" ");
    const snapshot = persistAndSnapshot(
      { ...state, tickets: result.tickets },
      message
    );

    return {
      snapshot,
      message
    };
  }

  async simulateTimePassing(minutes: number): Promise<QueueMutationResult> {
    const state = loadState();
    const tickets = state.tickets.map((ticket) => ({
      ...ticket,
      confirmationDueAt: ticket.confirmationDueAt
        ? subtractMinutes(ticket.confirmationDueAt, minutes)
        : undefined,
      checkInRequiredAt: ticket.checkInRequiredAt
        ? subtractMinutes(ticket.checkInRequiredAt, minutes)
        : undefined,
      seatedAt:
        ticket.status === "SEATED" && ticket.seatedAt
          ? subtractMinutes(ticket.seatedAt, minutes)
          : ticket.seatedAt
    }));
    const snapshot = persistAndSnapshot(
      { ...state, tickets },
      `${minutes} demo minutes passed.`
    );

    return {
      snapshot,
      message: `${minutes} demo minutes passed.`
    };
  }

  async recalculateWaitTimes(): Promise<QueueMutationResult> {
    const state = loadState();
    const snapshot = persistAndSnapshot(
      state,
      "Wait times, positions, and virtual groups were recalculated."
    );

    return {
      snapshot,
      message: "Wait times, positions, and virtual groups were recalculated."
    };
  }

  async resetDemo(): Promise<QueueMutationResult> {
    const state = getInitialState();
    saveState(state);
    const snapshot = makeSnapshot(state);

    return {
      snapshot,
      message: "Demo data reset."
    };
  }
}

// TODO: Replace MockQueueRepository with PostgresQueueRepository, SupabaseQueueRepository,
// FirebaseQueueRepository, or another durable adapter. The UI and smart queue algorithm
// call the QueueDemoRepository interface and should not need to change.
export const queueRepository = new MockQueueRepository();

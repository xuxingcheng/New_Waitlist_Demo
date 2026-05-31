import type {
  DelayEvent,
  DelayReason,
  DiningRecord,
  QueueTicket,
  RestaurantTable
} from "@/lib/db/types";
import { isPastDue, addMinutes } from "@/lib/utils/time";
import { assertCanTransition, transitionTicketStatus } from "./stateMachine";
import { estimateWaitMinutes } from "./waitTimeEstimator";

export const VIRTUAL_GROUP_SIZE = 3;
export const CONFIRMATION_WINDOW_MINUTES = 0.5;

export const activeQueueStatuses = [
  "WAITING",
  "NEEDS_CONFIRMATION",
  "CONFIRMED",
  "DELAYED",
  "CHECK_IN_REQUIRED",
  "CHECKED_IN"
] as const;

export function isActiveQueueTicket(ticket: QueueTicket): boolean {
  return activeQueueStatuses.includes(ticket.status as (typeof activeQueueStatuses)[number]);
}

export function getVirtualGroup(position: number): number {
  if (position <= 0) {
    return 0;
  }

  return Math.ceil(position / VIRTUAL_GROUP_SIZE);
}

export function sortByQueueOrder(a: QueueTicket, b: QueueTicket): number {
  const positionDelta = a.position - b.position;
  if (positionDelta !== 0) {
    return positionDelta;
  }

  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function recalculateQueue(
  tickets: QueueTicket[],
  diningRecords: DiningRecord[],
  tables: RestaurantTable[],
  updatedAt: string
): QueueTicket[] {
  const activeTickets = tickets.filter(isActiveQueueTicket).sort(sortByQueueOrder);
  const normalizedActive = activeTickets.map((ticket, index) => ({
    ...ticket,
    position: index + 1,
    virtualGroup: getVirtualGroup(index + 1),
    updatedAt
  }));
  const activeById = new Map(normalizedActive.map((ticket) => [ticket.id, ticket]));
  const withPositions = tickets.map((ticket) => {
    const activeTicket = activeById.get(ticket.id);

    if (activeTicket) {
      return activeTicket;
    }

    return {
      ...ticket,
      position: 0,
      virtualGroup: 0,
      estimatedWaitMinutes: 0
    };
  });
  const recalculatedActive = withPositions
    .filter(isActiveQueueTicket)
    .sort(sortByQueueOrder);

  return withPositions.map((ticket) => {
    if (!isActiveQueueTicket(ticket)) {
      return ticket;
    }

    return {
      ...ticket,
      estimatedWaitMinutes: estimateWaitMinutes(
        ticket,
        recalculatedActive,
        tables,
        diningRecords
      )
    };
  });
}

function mergeReorderedActiveTickets(
  allTickets: QueueTicket[],
  activeTickets: QueueTicket[]
): QueueTicket[] {
  const activeById = new Map(
    activeTickets.map((ticket, index) => [
      ticket.id,
      {
        ...ticket,
        position: index + 1,
        virtualGroup: getVirtualGroup(index + 1)
      }
    ])
  );

  return allTickets.map((ticket) => activeById.get(ticket.id) ?? ticket);
}

function createDelayEvent(
  ticket: QueueTicket,
  reason: DelayReason,
  newPosition: number,
  now: string
): DelayEvent {
  return {
    id: `delay-${ticket.id}-${Date.now()}`,
    ticketId: ticket.id,
    reason,
    oldPosition: ticket.position,
    newPosition,
    oldVirtualGroup: ticket.virtualGroup,
    newVirtualGroup: getVirtualGroup(newPosition),
    createdAt: now
  };
}

export function delayTicketInQueue(
  tickets: QueueTicket[],
  ticketId: string,
  reason: DelayReason,
  now: string
): QueueTicket[] {
  const activeTickets = tickets.filter(isActiveQueueTicket).sort(sortByQueueOrder);
  const oldIndex = activeTickets.findIndex((ticket) => ticket.id === ticketId);

  if (oldIndex < 0) {
    throw new Error("Only active queue tickets can be delayed.");
  }

  const target = activeTickets[oldIndex];
  assertCanTransition(target, "DELAYED");

  const activeWithoutTarget = activeTickets.filter((ticket) => ticket.id !== ticketId);
  const insertIndex =
    reason === "MISSED_CONFIRMATION"
      ? Math.min(oldIndex + 1, activeWithoutTarget.length)
      : Math.min(
          getVirtualGroup(target.position) * VIRTUAL_GROUP_SIZE + VIRTUAL_GROUP_SIZE - 1,
          activeWithoutTarget.length
        );
  const newPosition = insertIndex + 1;
  const delayEvent = createDelayEvent(target, reason, newPosition, now);
  const delayedTarget = transitionTicketStatus(target, "DELAYED", now);
  const nextTarget: QueueTicket = {
    ...delayedTarget,
    confirmationDueAt: undefined,
    checkInRequiredAt: undefined,
    missedConfirmationCount:
      reason === "MISSED_CONFIRMATION"
        ? delayedTarget.missedConfirmationCount + 1
        : delayedTarget.missedConfirmationCount,
    delayHistory: [...delayedTarget.delayHistory, delayEvent]
  };
  const reordered = [
    ...activeWithoutTarget.slice(0, insertIndex),
    nextTarget,
    ...activeWithoutTarget.slice(insertIndex)
  ];

  return mergeReorderedActiveTickets(tickets, reordered);
}

export function triggerConfirmationRoundForTickets(
  tickets: QueueTicket[],
  now: string
): QueueTicket[] {
  const confirmationDueAt = addMinutes(now, CONFIRMATION_WINDOW_MINUTES);
  const eligibleStatuses = new Set(["WAITING", "CONFIRMED", "DELAYED"]);

  return tickets.map((ticket) => {
    if (!isActiveQueueTicket(ticket) || !eligibleStatuses.has(ticket.status)) {
      return ticket;
    }

    return {
      ...transitionTicketStatus(ticket, "NEEDS_CONFIRMATION", now),
      confirmationDueAt
    };
  });
}

export function requireCheckInForReadyTickets(
  tickets: QueueTicket[],
  tables: RestaurantTable[],
  now: string
): QueueTicket[] {
  const availableTableCount = tables.filter(
    (table) => table.status === "AVAILABLE"
  ).length;
  const threshold = Math.max(1, availableTableCount + 1);
  const eligibleStatuses = new Set(["WAITING", "CONFIRMED", "DELAYED"]);

  return tickets.map((ticket) => {
    if (
      !isActiveQueueTicket(ticket) ||
      !eligibleStatuses.has(ticket.status) ||
      ticket.position > threshold
    ) {
      return ticket;
    }

    return {
      ...transitionTicketStatus(ticket, "CHECK_IN_REQUIRED", now),
      checkInRequiredAt: now,
      confirmationDueAt: undefined
    };
  });
}

export function runSmartQueueStep(
  tickets: QueueTicket[],
  diningRecords: DiningRecord[],
  tables: RestaurantTable[],
  now: string
): { tickets: QueueTicket[]; events: string[] } {
  const events: string[] = [];
  let nextTickets = recalculateQueue(tickets, diningRecords, tables, now);
  const overdueTickets = nextTickets.filter(
    (ticket) =>
      ticket.status === "NEEDS_CONFIRMATION" &&
      ticket.confirmationDueAt &&
      isPastDue(ticket.confirmationDueAt, now)
  );

  for (const overdueTicket of overdueTickets) {
    nextTickets = delayTicketInQueue(
      nextTickets,
      overdueTicket.id,
      "MISSED_CONFIRMATION",
      now
    );
    events.push(`${overdueTicket.ticketNumber} missed confirmation and moved back.`);
  }

  nextTickets = recalculateQueue(nextTickets, diningRecords, tables, now);
  const beforeCheckIn = new Map(nextTickets.map((ticket) => [ticket.id, ticket.status]));
  nextTickets = requireCheckInForReadyTickets(nextTickets, tables, now);

  for (const ticket of nextTickets) {
    if (
      beforeCheckIn.get(ticket.id) !== "CHECK_IN_REQUIRED" &&
      ticket.status === "CHECK_IN_REQUIRED"
    ) {
      events.push(`${ticket.ticketNumber} entered final check-in.`);
    }
  }

  nextTickets = recalculateQueue(nextTickets, diningRecords, tables, now);

  if (events.length === 0) {
    events.push("Queue positions, virtual groups, and wait times were recalculated.");
  }

  return { tickets: nextTickets, events };
}

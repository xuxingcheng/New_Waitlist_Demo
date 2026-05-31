import type { QueueTicket, TicketStatus } from "@/lib/db/types";

const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  WAITING: ["NEEDS_CONFIRMATION", "CHECK_IN_REQUIRED", "DELAYED", "CANCELLED"],
  NEEDS_CONFIRMATION: ["CONFIRMED", "DELAYED", "CANCELLED"],
  CONFIRMED: ["NEEDS_CONFIRMATION", "CHECK_IN_REQUIRED", "DELAYED", "CANCELLED"],
  DELAYED: ["NEEDS_CONFIRMATION", "CONFIRMED", "CHECK_IN_REQUIRED", "CANCELLED"],
  CHECK_IN_REQUIRED: ["CHECKED_IN", "DELAYED", "CANCELLED"],
  CHECKED_IN: ["SEATED", "CANCELLED"],
  SEATED: ["FINISHED"],
  FINISHED: [],
  CANCELLED: []
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return from === to || allowedTransitions[from].includes(to);
}

export function assertCanTransition(ticket: QueueTicket, to: TicketStatus): void {
  if (!canTransition(ticket.status, to)) {
    throw new Error(
      `Invalid ticket transition: ${ticket.ticketNumber} cannot move from ${ticket.status} to ${to}.`
    );
  }
}

export function transitionTicketStatus(
  ticket: QueueTicket,
  status: TicketStatus,
  updatedAt: string
): QueueTicket {
  assertCanTransition(ticket, status);

  return {
    ...ticket,
    status,
    updatedAt
  };
}

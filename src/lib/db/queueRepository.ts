import type {
  CreateTicketInput,
  DelayReason,
  DiningRecord,
  QueueMutationResult,
  QueueSnapshot,
  QueueTicket
} from "./types";

export interface QueueRepository {
  createTicket(input: CreateTicketInput): Promise<QueueTicket>;
  getTicket(ticketId: string): Promise<QueueTicket | null>;
  listActiveTickets(): Promise<QueueTicket[]>;
  updateTicket(
    ticketId: string,
    updates: Partial<QueueTicket>
  ): Promise<QueueTicket>;
  confirmTicket(ticketId: string): Promise<QueueTicket>;
  delayTicket(ticketId: string, reason: DelayReason): Promise<QueueTicket>;
  checkInTicket(ticketId: string): Promise<QueueTicket>;
  seatTicket(ticketId: string, tableId: string): Promise<QueueTicket>;
  finishDining(ticketId: string): Promise<QueueTicket>;
  getDiningHistory(): Promise<DiningRecord[]>;
  addDiningRecord(record: DiningRecord): Promise<DiningRecord>;
}

export interface QueueDemoRepository extends QueueRepository {
  getSnapshot(): Promise<QueueSnapshot>;
  addSampleCustomers(): Promise<QueueMutationResult>;
  triggerConfirmationRound(): Promise<QueueMutationResult>;
  requireCheckInTicket(ticketId: string): Promise<QueueTicket>;
  callNextCustomer(): Promise<QueueMutationResult>;
  runAlgorithmStep(): Promise<QueueMutationResult>;
  simulateTimePassing(minutes: number): Promise<QueueMutationResult>;
  recalculateWaitTimes(): Promise<QueueMutationResult>;
  resetDemo(): Promise<QueueMutationResult>;
}

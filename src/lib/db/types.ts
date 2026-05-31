export type TicketStatus =
  | "WAITING"
  | "NEEDS_CONFIRMATION"
  | "CONFIRMED"
  | "DELAYED"
  | "CHECK_IN_REQUIRED"
  | "CHECKED_IN"
  | "SEATED"
  | "FINISHED"
  | "CANCELLED";

export type DelayReason =
  | "MISSED_CONFIRMATION"
  | "CUSTOMER_REQUEST"
  | "STAFF_ACTION";

export interface DelayEvent {
  id: string;
  ticketId: string;
  reason: DelayReason;
  oldPosition: number;
  newPosition: number;
  oldVirtualGroup: number;
  newVirtualGroup: number;
  createdAt: string;
}

export interface QueueTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  partySize: number;
  status: TicketStatus;
  position: number;
  virtualGroup: number;
  createdAt: string;
  updatedAt: string;
  lastConfirmationAt?: string;
  confirmationDueAt?: string;
  confirmationCount: number;
  missedConfirmationCount: number;
  checkInRequiredAt?: string;
  checkedInAt?: string;
  seatedAt?: string;
  finishedAt?: string;
  tableId?: string;
  estimatedWaitMinutes: number;
  delayHistory: DelayEvent[];
}

export interface DiningRecord {
  id: string;
  ticketId: string;
  partySize: number;
  tableId: string;
  seatedAt: string;
  finishedAt: string;
  diningDurationMinutes: number;
}

export interface RestaurantTable {
  id: string;
  name: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED";
  currentTicketId?: string;
}

export interface CreateTicketInput {
  customerName: string;
  partySize: number;
}

export interface QueueSnapshot {
  tickets: QueueTicket[];
  activeTickets: QueueTicket[];
  tables: RestaurantTable[];
  diningRecords: DiningRecord[];
  averageDiningMinutes: number;
  partySizeAverageMinutes: Record<string, number>;
  lastEvent?: string;
}

export interface QueueMutationResult {
  ticket?: QueueTicket;
  snapshot: QueueSnapshot;
  message: string;
}

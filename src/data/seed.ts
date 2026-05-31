import type { CreateTicketInput, DiningRecord, RestaurantTable } from "@/lib/db/types";

export const sampleCustomers: CreateTicketInput[] = [
  { customerName: "Mia", partySize: 2 },
  { customerName: "Kevin", partySize: 4 },
  { customerName: "Yvonne", partySize: 3 },
  { customerName: "Leo", partySize: 5 },
  { customerName: "Nora", partySize: 2 },
  { customerName: "Alex", partySize: 6 }
];

export const seedTables: RestaurantTable[] = [
  { id: "T1", name: "Table 1", capacity: 2, status: "AVAILABLE" },
  { id: "T2", name: "Table 2", capacity: 4, status: "AVAILABLE" },
  { id: "T3", name: "Table 3", capacity: 4, status: "AVAILABLE" },
  { id: "T4", name: "Table 4", capacity: 6, status: "AVAILABLE" }
];

export const seedDiningRecords: DiningRecord[] = [
  {
    id: "seed-record-1",
    ticketId: "seed-ticket-1",
    partySize: 2,
    tableId: "T1",
    seatedAt: "2026-05-30T18:00:00.000Z",
    finishedAt: "2026-05-30T18:36:00.000Z",
    diningDurationMinutes: 36
  },
  {
    id: "seed-record-2",
    ticketId: "seed-ticket-2",
    partySize: 4,
    tableId: "T2",
    seatedAt: "2026-05-30T18:10:00.000Z",
    finishedAt: "2026-05-30T19:02:00.000Z",
    diningDurationMinutes: 52
  },
  {
    id: "seed-record-3",
    ticketId: "seed-ticket-3",
    partySize: 6,
    tableId: "T4",
    seatedAt: "2026-05-30T18:20:00.000Z",
    finishedAt: "2026-05-30T19:27:00.000Z",
    diningDurationMinutes: 67
  }
];

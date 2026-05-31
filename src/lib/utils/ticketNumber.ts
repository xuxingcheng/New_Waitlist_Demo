export function formatTicketNumber(sequence: number): string {
  return `A${String(sequence).padStart(3, "0")}`;
}

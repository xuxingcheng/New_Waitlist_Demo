import type { DiningRecord, QueueTicket, RestaurantTable } from "@/lib/db/types";

export const DEFAULT_AVERAGE_DINING_MINUTES = 45;

export function getPartySizeBucket(partySize: number): string {
  if (partySize <= 2) {
    return "1-2";
  }

  if (partySize <= 4) {
    return "3-4";
  }

  return "5+";
}

function average(records: DiningRecord[]): number | null {
  if (records.length === 0) {
    return null;
  }

  const total = records.reduce(
    (sum, record) => sum + record.diningDurationMinutes,
    0
  );
  return Math.round(total / records.length);
}

export function getAverageDiningMinutes(
  records: DiningRecord[],
  partySize?: number
): number {
  if (partySize) {
    const bucket = getPartySizeBucket(partySize);
    const bucketAverage = average(
      records.filter((record) => getPartySizeBucket(record.partySize) === bucket)
    );

    if (bucketAverage !== null) {
      return bucketAverage;
    }
  }

  return average(records) ?? DEFAULT_AVERAGE_DINING_MINUTES;
}

export function getPartySizeAverages(
  records: DiningRecord[]
): Record<string, number> {
  return ["1-2", "3-4", "5+"].reduce<Record<string, number>>((acc, bucket) => {
    const bucketAverage = average(
      records.filter((record) => getPartySizeBucket(record.partySize) === bucket)
    );
    acc[bucket] = bucketAverage ?? DEFAULT_AVERAGE_DINING_MINUTES;
    return acc;
  }, {});
}

export function estimateWaitMinutes(
  ticket: QueueTicket,
  activeTickets: QueueTicket[],
  tables: RestaurantTable[],
  diningRecords: DiningRecord[]
): number {
  const sortedTickets = [...activeTickets].sort((a, b) => a.position - b.position);
  const index = sortedTickets.findIndex((active) => active.id === ticket.id);

  if (index < 0) {
    return 0;
  }

  const availableTableCount = tables.filter(
    (table) => table.status === "AVAILABLE"
  ).length;
  const servingCapacity = Math.max(1, availableTableCount);
  const averageDiningMinutes = getAverageDiningMinutes(
    diningRecords,
    ticket.partySize
  );

  return Math.ceil((index / servingCapacity) * averageDiningMinutes);
}

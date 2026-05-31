const MINUTE_MS = 60_000;

export function nowIso(): string {
  return new Date().toISOString();
}

export function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * MINUTE_MS).toISOString();
}

export function subtractMinutes(iso: string, minutes: number): string {
  return addMinutes(iso, -minutes);
}

export function minutesBetween(startIso: string, endIso: string): number {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, Math.round(diff / MINUTE_MS));
}

export function isPastDue(iso: string, referenceIso = nowIso()): boolean {
  return new Date(iso).getTime() <= new Date(referenceIso).getTime();
}

export function formatClock(iso?: string): string {
  if (!iso) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) {
    return "Ready soon";
  }

  return `${minutes} min`;
}

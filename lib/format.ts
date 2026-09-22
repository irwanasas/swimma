const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getJakartaDateString(date: Date = new Date()): string {
  const jakartaMs = date.getTime() + JAKARTA_OFFSET_MS;
  return new Date(jakartaMs).toISOString().slice(0, 10);
}

export function getJakartaDayRangeIso(date: Date = new Date()): { start: string; end: string } {
  const dayString = getJakartaDateString(date);
  const startUtcMs = new Date(`${dayString}T00:00:00.000Z`).getTime() - JAKARTA_OFFSET_MS;
  const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;
  return { start: new Date(startUtcMs).toISOString(), end: new Date(endUtcMs).toISOString() };
}

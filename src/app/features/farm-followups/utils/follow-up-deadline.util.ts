const MS_PER_DAY = 86_400_000;

/** Local start of day for an ISO date / date-time string; date-only strings are not shifted by the timezone. */
export function startOfDay(value: string | null | undefined): Date | null {
  if (!value) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const d = dateOnly ? new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]) : new Date(value);
  return Number.isFinite(d.getTime()) ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;
}

/** Whole days from today until `endDate` (negative once it has passed); null without a usable date. */
export function daysUntil(endDate: string | null | undefined, now: Date = new Date()): number | null {
  const end = startOfDay(endDate);
  if (!end) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end.getTime() - today.getTime()) / MS_PER_DAY);
}

/** True once the end date is before today. A follow-up ending today is still open (matches the backend sweep). */
export function hasDeadlinePassed(endDate: string | null | undefined, now: Date = new Date()): boolean {
  const days = daysUntil(endDate, now);
  return days !== null && days < 0;
}
